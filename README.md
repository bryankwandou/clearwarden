# Clearwarden

A phone, tablet and laptop cleaner that does its work on your device. Nothing is uploaded. Every result can be stamped onto Solana devnet as a receipt that anyone can check.

- **Web app:** https://clearwarden.vercel.app (mirror: https://bryankwandou.github.io/clearwarden/)
- **Install as a web app:** open the site in Chrome or Edge and tap "Install app". It works offline after the first visit.
- **Android APK (release, v1.1):** [`release/clearwarden.apk`](release/clearwarden.apk), checksum in [`clearwarden.apk.sha256`](release/clearwarden.apk.sha256). Signed with the Clearwarden release key, certificate SHA-256 `105f751082f0888ad1d22c4d05868b5bd696650fd1ae567df0588c3752a0b55a`. The only permission it asks for is `INTERNET`. If you installed the earlier debug build, uninstall it first, because it was signed with a different key.
- **Languages:** English (default) and Bahasa Indonesia. Switch with the EN/ID button in the header.

## What it does

| Feature | Web (any browser) | Android APK | How it works |
|---|---|---|---|
| Malware file scan | Yes | Yes | SHA-256 match against a known-bad list, plus heuristics: disguised executables, double extensions, macro documents, PDFs with active content, obfuscated scripts, sideloaded APKs. Self-test with the EICAR file. |
| Link / domain check | Yes | Yes | Cloudflare malware-blocking DNS over HTTPS. A `0.0.0.0` answer means the domain is on the block list. |
| Junk, WhatsApp media, APK and large-file sweep | Chrome / Edge on desktop | Yes (inside the app's web view) | File System Access API. You pick a folder, review the list, then delete. Nothing is deleted without a tap. |
| Duplicate photos | Yes | Yes | Perceptual difference hash (9×8 dHash) with Hamming distance ≤ 5, so resized copies still match. |
| Vault (hidden files) | Yes | Yes | AES-256-GCM. Key from PBKDF2-SHA256, 310,000 rounds. Stored in IndexedDB. Optional Face ID, fingerprint or Windows Hello gate through WebAuthn. |
| Network speed test | Yes | Yes | Ping, jitter, download and upload against Cloudflare's speed endpoints. |
| Data usage | This session only | This session only | Resource timing of the page. A browser cannot read other apps' traffic. |
| Boost / clean this app's cache | Yes | Yes | Clears Cache Storage, service workers and session data for Clearwarden itself, and shows device memory, CPU threads, battery and connection type. |
| Solana devnet receipts | Yes | Yes | A burner keypair in the browser writes `cw1|kind|sha256|summary` with the Memo program. `#/verify?sig=…` reads it back from chain. |

## What it does not do, and why

Some items in the brief need system permissions that no website has and that a plain app wrapper does not get either. They are listed on the in-app "Native" page and are not faked:

- Clearing other apps' caches, killing other apps to "boost RAM", or scanning the whole phone storage. Android only allows this to system apps or with root.
- Blocking spam calls. Needs Android's `CallScreeningService` role, which is a native module that is not built yet.
- Hiding other apps, or a root on/off switch. These need a device-owner or root, and a root toggle is not something an app can safely offer.
- A free unlimited VPN. Running a VPN means running servers. The link check uses Cloudflare's filtered DNS instead.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
npm run build && npx vite preview --port 4173
node scripts/e2e.mjs # browser harness, writes docs/evidence and docs/video
```

`FUND_FROM=/path/to/devnet-keypair.json node scripts/e2e.mjs` funds the in-browser burner wallet with the Solana CLI instead of the devnet faucet, which is often rate-limited.

### Android

```bash
npm run build
npx cap sync android
cd android && ./gradlew assembleRelease
```

The release build signs itself when `~/.clearwarden/keystore.properties` exists (or a file named by `CW_KEYSTORE_PROPS`) with `storeFile`, `storePassword`, `keyAlias` and `keyPassword`. The key is not in this repo. Without it, Gradle produces an unsigned APK.

## Proof

- Screenshots from the harness: [`docs/evidence/`](docs/evidence/)
- Harness results, 21/21 passing: [`docs/evidence/results.json`](docs/evidence/results.json)
- Walkthrough video recorded by the harness (2 min 9 s): [`docs/video/walkthrough.mp4`](docs/video/walkthrough.mp4)
- A devnet receipt written and then read back from chain during the harness run: [32XtQ64s…TavdinA](https://explorer.solana.com/tx/32XtQ64s653iTFaLnhn55XvXdg5Q26VWNHELEVt21uL9nt6hhu97Tk3UUu5xX5rcJn6Hd9pCno1N25eksTavdinA?cluster=devnet), memo `cw1|scan|57c9923c…|1f/1flag`

## Stack

Vite, React 19, TypeScript, Tailwind CSS 4, `@solana/web3.js`, Capacitor 8, Playwright.

Devnet tokens have no value. This app never touches mainnet.
