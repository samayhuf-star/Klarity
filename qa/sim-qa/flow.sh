#!/usr/bin/env bash
# Klarity flow for the public sim-qa runner (AI-Samay/sim-qa-runner sim-qa.yml).
# Env from the workflow: UDID, BUNDLE_ID, SCHEME, DERIVED_DATA, OUT.
# Installs the Release simulator .app, then drives onboarding -> setup -> Today ->
# pause screen -> Apps -> Insights -> Settings with Maestro, saving screenshots to $OUT.
# Screenshots are for internal QA only. This script makes no builds, uploads or ASC writes.
set -uo pipefail
: "${UDID:?}" "${BUNDLE_ID:?}" "${DERIVED_DATA:?}" "${OUT:?}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
mkdir -p "$OUT/screenshots" "$OUT/maestro"
RES="$OUT/results.txt"; : > "$RES"; touch "$OUT/.start"
xcrun simctl boot "$UDID" 2>/dev/null || true
xcrun simctl bootstatus "$UDID" -b

APP="$(find "$DERIVED_DATA/Build/Products" -maxdepth 3 -path '*iphonesimulator/*.app' ! -name '*-Runner.app' ! -name '*Tests*.app' | head -n1)"
[ -n "$APP" ] || { echo "FAIL no .app" | tee -a "$RES"; exit 1; }
echo "app: $APP"
xcrun simctl install "$UDID" "$APP"

if ! command -v maestro >/dev/null 2>&1; then
  curl -Ls "https://get.maestro.mobile.dev" | bash
  export PATH="$HOME/.maestro/bin:$PATH"
fi

shot() { xcrun simctl io "$UDID" screenshot "$OUT/screenshots/$1.png" >/dev/null && echo "screenshot $1"; }
alive() { xcrun simctl spawn "$UDID" launchctl list 2>/dev/null | grep -q "$BUNDLE_ID"; }

step() { # name, yaml body
  local name="$1" f="$OUT/maestro/$1.yaml"
  { echo "appId: $BUNDLE_ID"; echo "---"; cat; } > "$f"
  if maestro test --debug-output "$OUT/maestro/$name" "$f" > "$OUT/maestro/$name.log" 2>&1; then
    echo "PASS $name" | tee -a "$RES"
  else
    echo "FAIL $name" | tee -a "$RES"; tail -n 25 "$OUT/maestro/$name.log"
  fi
  sleep 1
  if alive; then echo "ALIVE after $name" >> "$RES"; else echo "CRASH? app not running after $name" | tee -a "$RES"; fi
}

step 01_launch <<'Y'
- launchApp:
    clearState: true
- extendedWaitUntil:
    visible: "Welcome to Klarity"
    timeout: 60000
Y
shot 01-onboarding

step 02_onboarding <<'Y'
- tapOn: "Instagram"
- tapOn: "YouTube"
- tapOn: "Continue with 2 apps"
- extendedWaitUntil:
    visible: "Connect your apps"
    timeout: 20000
Y
shot 02-setup

step 03_today <<'Y'
- scrollUntilVisible:
    element: "Done"
    direction: DOWN
    timeout: 20000
- tapOn: "Done"
- extendedWaitUntil:
    visible: "Opens today"
    timeout: 20000
Y
shot 03-today

step 04_pause <<'Y'
- scrollUntilVisible:
    element: "Open Instagram"
    direction: DOWN
    timeout: 20000
- tapOn: "Open Instagram"
- extendedWaitUntil:
    visible: "Instagram"
    timeout: 15000
Y
sleep 2; shot 04-pause

step 05_choice <<'Y'
- extendedWaitUntil:
    visible: "Do something else"
    timeout: 90000
- tapOn: "Do something else"
- extendedWaitUntil:
    visible: "Just close this"
    timeout: 15000
Y
shot 05-swap

step 06_close <<'Y'
- tapOn: "Just close this"
- runFlow:
    when:
      visible: "Back to Klarity"
    commands:
      - tapOn: "Back to Klarity"
- extendedWaitUntil:
    visible: "Opens today"
    timeout: 20000
Y
shot 06-today-after-skip

step 07_apps <<'Y'
- tapOn: "Apps and rules"
- waitForAnimationToEnd
Y
shot 07-apps

step 08_insights <<'Y'
- tapOn: "Insights"
- waitForAnimationToEnd
Y
shot 08-insights

step 09_settings <<'Y'
- tapOn: "Settings"
- extendedWaitUntil:
    visible: "Daily opens goal"
    timeout: 15000
Y
shot 09-settings

# Crash reports for the app process, if any.
find "$HOME/Library/Logs/DiagnosticReports" -newer "$OUT/.start" -iname "*${SCHEME:-Klarity}*" 2>/dev/null | tee "$OUT/crash-reports.txt"
[ -s "$OUT/crash-reports.txt" ] && echo "CRASH reports found" | tee -a "$RES"

{ echo "## Klarity sim-qa"; echo; echo '```'; cat "$RES"; echo '```'; } > "$OUT/summary.md"
grep -q "^FAIL 01_launch\|CRASH" "$RES" && exit 1
exit 0
