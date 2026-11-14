#!/usr/bin/env bash
# Klarity flow for the public sim-qa runner (AI-Samay/sim-qa-runner sim-qa.yml).
# Env from the workflow: UDID, BUNDLE_ID, SCHEME, DERIVED_DATA, OUT.
# Installs the Release simulator .app, then drives onboarding -> setup -> Today ->
# pause screen -> Apps -> Insights -> Settings with Maestro, saving screenshots to $OUT.
# Screenshots are for internal QA only. This script makes no builds, uploads or ASC writes.
set -uo pipefail
: "${UDID:?}" "${BUNDLE_ID:?}" "${DERIVED_DATA:?}" "${OUT:?}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
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
# Simulator app processes run on the host; launchctl list inside the sim missed live apps (run 43551412204).
alive() { pgrep -f "/${APP##*/}/" >/dev/null 2>&1; }

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
- tapOn:
    id: "onboarding-continue"
- extendedWaitUntil:
    visible:
      id: "paywall-screen"
    timeout: 20000
- assertVisible:
    id: "paywall-plan-monthly"
- assertVisible:
    id: "paywall-plan-yearly"
- assertVisible:
    id: "paywall-plan-lifetime"
- assertVisible: ".*\\$39\\.99 one-time purchase.*"
- assertVisible:
    id: "paywall-close"
Y
sleep 2; shot 02a-paywall-after-onboarding
# Trial lines need App Store products; under simctl launch there is no StoreKit session, so log only.
step 02b_paywall_trial_lines_optional <<'Y'
- assertVisible: ".*7 days free, then \\$2\\.99/month, cancel anytime.*"
- assertVisible: ".*7 days free, then \\$19\\.99/year, cancel anytime.*"
Y
sed -i '' -e 's/^FAIL 02b_/INFO 02b_/' "$RES" 2>/dev/null || sed -i 's/^FAIL 02b_/INFO 02b_/' "$RES"
step 02c_paywall_close <<'Y'
- scrollUntilVisible:
    element:
      id: "paywall-restore"
    direction: DOWN
    timeout: 10000
- assertVisible:
    id: "paywall-terms"
- assertVisible:
    id: "paywall-privacy"
- tapOn:
    id: "paywall-close"
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
    visible: "Still want Instagram\\?"
    timeout: 30000
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
- tapOn:
    id: "tab-apps"
- waitForAnimationToEnd
Y
shot 07-apps

step 08_insights <<'Y'
- tapOn:
    id: "tab-insights"
- waitForAnimationToEnd
Y
shot 08-insights

step 09_settings <<'Y'
- tapOn:
    id: "tab-settings"
- extendedWaitUntil:
    visible:
      id: "settings-restore"
    timeout: 15000
Y
shot 09-settings

step 10_paywall_from_settings <<'Y'
- tapOn:
    id: "settings-pro"
- extendedWaitUntil:
    visible:
      id: "paywall-screen"
    timeout: 15000
- assertVisible: ".*\\$39\\.99 one-time purchase.*"
- tapOn:
    id: "paywall-close"
- extendedWaitUntil:
    visible:
      id: "settings-pro"
    timeout: 15000
Y

# Paywall, purchase and restore with a local StoreKit session (XCUITest, same approach as ClearScan).
if grep -q TestableReference ios/*.xcodeproj/xcshareddata/xcschemes/*.xcscheme 2>/dev/null; then
  IAP_OUT="$OUT/iap"; mkdir -p "$IAP_OUT"
  xcrun simctl terminate "$UDID" "$BUNDLE_ID" >/dev/null 2>&1 || true
  xcrun simctl terminate "$UDID" dev.mobile.maestro-driver-iosUITests.xctrunner >/dev/null 2>&1 || true
  pkill -f maestro >/dev/null 2>&1 || true
  sleep 3
  mkdir -p /tmp/klarity-sk && cp "$ROOT/storekit/Klarity.storekit" /tmp/klarity-sk/Klarity.storekit
  TEST_RUNNER_SIM_QA_OUT="$IAP_OUT" TEST_RUNNER_STOREKIT_CONFIG="/tmp/klarity-sk/Klarity.storekit" \
  xcodebuild test-without-building -workspace "${WORKSPACE:-ios/Klarity.xcworkspace}" -scheme "${SCHEME:-Klarity}" -configuration Release \
    -destination "platform=iOS Simulator,id=$UDID" -derivedDataPath "$DERIVED_DATA" \
    -resultBundlePath "$IAP_OUT/iap.xcresult" -only-testing:KlarityQATests/SimQATests/testPaywallPurchaseAndRestore \
    > "$OUT/xcodebuild-test-iap.log" 2>&1
  echo "xcodebuild test exit: $?" | tee -a "$RES"
  tail -n 30 "$OUT/xcodebuild-test-iap.log" || true
  for f in "$IAP_OUT"/*.png; do [ -f "$f" ] && cp "$f" "$OUT/screenshots/"; done
  python3 - "$IAP_OUT/results.json" <<'PY' | tee -a "$RES"
import json, sys
try:
    st = json.load(open(sys.argv[1]))["steps"]
except Exception as e:
    print("FAIL iap results missing:", e); sys.exit(0)
for k, name in (("05", "local StoreKit paywall"), ("22", "purchase"), ("23", "restore")):
    ok = any(s["step"] == k and s["pass"] for s in st)
    det = [s["detail"] for s in st if s["step"] == k]
    print(("PASS" if ok else "FAIL"), "iap", k, name, "|", det[-1] if det else "no result")
PY
else
  echo "INFO no UI test target in scheme; StoreKit purchase/restore not run" | tee -a "$RES"
fi

# Crash reports for the app process, if any.
find "$HOME/Library/Logs/DiagnosticReports" -newer "$OUT/.start" -iname "*${SCHEME:-Klarity}*" 2>/dev/null | tee "$OUT/crash-reports.txt"
[ -s "$OUT/crash-reports.txt" ] && echo "CRASH reports found" | tee -a "$RES"

{ echo "## Klarity sim-qa"; echo; echo '```'; cat "$RES"; echo '```'; } > "$OUT/summary.md"
grep -q "^FAIL 01_launch\|CRASH" "$RES" && exit 1
exit 0
