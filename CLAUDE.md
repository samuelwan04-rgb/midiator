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
  load them in `index.html` (currently 10). Otherwise browsers keep showing the old files.
- Animations use GSAP-style scroll reveals (`.reveal`), split headings (`data-split`) and the
  braces/glint heading effect. Keep motion subtle; Sam asked not to overdo it.
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

## Forms

Two forms (early-access sign-up and "Pedal or MIDI controller not on the list?") post to
FormSubmit at `https://formsubmit.co/midiatorplanet@gmail.com` (Midiator's public address, also in
the Contact section and footer with Instagram @midiatorplanet). **Never put Sam's personal email in
the page.** FormSubmit needs a one-time activation: the first submission emails an activate link to
that inbox. Forms can't send from a `file://` page.

## Brand

- Colors: background `#0e100f`, cream text `#fffce1`, brand orange `#f2542d` → `#ffa37d`
  gradient; accents pink `#fec5fb`, lilac `#9d95ff`, blue `#00bae2`, green `#abff84`.
- Fonts: Geist and Geist Mono. Logo: `assets/midiator-mark.svg`.
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
