# Midiator website

The marketing site for Midiator. It's plain HTML, CSS and JavaScript, with no build step and nothing to install.

- `index.html`: the page content
- `styles.css`: colors, fonts and layout (color tokens are at the top)
- `script.js`: the mobile menu, scroll fade-ins and the animated footswitches in the hero
- `assets/midiator-mark.svg`: the logo

## See it locally

Double-click `index.html` to open it in your browser. Or, from this folder:

```bash
python3 -m http.server 8000
```

then go to http://localhost:8000.

## Put it online (GitHub Pages)

On GitHub, open the repo's **Settings → Pages**, set **Source** to "Deploy from a branch", choose `main` and `/ (root)`, and save. The site appears at `https://<your-username>.github.io/midiator/` after a minute or two.

## Download button

The **Download for Mac** buttons jump to the Download section, whose button asks GitHub for the newest release of this repo and links straight to its `.dmg`. Releases are published here by the app repo's Release workflow, so the site needs no change for a new version. If GitHub can't be reached, the button links to the latest release page instead.

## Email

Both forms deliver to Sam's Gmail. The page only contains FormSubmit's random alias for that address (`60afdc30…` in the two `action=` lines in `index.html`), so the address itself isn't public.

Both forms on the site send through [FormSubmit](https://formsubmit.co), a free form-to-email service:

- **"Want to hear what's new?"** (bottom of the page, under Download): email, controller and pedals. Subject "Midiator sign-up: …".
- **"Pedal or MIDI controller not on the list?"** (under Gear). Subject "Midiator gear request: …".

**One-time setup:** the very first request sends a "confirm your form" email to that Gmail inbox. Click the activate link in it, and every request after that arrives in your inbox. Send yourself a test request once the site is live to trigger it. The form can't send from a page opened by double-clicking `index.html`; it needs the online site (or `python3 -m http.server`).

To send to a different address, replace the alias in both `action=` lines with the new address, then use the alias FormSubmit gives you for it.
