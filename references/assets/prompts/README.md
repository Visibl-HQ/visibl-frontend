## Reference screenshots

Prime Intellect UI captures are in [`../prime intellect/`](../prime%20intellect/) (`image1.png`–`image9.png`). See that folder’s README for an index.

## Generated Visibl assets (separate)

These prompts produce **Visibl-owned** artwork. They are not the Prime reference screenshots.

---

## 1. Assistant mark (`assistant-mark.svg` or `.png`)

**Filename:** `generated/assistant-mark.png`  
**Size:** 512×512, transparent background preferred

**Prompt:**

> Minimal geometric logomark for an AI workspace assistant named Visibl. Single continuous line forming an abstract eye or aperture inside a rounded square frame. Style: technical, Prime Intellect–level design maturity — monochrome ink on transparent, 2px stroke weight, no gradients, no glow, no 3D. Looks like it belongs next to Geist typography on a dark UI. Flat vector aesthetic.

---

## 2. Chat empty state (`chat-empty-state.png`)

**Filename:** `generated/chat-empty-state.png`  
**Size:** 800×600

**Prompt:**

> Empty state illustration for a founder chat workspace. Isometric or flat technical diagram: dotted conversation thread, three small memory pin cards, and a checklist doc panel connected by thin lines. Palette: warm off-white background (#fbfaf6), graphite lines (#1a1a1a at 12% opacity), single cyan accent (#5eb8d4) on one node. No characters, no purple gradients, no stock SaaS blobs. Editorial, calm, observatory aesthetic.

---

## 3. Landing hero texture (`hero-grid-texture.png`)

**Filename:** `generated/hero-grid-texture.png`  
**Size:** 2400×1600, seamless tileable

**Prompt:**

> Seamless subtle technical grid texture for a dark hero background. Orthogonal lines at 24px spacing, 3% white opacity on near-black (#0a0b10). Faint vignette toward edges. No stars, no nebula, no purple. Suitable as CSS background overlay for a SaaS landing page. Photoreal subtle paper grain optional at 2% strength.

---

## 4. Workspace sidebar texture (`sidebar-noise.png`)

**Filename:** `generated/sidebar-noise.png`  
**Size:** 512×512, tileable

**Prompt:**

> Tileable film grain noise texture, monochromatic, very subtle (5% contrast). For dark UI sidebar background overlay. Neutral gray, no color cast.

---

## Usage in code

After generating, copy assets to:

- `public/assets/brand/assistant-mark.png`
- `public/assets/marketing/chat-empty-state.png`
- `public/assets/marketing/hero-grid-texture.png`

Then wire paths in components (see `src/config/assets.ts` when added).
