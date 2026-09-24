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

## Email

Everything goes to samuelwan04@gmail.com for now.

- **"Request early access"** opens the visitor's own email app with a message to that address.
- **"Pedal or MIDI controller not on the list?"** (under Gear) sends through [FormSubmit](https://formsubmit.co), a free form-to-email service, so visitors don't need an email app.

**One-time setup for the gear form:** the very first request sends a "confirm your form" email to samuelwan04@gmail.com. Click the activate link in it, and every request after that arrives in your inbox. Send yourself a test request once the site is live to trigger it. The form can't send from a page opened by double-clicking `index.html`; it needs the online site (or `python3 -m http.server`).

To change the address later, search `index.html` and `script.js` for `samuelwan04@gmail.com`.
