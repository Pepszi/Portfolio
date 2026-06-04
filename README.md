# Portfolio website

The portfolio of Péter Madácsi

## Getting Started

Install dependencies:

```sh
npm install
```

Start Tailwind in watch mode:

```sh
npm run dev
```

Create a minified stylesheet:

```sh
npm run build
```

The generated stylesheet is written to `assets/styles.css`. `npm run build` also updates the stylesheet URL in `index.html` with a content hash (`?v=…`) so browsers fetch fresh CSS after each deploy.

Start a localhost:

```sh
python3 -m http.server 5173
```

## Technologies used

### Core Frontend

- HTML5
- CSS3
- Vanilla JavaScript (ES modules)

### CSS Framewroks

- Tailwind

### External Services and Integrations

- Cloudflare R2 public asset hosting
- Posthog for website analytics

