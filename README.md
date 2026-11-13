# Klarity

A calm pause before the apps you open on autopilot. Expo (SDK 58) + Expo Router, iOS only, fully on-device.

## How it intercepts apps
A user-created Shortcuts automation ("When <app> is opened → Open URL `klarity://pause/<id>`") launches Klarity's pause screen. No Screen Time / Family Controls entitlement is used.

## Develop
```
npm install --legacy-peer-deps
npm test          # pure logic tests (node)
npm run typecheck
npx expo start
```

## Ship (EAS)
```
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build --platform ios --profile production
npx eas-cli@latest submit --platform ios
```
Bundle ID: `com.samayhuf.klarity`. Listing copy: `docs/LISTING.md`. Privacy policy: `docs/PRIVACY.md`.

## Must verify on a real iPhone before App Review
1. Automation fires and opens `klarity://pause/<id>`.
2. After "Open <app>", the grace window prevents an endless bounce loop (one automatic return is allowed, then a "Return to <app>" button).
3. Evening check-in notification at 20:00.

## Roadmap
v2: Family Controls (real shields) once Apple approves the entitlement, Android build, home-screen widget.
