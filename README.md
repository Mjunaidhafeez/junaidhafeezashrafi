# Muhammad Junaid Hafeez — Portfolio

A modern, responsive portfolio website built with vanilla HTML, CSS, and JavaScript. Zero dependencies, maximum performance.

## Features

- **Dark/Light Theme** — Toggleable with system preference detection and localStorage persistence
- **Responsive Design** — Mobile-first, works on all screen sizes
- **Scroll Animations** — Intersection Observer-based, respects `prefers-reduced-motion`
- **Typing Animation** — Dynamic role cycling in the hero section
- **Counter Animation** — Animated stat counters with eased timing
- **Accessible** — Semantic HTML, ARIA labels, keyboard navigation, focus styles
- **Performance** — No frameworks, no build step, 100% static

## Project Structure

```
portfolio/
├── index.html        # Main HTML (semantic, SEO-optimized)
├── style.css         # All styles (CSS custom properties, responsive)
├── script.js         # Interactions (theme, animations, typing)
├── assets/           # Static assets (resume PDF, images)
│   └── resume.pdf    # Add your resume here
└── README.md
```

## Quick Start

### Option 1: Open Directly
Just open `index.html` in your browser.

### Option 2: Local Server (recommended)
```bash
# Python
python -m http.server 8000

# Node.js (npx)
npx serve .

# VS Code
# Install "Live Server" extension → Right-click index.html → Open with Live Server
```

## Deployment

Production site: [https://junaidhafeezashrafi.vercel.app](https://junaidhafeezashrafi.vercel.app)

Push to GitHub; Vercel deploys from the `main` branch.

```bash
git add .
git commit -m "Your message"
git push origin main
```

Firebase keys live in `firebase-config.js`. Do not commit `.env.local`.

## Customization

### Content
- Edit `index.html` to update text, links, and projects
- Replace `assets/resume.pdf` with your actual resume
- Update email in the contact section

### Styling
- Modify CSS custom properties in `:root` at the top of `style.css`
- Key tokens: `--accent-primary`, `--accent-secondary`, font families

### Typing Strings
- Edit `typingStrings` array in `script.js` to change the hero typing animation

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## License

MIT
