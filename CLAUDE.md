# Midiator website: notes for Claude

The marketing site for **Midiator**, a free Mac app (Tauri) that turns the pedal presets a guitarist
has already made into one controller bank per song and writes it to the controller. The app's
code is in the separate repo `samuelwan04-rgb/ai-midi-pedalboard`, which has its own CLAUDE.md.
Owner: Sam, a worship guitarist in Singapore and a beginner coder. Explain steps plainly, give
click-by-click instructions for GitHub Desktop and the GitHub website, and don't assume terminal
experience.

## How the site works

- Plain `index.html` + `styles.css` + `script.js`, no build step. Hosted on GitHub Pages from
  `main` at https://samuelwan04-rgb.github.io/midiator/. Merging a PR into `main` publishes it.
- **Cache numbers:** after changing `styles.css` or `script.js`, raise `?v=N` on both lines that
  load them in `index.html` (currently 20; simulator.css/js have their own, currently 10). Otherwise browsers keep showing the old files.
- Reveals: `.reveal` fades up once when it scrolls into view (script.js). No split text, marquee or
  custom cursor any more (removed in the 2026-09-28 redesign).
- The share preview is `assets/og-image.png` (1200×630, tagline "Setlists, settled."). Raise its
  `?v=` in the `og:image` tag when it changes, or WhatsApp/Telegram keep the old one.

## Download button and releases

- The Download button (`data-download`) asks the GitHub API for the latest release of **this**
  repo and links straight to its `.dmg`, falling back to the releases page.
- Releases are not made here. The app repo's **Release** workflow (Actions tab → Release → Run
  workflow, after raising the version in `tauri.conf.json`, `package.json` and `Cargo.toml`)
  builds a universal Mac build and publishes it here, along with `latest.json` for the in-app
  updater. So the site needs no change for a new app version, but the Gear section may.
- Builds are ad-hoc signed (no paid Apple account), so first launch needs right-click → Open.
  On macOS 13/14 the plain double-click dialog only offers "Show in Finder / OK".

## Tutorial video

`assets/midiator-tutorial.mp4` (38.6 s, 1080p60, ~4 MB) opens in a `<dialog>` from the full-width
"Watch the tour" tile in Features, with `assets/tutorial-poster.jpg` as the tile's background. It's
rendered from the real app screens by `tools/tutorial-video/` in the app repo (`sh
tools/tutorial-video/make.sh`). Re-render it when the app's screens change, copy the 1080p file and
poster here, and raise the `?v=` on both.

## Redesign (2026-09-28)

Sam: the site felt mechanical, long and texty, the simulator too technical and "committed"; wanted
something fresh like morningstar.io / apple.com, for people who don't read much. Now: light by default
(dark via `prefers-color-scheme`), big short headlines, real app screenshots, ~35% shorter.
Order: hero (headline, one line, Download + Try it, app screenshot in a window frame) -> three stat
tiles (10 min / Every part / Zero code) -> **Try it** (#try) -> Features bento (#features: song card,
My presets, send review, tempo, scan/listen, video tile) -> Gear (#gear: brand names, "See every
device" `<details>`, one-line request form) -> FAQ (#faq) -> Download (dark, install steps in a
`<details>`, email sign-up) -> footer (contact email + Instagram). Never church-only wording.
**Screenshots** in `assets/shots/` (`*-light.jpg` / `*-dark.jpg`, swapped with `<picture>`) are taken
from the app with the tutorial-video demo songs (build its site, serve it, puppeteer at 2x). Retake
them when the app's screens change.

## Try it (#try)

`simulator.js` + `simulator.css`: a playful demo, no clock. Left, a builder: song name (+ quick
picks), BPM stepper, pedal chips (up to 3 of Drive/Delay/Reverb/Mod/Pitch), a row per part (A-E,
click the name to cycle names, click a sound chip to cycle that pedal's presets, then "no change"),
Add part, Shuffle sounds, and the only 8-bit element, the SEND button (Press Start 2P). Right, an
always-dark pedalboard: an MC6-style controller (top D E F, bottom A B C, F = Tap blinking at the
BPM) and the pedals, whose screens show the stomped part's presets. The board shows what was SENT;
edits dim it until Send again. First stomp reveals "That's Midiator." + Download / Start over.
simulator.js loads before script.js so its Download link gets the .dmg URL too.

## Forms

Two forms (email sign-up in Download, and "Missing something?" in Gear) post to
FormSubmit at `https://formsubmit.co/midiatorplanet@gmail.com` (Midiator's public address, also in
the footer with Instagram @midiatorplanet). **Never put Sam's personal email in
the page.** FormSubmit needs a one-time activation: the first submission emails an activate link to
that inbox. Forms can't send from a `file://` page.

## Brand

- Colors (tokens at the top of styles.css): warm off-white `#fbfaf8` / `#f2f0eb` tiles, ink
  `#16150f`, accent `#c93a15` (dark mode `#ff6b45`), brand `#f2542d` for the logo and the 8-bit
  button, near-black `#121110` for dark tiles and the Download section. Same palette as the app.
- Font: Geist. Logo: `assets/midiator-mark.svg`.
- Voice: short, plain, friendly, for church musicians rather than MIDI nerds. Taglines:
  "MIDI, mediated." and "Setlists, settled."

## Gear section

It's grouped by brand, with two labels:
- **Full support:** tested on real hardware. Currently only the Morningstar MC6 mkII, Strymon
  TimeLine and BigSky.
- **Supported (beta):** built from the maker's MIDI manual, not yet tested on hardware.

"Setup sheet" controllers (Boss ES-5/MS-3, RJM Mastermind, JET Unity6, M-VAVE Chocolate) can't be
written to, so Midiator shows what to enter per switch. Keep this section in step with the app's
device profiles (`app/src-tauri/resources/devices/` in the app repo). Only move something to Full
support once Sam has confirmed it on hardware.

## Working here

- Test with `python3 -m http.server 8000` and check both desktop and phone widths (no sideways
  scrolling at 390px).
- Feature claims must match what the app really does. Check the app repo before describing a
  feature.
