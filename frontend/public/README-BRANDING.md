# Brand assets (drop-in)

Place the ORIGINAL artwork here (vite copies public/ to the dist root):

- `logo.png`    — full lockup (globe+plane, "SM Travels", "International"),
                  transparent or white background, ≥400px wide.
- `favicon.png` — square crop of just the globe+plane mark, 256×256 or larger.

Until these files exist, <BrandLogo> renders a text fallback and the favicon
link 404s harmlessly. No code change needed when the files land.
