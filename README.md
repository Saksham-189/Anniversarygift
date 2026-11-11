# Anniversary letter

The finished anniversary page for 12 November 2026: the photo timeline and folded-note reasons lead to the personal letter for “baby,” signed by Saksham. One more thing reveals the nine-photo collage. Replay resets the experience without reloading. The page runs without dependencies or a framework build; the publication helper prepares a small static `dist/` folder.

## Run locally

From the workspace:

```powershell
cd anniversary
python3 -m http.server 8000
```

Open http://localhost:8000 in your browser. If your Python command is `python`, use `python -m http.server 8000` instead. Stop the server with Ctrl+C. ES modules require HTTP; double-clicking `index.html` with a `file://` URL will not work reliably.

## Edit content

Edit only `content.js` for names, dates, text, captions, reasons, and the final note. Values are plain text, never HTML. Keep the surrounding quotes and use typographic punctuation: ’ and “ ”. Put photos in `assets/photos/` and reference their relative paths in the content file.

Names, the celebration date, and all personal copy are filled in. The celebration date is `2026-11-12`, as requested; school memories retain their 2024 dates. The opening uses `Intl.DateTimeFormat` in UTC to avoid calendar-day shifts; invalid dates are hidden. Timeline dates are plain display strings, so a month, season, or exact date works. `timelineIntro` and `reasonsIntro` hold section headings and interface labels. The finale uses the supplied anniversary message, lightly edited for punctuation and paragraph breaks.

## Photos and moments

The moments page now follows the supplied editorial photography reference: a restrained dedication header, a full-width photographic opening with serif typography, warm stone paper, fine rules, and alternating photographic spreads. `content.timelineIntro.featuredMomentIndex` selects the existing timeline entry for the opening banner (zero-based); the featured image also opens in the lightbox. The memories link skips directly to the numbered story. The photos, captions, and chronological markers remain unchanged.

Edit the existing six entries in `content.timeline` to update the memories, in the order you want them told. Each needs a date (or empty string), short title, one or two sentence caption, relative photo path, and a brief description in `photoAlt`. Write descriptions of what the photo shows rather than repeating the caption.

- Resize photos to about 1200px on the long edge; export JPEG or WebP at around 150 to 300 KB each.
- Name files `01-first-meeting.jpg`, `02-first-trip.jpg`, and so on, and place them in `assets/photos/`.
- Strip location/EXIF metadata before publishing because the link is shareable.
- Thumbnails crop to 4:5 with `object-fit: cover`; the lightbox shows the full photo. Both use explicit dimensions, and thumbnail frames reserve space before lazy-loaded images arrive.
- Missing or empty photo paths use the local SVG placeholder. If that asset also fails, a text fallback appears in the same frame.

The native modal dialog uses warm parchment with dark ink text and a soft taupe backdrop, and keeps the page behind it inactive. Close with the visible Close photo button, Escape, or a tap outside; Tab stays inside, and focus returns to the original photo. No lightbox animation is needed: the picture opens directly in response to the tap.

### Supplied memories

The five supplied photos are copied into `assets/photos/`. Images 2 and 3 lead the story, labelled “Around February 2024”; images 1, 4, and 5 follow with their dates omitted. Captions are editable drafts based on the supplied context about class 12, long distance, and wanting to be close again.

The additional embrace photo is the sixth timeline memory, also undated. The three supplied Ghibli-style illustrations appear in an unnumbered “Our little storybook” gallery below the timeline. Edit its heading, description, and images in `content.illustrations`. The third illustration depicts the couple together. All gallery images reuse the same lightbox and missing-image fallback as the timeline.

Optional `photoPresentation` values in `content.js` handle these particular files: `camera` frames out the camera interface, `rotated` displays the sideways photo upright, and `collage` shows the full collage. These are CSS presentation choices; the supplied PNG files remain intact. Compression and metadata stripping remain part of the pre-publication photo pass in Phase 6.

## Reasons

The ten notes in `content.reasons` adapt seven supplied sentiments, with three additional lines about distance, shared memories, and being close again. Edit them freely, keeping 10 to 20 short plain-text reasons. Interface labels live in `content.reasonsIntro`. Each tap unfolds the next note, and a polite live region announces the reason. Enter and Space work on the reveal button. Input is guarded while the animation runs; reduced motion swaps the note instantly. Long reasons wrap and expand the paper rather than being cut off.

Fisher–Yates shuffles unread reasons once per visit. Local storage remembers the revealed indices, count, and last note; a reload resumes that progress and shuffles only what remains. Changing the reason list resets saved progress. Start again clears the revealed set and shuffles a fresh deck. Storage reads and writes are wrapped in try/catch, so blocked storage or corrupt saved data never prevents revealing notes. Blank and duplicate reasons are ignored.

The deck lives in `reasons.js` so state handling can be checked independently of the animation. Run from `anniversary/`:

```powershell
node --check app.js
node --check content.js
node --check reasons.js
node checks/reasons.mjs
node checks/reasons-ui.mjs
```

To check the UI, select Begin → Continue. Try rapid taps, Enter, and Space; the count should advance once per finished reveal. Reload halfway through and return to the reasons: the last note and count should be restored, with no repeated reasons. Finish the deck, then try Start again and Read my letter. With reduced motion enabled, the reveal should be instant. Check 360, 390, 430, 768, and 1280px for clipping and reachable controls.

## Personal letter and surprise

Edit the title, paragraph array, and sign-off in `content.finale`. The letter uses the display serif, comfortable line spacing, and plain-text paragraphs. All four surprise formats are supported by `surprise.js` and are rendered only after One more thing is pressed:

- `message`: displays `surprise.text`.
- `photo`: displays the caption and `mediaSrc` image, described by `photoAlt`, plus a full-size link so the collage can be viewed and zoomed separately.
- `video`: displays the caption and native playback controls, with `playsinline`, no autoplay, and no preloading before Play.
- `link`: displays the caption and a link to `mediaSrc` in a new tab with `noopener noreferrer`. Only HTTP/HTTPS URLs are accepted.

The current photo reveal is `assets/photos/anniversary-collage-baby.png`, composed from nine distinct supplied portraits (one upload was an exact duplicate). `photoWidth` and `photoHeight` reserve its correct aspect ratio. Its caption remains editable as real text in `content.js`. An empty or unavailable asset displays a quiet fallback instead of a broken image. Replay hides the reveal, stops and releases any video, clears the revealed reasons, resets navigation controls, and focuses the opening heading. It does not reload the page.

Run from `anniversary/`:

```powershell
node --check app.js
node --check content.js
node --check surprise.js
node checks/reasons.mjs
node checks/reasons-ui.mjs
node checks/surprise.mjs
```

The handler checks include a complete second visit after replay with both default and reduced motion; the surprise checks cover all four formats, invalid/missing sources, plain-text rendering, and video cleanup. In the browser, finish the reasons, select Read my letter, reveal One more thing, and Replay from the beginning. Verify that Begin and Continue work again and the reasons start at zero.

## Visual style

Laptop layouts retain the wide alternating photo spreads and bounded reading widths. At 1024px and above, the warm photo viewer places the picture beside its title and caption. On shorter laptop windows, the reasons page reduces decorative spacing while keeping full-size controls; long letters and notes remain scrollable. No content relies on hover, so mouse, keyboard, and touch all use the same controls.

Laptop browser checks covered 1024 × 640, 1366 × 768, 1440 × 900, and 1536 × 864. No horizontal overflow was found; the short-window reveal control remained in view, the wide lightbox fit within the viewport, and the reasons → letter → collage flow remained usable.

| Token | Hex | Role |
| --- | --- | --- |
| Wine ink | `#392532` | Text on paper in later sections |
| Dusty rose | `#C995A5` | Secondary text on midnight |
| Antique gold | `#D7B778` | Controls and small highlights |
| Pale paper | `#F3EFF2` | Main text on midnight; later letter surface |
| Midnight blue | `#171F35` | Opening background |

Cormorant Garamond for expressive headings and the letter; Manrope for captions and controls. The owner’s later pink-page reference adds Kalam for the playful reasons headings and notes. Google Fonts uses `display=swap`, with serif, cursive, and system sans fallbacks. All tokens are defined once in `styles.css`. Reduced motion skips the entrance and opening effects. Hidden sections are inert and become interactive again when shown. Optional audio and the days counter are omitted to keep the opening quiet. The reference-inspired backgrounds and static bear add no load animations. Asset prompts and locations are documented in `ASSET_NOTES.md`.

## Verify the opening and timeline

```powershell
node --check app.js
node --check content.js
```

Refresh the local page to replay the opening. At widths 360, 390, 430, 768, and 1280px, check that the date and placeholders wrap without horizontal scrolling. Press Tab to focus Begin (a visible outline), then Enter or Space. The paper-colored timeline introduction should appear, with focus on its heading and welcome removed from the tab order. Enable reduced motion in your operating system, then reload: both entrance and navigation should be instant. Tap Begin rapidly to confirm only one transition occurs.

Check the timeline at the same widths: photos and captions alternate at 768px and above, with a single column below. Open photos with Enter and Space; verify Tab and Shift+Tab stay on Close photo, Escape and the close button dismiss the dialog, and a tap outside dismisses it too. Each close should return focus to the same photo. Scroll to Continue and confirm it opens the reasons introduction with focus on its heading. To test a missing photo, temporarily set one entry’s `photo` to `assets/photos/missing.jpg`, reload, and scroll to it: the SVG placeholder should replace it without resizing the frame. Restore the photo path after this check.

## Publish and update

Host: Sites. Public URL: https://for-you-baby-november12.validelf4096.chatgpt.site/

The selected Site is recorded in `.openai/hosting.json`; reuse that project ID for every update. The audience is public, as requested. `noindex` asks search engines not to index the page; anyone with its URL can open it.

1. Edit `content.js` and replace or add photos in `assets/photos/`. Production uses WebP exports; original PNG masters remain local and are excluded from Git and `dist/`.
2. If photo masters or share-card content changed, use Python with Pillow to run the asset preparation command below. This creates metadata-free WebP images and a 1200 × 630 preview card from the content file.
3. Run `node scripts/prepare-site.mjs` to sync static preview metadata and copy only required runtime files/assets into `dist/`.
4. Run the checks below, then ask Codex to redeploy this same Site using its existing manifest. The Sites workflow pushes the matching source commit, packages `dist/`, saves that version, and deploys it to the same public URL.

```powershell
node --input-type=module -e 'import {content} from "./content.js"; process.stdout.write(JSON.stringify(content));' | python3 scripts/prepare-assets.py
node scripts/prepare-site.mjs
node checks/reasons.mjs
node checks/reasons-ui.mjs
node checks/surprise.mjs
node checks/prepublish.mjs
```

Use a Python installation with Pillow for asset preparation (one-time setup: `python3 -m pip install Pillow`). Ordinary local viewing needs only the HTTP server. If using the bundled desktop runtime, its Python already includes Pillow.

The publish check rejects unfilled personal placeholders, missing assets, uncompressed PNGs in `dist/`, and incorrect share-card metadata. The prepared static site is about 1.33 MB. Local mobile Lighthouse scored Performance 95 and Accessibility 100. Detailed scope is recorded in `QA_REPORT.md`.

After publishing, open the public link on iOS Safari, Android Chrome, and from WhatsApp. Check the chat preview, browser-bar resizing, photos, reasons, video controls if a video is later configured, and replay. Physical-device and chat-app checks require those devices/apps; desktop browser viewports do not replace them.
