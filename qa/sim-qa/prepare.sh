#!/usr/bin/env bash
# Klarity prepare step for the public sim-qa runner (after expo prebuild / pod install, before the build).
# CI only, never EAS. Only touches the generated ios/ folder on the runner:
#  - adds the KlarityQATests UI test target (qa/KlarityQATests/SimQATests.swift) with storekit/Klarity.storekit
#    as a test resource, so the runner picks build-for-testing;
#  - points the shared scheme's Run and Test actions at the StoreKit configuration.
# storekit/Klarity.storekit is already in the 3.0 shape that attaches on the runner (no team or app ids).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="${OUT:-$PWD/artifacts}"
mkdir -p "$OUT"
cd "$ROOT"
gem list -i xcodeproj >/dev/null 2>&1 || gem install xcodeproj --no-document --user-install
export PATH="$(ruby -e 'print Gem.user_dir')/bin:$PATH"
ruby qa/scripts/prepare-xcode-qa.rb | tee -a "$OUT/prepare.log"
{
  echo "==> StoreKit scheme references"
  grep -n "StoreKitConfigurationFileReference" -A1 ios/*.xcodeproj/xcshareddata/xcschemes/*.xcscheme || echo "none"
  grep -q TestableReference ios/*.xcodeproj/xcshareddata/xcschemes/*.xcscheme && echo "scheme has the UI test host"
  python3 -c 'import json;d=json.load(open("storekit/Klarity.storekit"));print([(s["productID"],s["displayPrice"],s.get("introductoryOffer",{}).get("subscriptionPeriod")) for s in d["subscriptionGroups"][0]["subscriptions"]],[(p["productID"],p["displayPrice"]) for p in d["products"]])'
} | tee -a "$OUT/prepare.log"
