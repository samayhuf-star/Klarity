# Store metadata: staged, NOT pushed (ASO plan, 27 Nov 2026, Asia/Dhaka)

- `store.config.json` (repo root) is the EAS Metadata file with the proposed title, subtitle, keywords, description, promo text, categories and URLs from the ASO plan.
- `store-metadata/localized-drafts.json` (where present) holds DRAFT localized listings: Hindi for Ank and Hisaab, and an es-MX keyword field for the US-focused apps. These are files only.
- `store-metadata/screenshots/` (where present) holds captioned 6.9" (1320x2868) and 6.5" (1284x2778) sets. To regenerate: `python3 store-metadata/screenshots/make_captioned.py store-metadata/screenshots/captions.json out` (run from the screenshots folder so the raw/ paths resolve).

Rating prompt: src/app/pause/[id].tsx skip(), after the 3rd time the user chose not to open the app. Screenshots: the existing captioned 6.1" set was re-framed to 6.9" (1320x2868) and 6.5" (1284x2778); ASC currently has only 6.1".

## Do NOT run without Samay's explicit go
- `eas metadata:push`, or any App Store Connect / Play Console write.
- Never apply this to a version that is in review. Names and subtitles can only change on the next editable version.
- Screenshot upload, country selection and submission are done by hand in ASC after Samay says go.
- The listing must not mention AI. App privacy and owner: Samay Vashsht.
