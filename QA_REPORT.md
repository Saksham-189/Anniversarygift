# Final verification

- Celebration date: 12 November 2026. School memories remain dated around February 2024.
- Public audience explicitly requested by the owner. No analytics, account system, or message sending.
- Static runtime and required assets: approximately 1.33 MB. Image masters totalled 18.01 MB; WebP exports total 1.18 MB, a 93.5% reduction. Exported photos have no EXIF metadata.
- Open Graph preview: verified 1200 × 630 JPEG, absolute public image URL, static title and description in HTML, plus a large-image Twitter card. The preview can be read without JavaScript.
- Local mobile Lighthouse: Performance 95, Accessibility 100; FCP 1.6 s, LCP 2.9 s, CLS 0.002. This automated score covers the opening page; subsequent views were checked by keyboard and accessibility tree.
- Viewport checks cover phones/tablets at 360, 390, 430, and 768px, and laptops at 1024 × 640, 1280 × 900, 1366 × 768, 1440 × 900, and 1536 × 864. No horizontal overflow found.
- Keyboard: Begin/Continue, photo opening, dialog focus containment and focus return, note reveals, completion, surprise, and replay.
- State tests: Fisher–Yates shuffle, no repeats, reload recovery, reset, corrupt storage, blocked storage getter/read/write, duplicate/empty lists, rapid activation, and instant reduced-motion handlers.
- Surprise tests: message/photo/video/link, safe URL protocols, missing sources, native video controls without autoplay, media cleanup, and a complete second visit after replay.
- Browser failure fixture: missing photo correctly falls back to the SVG; a 944-character caption remains inside the scrollable dialog. This fixture and audit output are excluded from deployment.
- Publish checks: all content is filled, all referenced assets exist, no original PNGs are shipped, date/name and share metadata match, and the runtime output is under 2 MB.

## Verification limits

Actual iOS/Android devices, VoiceOver/TalkBack, WhatsApp/Instagram in-app browsers, and the final chat-card cache cannot be verified from this desktop session. The owner should open the live link on those devices/apps before sending it. Native local video playback requires a real video if that surprise type is configured later; the current surprise is a photo collage.
