# A1 Digital Agency Site

## Project Goal

Build a modern Russian-language website for a digital agency: контекстная реклама, SEO, сайты, аналитика, SMM, мобильные приложения.

The site should feel like a premium, calm, confident digital/product studio, not a loud generic agency landing page.

## Required Reading Before UI Work

Before creating or changing pages, open:

- `docs/design-rulebook.md`
- `references/reference-brief.md`
- `references/references.webp`

The visual reference is creative source material. Preserve its clean premium-tech mood, spacious hero, soft light background, compact pill navigation, service tags, strong CTA, large visual proof area, and separate result chart. Prototypes may borrow composition closely while exploring the look.

Do not use generated HTML imitations as visual source-of-truth. The screenshot in `references/references.webp` is the source; prototypes must be judged against it.

## Design Rules

- Write visible site copy in Russian unless explicitly asked otherwise.
- Use real business meaning: заявки, трафик, CPL, ROMI, SEO-рост, конверсии, скорость запуска.
- During prototyping, invented logos, numbers, cases, charts, and proof widgets are allowed as visual scaffolding.
- Treat factual cleanup as a separate pre-publication pass, not as a blocker for creative exploration.
- Avoid emojis in UI, markup, alt text, and documentation examples for the site.
- Do not use generic AI landing patterns: huge purple gradients, centered hero with vague slogans, three identical service cards, fake startup names, fake testimonials.
- Keep the reference's soft lavender allowed as a supporting tint, but avoid neon purple/blue glows.
- Use one main accent color plus neutral surfaces.
- Prefer asymmetric, editorial composition on desktop; collapse to clean single-column mobile layouts.
- Maintain touch targets of at least 44px.
- Respect `prefers-reduced-motion`.
- Animate only `transform` and `opacity` for UI motion.

## Build Rules

- Check `package.json` before importing any third-party package.
- Use existing project stack once selected. Until then, standalone HTML prototypes are acceptable in `prototypes/`, but not as visual references.
- Use semantic HTML: one `h1`, clear sections, real buttons/links, useful alt text.
- Test at desktop and mobile widths before delivery.
- Keep commits small and meaningful.
