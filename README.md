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

## Before launch

The "Request early access" button opens an email to `hello@midiator.io`. That domain isn't registered yet, so change the address in `index.html` (search for `mailto:`) or swap in a sign-up form.
