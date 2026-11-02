# Common brief — "Five Seeds of Christmas"

You are one of five independent design studios. Each studio receives one SHA-256 hash as a design seed and builds ONE interactive Christmas web page from it. The client's words (translated from Chinese): "A wildly imaginative, interactive Christmas-themed site that draws random inspiration from the hash. Beautiful and carefully designed. Showy and technically fancy, but NOT dazzling or cluttered. Many interactions, but each one simple; clear visual hierarchy; full of Christmas elements." Also: "Avoid default AI-generated website aesthetics. Explore an unconventional but coherent design language. The result should feel like it was made by a completely different design studio."

Your concept brief (in your prompt) was derived from your seed by the art director. Follow it closely — it was chosen so that the five pages differ from one another in layout, type, palette and interaction pattern. You may improve details, but do not drift toward a generic look.

## Quality bar
- Showpiece craft. One orchestrated hero moment, everything around it quiet. Restraint over effects soup: ambient motion is slow and low-contrast; nothing flashes; nothing competes with the hero.
- Interactions are discoverable and simple (one gesture each), give immediate tactile feedback, and stack in layers: (1) the hero interaction anyone finds in 2 seconds, (2) two or three secondary interactions, (3) small hidden delights for the curious.
- Every page includes at least one real, specific detail from the subject's own world (real names, real units, real dates, real conventions) as content.
- Copy is short, plain, specific English, written like a knowledgeable person. No lorem ipsum, no marketing fluff, no emoji, no em-dash asides, no "not X but Y" constructions.
- Show the seed subtly somewhere (e.g. a serial number or colophon line), and drive every random/generative element from a seeded PRNG built from the hash (e.g. sfc32 or mulberry32 seeded from the hash's first 16 bytes), so the page is deterministic per seed.
- Banned looks: purple-to-blue gradient heroes, glassmorphism card grids, centered hero + three feature cards, warm cream (#F4F1EA) + serif + terracotta, near-black with one acid-green pop, emoji as icons, `rounded-lg` everywhere, Inter / Space Grotesk / Roboto / Poppins / Montserrat / Playfair / Fraunces. Use the fonts named in your brief.

## Hard technical contract (the page is published as a claude.ai Artifact)
1. Deliver ONE self-contained file at the path given in your brief. Write page content directly: NO `<!doctype>`, `<html>`, `<head>`, `<body>` tags — the publisher wraps the file in a skeleton (charset + `viewport-fit=cover` viewport meta + a tiny reset: `:root` padded top/bottom by safe-area insets, `body{margin:0}`, `img{max-width:100%}`, `[hidden]{display:none!important}`). Keep the `:root` padding.
2. The file starts with `<title>…</title>` (a 2–4 word name given in your brief, no colon/dash explainer), then `<meta name="claude:viewport-fit-sides" content="cover">`, then font `<link>`s, then `<style>`.
3. External resources: stylesheets ONLY from fonts.googleapis.com (font files from fonts.gstatic.com), always with real fallback stacks. Scripts ONLY from CDNs, pinned exact versions. In this sandbox the CDNs are blocked by network policy, so the test harness mirrors exactly these and nothing else:
   - `https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js` (global `THREE`, r149; no examples/addons available — write any helper yourself)
   - `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js` (+ any plugin from gsap 3.12.5 dist, e.g. `.../gsap/3.12.5/Draggable.min.js`)
   Prefer no library at all (Canvas 2D / SVG / CSS / WebAudio by hand) unless it does substantial work. No other hosts: no images, no fetch, no audio files. Generate all imagery procedurally (canvas, SVG, CSS) or embed as data: URIs. Total size well under 2 MB.
4. Sandbox limits: no alert/confirm/prompt; no downloads; no window.print; no iframes/embeds; sound only after a user gesture and always behind a visible mute/unmute control (default off or started by an explicit button); localStorage only inside try/catch and only for niceties.
5. Responsive: must work at 390px phone width and 1440px desktop. The page body must NEVER scroll horizontally. Side gutter of at least 16px written as `padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px));` on body or the outer wrapper (use `padding-block` for vertical padding, never a `padding` shorthand there). Full-bleed canvases may run edge to edge, but text/controls stay inside the gutter. Things fixed to screen edges add `env(safe-area-inset-*)` to their offsets. For a one-screen app use `height:100%` on html/body (or `100dvh` with `100vh` fallback) — not bare `100vh`. Support touch (pointer events, `touch-action` set deliberately on interactive canvases so the page can still scroll where it should).
6. Theme: your brief says whether the page is single-theme or dual-theme. Either way, define every color as a CSS custom property on bare `:root` first and give `body` an explicit token background. Dual-theme pages follow exactly:
   ```css
   :root { --bg: …; --fg: …; }  /* light values */
   @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg: …; color-scheme: dark } }
   :root[data-theme="dark"] { --bg: …; color-scheme: dark }
   ```
   A deliberately single dark world sets `color-scheme: dark` on bare `:root` and omits the dark blocks. Canvas/WebGL code that needs colors reads them from the CSS tokens (getComputedStyle) and re-reads on theme change (matchMedia + MutationObserver on `data-theme`) if dual-theme.
7. Complete at rest: the very first frame (after fonts load) must already look finished and show what the page is: no content left at opacity 0 waiting for scroll/IntersectionObserver, no empty tool shell. Pages open in a lovely working state.
8. Accessibility & hygiene: visible `:focus-visible` styles, keyboard access for every control (buttons are `<button>`), `aria-label`s on icon-only controls, every form control has a stable `id`, respect `prefers-reduced-motion` (drop ambient motion, keep interactions working), close every tag, double-quote attributes, no console errors. Cap devicePixelRatio at 2 for canvases; pause rAF loops when `document.hidden`. Keep it smooth on a phone.

## Workflow
1. Read this file, then plan. Write the design tokens as the `:root` block with a one-line layout-concept comment above it.
2. Build the page at your assigned path.
3. Test with the shared harness (Playwright + Chromium with software WebGL; CDN requests are served from local mirrors; Google Fonts load through the proxy):
   ```bash
   node /tmp/claude-0/-home-user/c4c8b0d7-5ec3-50d5-ad7c-be502dfaf983/scratchpad/tools/shoot.js <your page.html> <your out dir> [--actions=<actions.js>] [--dark] [--full] [--wait=2000] [--only=desktop|phone]
   ```
   It wraps your file in the publish skeleton, screenshots desktop 1440×900 and phone 390×844 (`desktop-initial.png`, `phone-initial.png`), prints horizontal-overflow status, loaded fonts, console errors/warnings and failed requests. `--actions=file.js` runs `module.exports = async (page, shot, vp) => { … await shot('label') … }` after load so you can click/drag (page.mouse, page.touchscreen.tap etc.) and capture interaction states. Put out dirs and action scripts under `/tmp/claude-0/-home-user/c4c8b0d7-5ec3-50d5-ad7c-be502dfaf983/scratchpad/<your-slug>/`.
4. LOOK at your screenshots (Read the PNGs) with a harsh art-director eye: hierarchy, spacing, type rendering, overlaps, clipped text, contrast, mobile layout, whether it is beautiful. Exercise every interaction through an actions script and screenshot the results. Iterate until it is genuinely excellent and has zero console errors and no horizontal overflow at either width. Expect several rounds.
5. Do not publish anything and do not touch files outside your assigned page path and your scratch folder.
6. Final reply (concise, < 250 words): file path, the concept in two sentences, a list of the interactions, libraries used, and any known limitation. Include paths to your best 2–3 final screenshots.
