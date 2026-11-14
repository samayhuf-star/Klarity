import XCTest
import StoreKitTest

/// Klarity simulator QA (CI only, never part of a store build).
///
/// Starts a StoreKit test session from storekit/Klarity.storekit (monthly $2.99 and
/// yearly $19.99 with 1-week free trials, lifetime $39.99), then with real taps:
///   05-paywall   all three plans with local StoreKit prices and the 7-day trial line
///   22           monthly purchase through local StoreKit (no sandbox sign-in), Settings
///                shows "Klarity Pro is active"
///   23           Settings > Restore purchases shows "Restored"
/// Screenshots go to $SIM_QA_OUT; results to $SIM_QA_OUT/results.json.
/// Same approach as the Lulla, Scanwise and Klenzer QA hosts.
final class SimQATests: XCTestCase {
    private var session: SKTestSession?
    private var results: [[String: Any]] = []

    private var outDir: URL {
        let path = ProcessInfo.processInfo.environment["SIM_QA_OUT"] ?? "/tmp/sim-qa"
        return URL(fileURLWithPath: path, isDirectory: true)
    }

    override func setUpWithError() throws {
        continueAfterFailure = true
        try? FileManager.default.createDirectory(at: outDir, withIntermediateDirectories: true)
        startSession("setup")
    }

    private func startSession(_ tag: String) {
        let candidates: [String] = [
            ProcessInfo.processInfo.environment["STOREKIT_CONFIG"],
            Bundle(for: SimQATests.self).path(forResource: "Klarity", ofType: "storekit"),
        ].compactMap { $0 }
        for path in candidates where FileManager.default.fileExists(atPath: path) {
            do {
                let s = try SKTestSession(contentsOf: URL(fileURLWithPath: path))
                s.resetToDefaultState()
                s.disableDialogs = true
                s.clearTransactions()
                session = s
                NSLog("[klarity-qa] SKTestSession (\(tag)) from \(path)")
                return
            } catch {
                NSLog("[klarity-qa] SKTestSession (\(tag)) failed for \(path): \(error)")
            }
        }
        NSLog("[klarity-qa] no StoreKit test session (\(tag))")
    }

    // MARK: helpers

    private func shot(_ name: String) {
        let s = XCUIScreen.main.screenshot()
        try? s.pngRepresentation.write(to: outDir.appendingPathComponent("\(name).png"))
        let a = XCTAttachment(screenshot: s)
        a.name = name
        a.lifetime = .keepAlways
        add(a)
    }

    private func record(_ step: String, _ name: String, _ pass: Bool, _ detail: String) {
        results.append(["step": step, "name": name, "pass": pass, "detail": detail])
        if let data = try? JSONSerialization.data(withJSONObject: ["steps": results], options: [.prettyPrinted]) {
            try? data.write(to: outDir.appendingPathComponent("results.json"))
        }
        NSLog("[klarity-qa] step \(step) \(pass ? "PASS" : "FAIL") \(name): \(detail)")
    }

    private func labelContains(_ root: XCUIApplication, _ text: String) -> XCUIElement {
        root.descendants(matching: .any).matching(NSPredicate(format: "label CONTAINS %@", text)).firstMatch
    }

    private func byId(_ root: XCUIApplication, _ id: String) -> XCUIElement {
        root.descendants(matching: .any).matching(identifier: id).firstMatch
    }

    private func tapElement(_ el: XCUIElement) {
        if el.isHittable { el.tap() } else { el.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap() }
    }

    private func sandboxSignInShown() -> Bool {
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        for root in [springboard, XCUIApplication()] {
            for t in ["Sign in to Apple Account", "Sign In to Apple Account", "Sign in to the App Store"] {
                if labelContains(root, t).exists { return true }
            }
        }
        return false
    }

    private func cancelSignIn() {
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        for root in [springboard, XCUIApplication()] {
            let b = root.buttons["Cancel"].firstMatch
            if b.exists { tapElement(b); Thread.sleep(forTimeInterval: 1); return }
        }
    }

    @discardableResult
    private func confirmLocalStoreSheet() -> Bool {
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        for root in [XCUIApplication(), springboard] {
            for label in ["Subscribe", "Purchase", "Buy", "Confirm", "Start Free Trial", "Try It Free"] {
                let b = root.buttons[label].firstMatch
                if b.exists && b.isHittable {
                    shot("22a-local-storekit-sheet")
                    NSLog("[klarity-qa] local StoreKit sheet: tapping \(label)")
                    b.tap()
                    Thread.sleep(forTimeInterval: 2)
                    return true
                }
            }
        }
        return false
    }

    private func txInfo(_ productId: String) -> String {
        guard let session else { return "no SKTestSession" }
        let deadline = Date().addingTimeInterval(10)
        var txs: [SKTestTransaction] = []
        while Date() < deadline {
            txs = session.allTransactions()
            if txs.contains(where: { $0.productIdentifier == productId }) { break }
            Thread.sleep(forTimeInterval: 0.5)
        }
        guard let tx = txs.filter({ $0.productIdentifier == productId })
            .sorted(by: { $0.purchaseDate > $1.purchaseDate }).first else {
            return "no local \(productId) transaction (txs=\(txs.count))"
        }
        guard let exp = tx.expirationDate else { return "local tx \(productId), no expirationDate" }
        let days = exp.timeIntervalSince(tx.purchaseDate) / 86_400
        return "local tx \(productId) expires in \(String(format: "%.1f", days))d"
    }

    private func reachHome(_ app: XCUIApplication) -> Bool {
        // Run 43557321068: the zero-size "home-screen" marker view is pruned from the accessibility
        // tree, so Today was on screen but not found. Use the visible "Opens today" card and the tab instead.
        let home = labelContains(app, "Opens today")
        if home.waitForExistence(timeout: 20) || byId(app, "tab-settings").exists { return true }
        // Fresh state: onboarding -> paywall (closable) -> setup -> Today.
        let cont = byId(app, "onboarding-continue")
        if cont.waitForExistence(timeout: 10) {
            tapElement(cont)
            let close = byId(app, "paywall-close")
            if close.waitForExistence(timeout: 15) { tapElement(close) }
            let done = app.buttons["Done"].firstMatch
            for _ in 0..<4 where !(done.exists && done.isHittable) { app.swipeUp(); Thread.sleep(forTimeInterval: 0.5) }
            if done.exists { tapElement(done) }
        }
        return home.waitForExistence(timeout: 15) || byId(app, "tab-settings").exists
    }

    private func openSettings(_ app: XCUIApplication) {
        let tab = byId(app, "tab-settings")
        if tab.waitForExistence(timeout: 10) { tapElement(tab) }
        else if app.buttons["Settings"].firstMatch.exists { tapElement(app.buttons["Settings"].firstMatch) }
        Thread.sleep(forTimeInterval: 1)
    }

    // MARK: test

    func testPaywallPurchaseAndRestore() throws {
        let app = XCUIApplication()
        app.launchArguments += ["-AppleLanguages", "(en)", "-AppleLocale", "en_US"]
        var attempt = 1
        var purchased = false
        var purchaseDetail = "not attempted"

        while attempt <= 2 && !purchased {
            if attempt == 2 {
                NSLog("[klarity-qa] retry: new SKTestSession and relaunch")
                cancelSignIn()
                app.terminate()
                Thread.sleep(forTimeInterval: 3)
                startSession("retry")
                Thread.sleep(forTimeInterval: 3)
            }
            app.launch()
            guard reachHome(app) else {
                shot("21-home-missing-\(attempt)")
                record("05", "Home reached (attempt \(attempt))", false, "home-screen not found")
                attempt += 1
                continue
            }
            openSettings(app)
            let open = byId(app, "settings-pro")
            guard open.waitForExistence(timeout: 10) else {
                shot("21-settings-pro-missing-\(attempt)")
                record("05", "Settings > See Klarity Pro (attempt \(attempt))", false, "settings-pro not found")
                attempt += 1
                continue
            }
            tapElement(open)
            let paywall = byId(app, "paywall-screen")
            guard paywall.waitForExistence(timeout: 15) else {
                shot("21-paywall-missing-\(attempt)")
                record("05", "Paywall opened (attempt \(attempt))", false, "paywall-screen not found")
                attempt += 1
                continue
            }
            _ = labelContains(app, "$39.99").waitForExistence(timeout: 30)
            let monthlyTrial = labelContains(app, "7 days free, then $2.99/month, cancel anytime")
            let mOK = monthlyTrial.waitForExistence(timeout: 20)
            let yOK = labelContains(app, "7 days free, then $19.99/year, cancel anytime").exists
            let lOK = labelContains(app, "$39.99 one-time purchase").exists
            let noLifetimeTrial = !labelContains(app, "then $39.99").exists
            let restoreBtn = byId(app, "paywall-restore").exists
            let terms = byId(app, "paywall-terms").exists
            let privacy = byId(app, "paywall-privacy").exists
            let closeBtn = byId(app, "paywall-close").exists
            shot(attempt == 1 ? "05-paywall" : "05-paywall-retry")
            let lifetimeCard = byId(app, "paywall-plan-lifetime")
            if !(lifetimeCard.exists && lifetimeCard.isHittable) { app.swipeUp(); Thread.sleep(forTimeInterval: 1) }
            shot(attempt == 1 ? "05b-paywall-lower" : "05b-paywall-lower-retry")
            let paywallOK = mOK && yOK && lOK && noLifetimeTrial && restoreBtn && terms && privacy && closeBtn
            record("05", "Paywall: local StoreKit prices, 7-day trial, lifetime, restore, links, close (attempt \(attempt))", paywallOK,
                   "monthly=\(mOK) yearly=\(yOK) lifetime=\(lOK) noLifetimeTrial=\(noLifetimeTrial) restore=\(restoreBtn) terms=\(terms) privacy=\(privacy) close=\(closeBtn) session=\(session != nil)")

            let monthlyCard = byId(app, "paywall-plan-monthly")
            if !monthlyCard.isHittable { app.swipeDown(); Thread.sleep(forTimeInterval: 1) }
            tapElement(monthlyCard)
            Thread.sleep(forTimeInterval: 0.8)
            let buyBtn = byId(app, "paywall-buy")
            if !buyBtn.isHittable { app.swipeUp(); Thread.sleep(forTimeInterval: 1) }
            tapElement(buyBtn)
            var sheet = false
            var signIn = false
            var alertLabel = ""
            let deadline = Date().addingTimeInterval(45)
            while Date() < deadline {
                if sandboxSignInShown() { signIn = true; break }
                if confirmLocalStoreSheet() { sheet = true }
                if app.alerts.firstMatch.exists { alertLabel = app.alerts.firstMatch.label; break }
                if !paywall.exists { break }
                Thread.sleep(forTimeInterval: 0.5)
            }
            if signIn {
                shot("22-purchase-FAIL-sandbox-signin-\(attempt)")
                cancelSignIn()
                purchaseDetail = "attempt \(attempt): sandbox sign-in prompt, local StoreKit not attached"
                attempt += 1
                continue
            }
            if !alertLabel.isEmpty {
                shot("22-purchase-alert-\(attempt)")
                purchaseDetail = "attempt \(attempt): app alert \(alertLabel)"
                app.alerts.firstMatch.buttons.firstMatch.tap()
                attempt += 1
                continue
            }
            let tx = txInfo("com.samayhuf.klarity.monthly")
            Thread.sleep(forTimeInterval: 2)
            if paywall.exists { tapElement(byId(app, "paywall-close")) }
            let active = labelContains(app, "Klarity Pro is active").waitForExistence(timeout: 15)
            shot("22-purchase-success")
            purchased = active && tx.hasPrefix("local tx")
            purchaseDetail = "attempt \(attempt): paywallClosed=\(!paywall.exists) localSheetShown=\(sheet) proActive=\(active); \(tx)"
            if !purchased { attempt += 1 }
        }
        record("22", "Monthly purchase through local StoreKit (no sandbox sign-in)", purchased, purchaseDetail)

        var restoreOK = false
        var restoreDetail = "skipped, purchase did not complete"
        if purchased {
            let row = byId(app, "settings-restore")
            if row.waitForExistence(timeout: 10) {
                tapElement(row)
                var signIn = false
                var alertLabel = ""
                let deadline = Date().addingTimeInterval(40)
                while Date() < deadline {
                    if sandboxSignInShown() { signIn = true; break }
                    if app.alerts.firstMatch.exists { alertLabel = app.alerts.firstMatch.label; break }
                    Thread.sleep(forTimeInterval: 0.5)
                }
                if signIn {
                    shot("23-restore-FAIL-sandbox-signin")
                    cancelSignIn()
                    restoreDetail = "sandbox sign-in prompt on restore"
                } else if !alertLabel.isEmpty {
                    shot("23-restore-success")
                    restoreOK = alertLabel.contains("Restored")
                    restoreDetail = "alert: \(alertLabel); \(txInfo("com.samayhuf.klarity.monthly"))"
                    app.alerts.firstMatch.buttons.firstMatch.tap()
                    Thread.sleep(forTimeInterval: 1)
                    let still = labelContains(app, "Klarity Pro is active").exists
                    restoreDetail += "; proActiveAfter=\(still)"
                    restoreOK = restoreOK && still
                } else {
                    shot("23-restore-no-alert")
                    restoreDetail = "no alert within 40 s"
                }
            } else {
                shot("23-restore-missing")
                restoreDetail = "settings-restore row not found"
            }
        }
        record("23", "Restore purchases (Settings)", restoreOK, restoreDetail)
    }
}
