# A1 Digital Agency Site

## Project Goal

Build a modern Russian-language website for a digital agency: контекстная реклама, SEO, сайты, аналитика, SMM, мобильные приложения.

The site should feel like a premium digital/product studio with a point of view. It may be calm, bold, playful, cinematic, or experimental, but it must never feel like a generic ChatGPT landing page.

## Required Reading Before UI Work

Before creating or changing pages, open:

- `docs/design-rulebook.md`
- `references/reference-brief.md`
- `references/references.webp`

The visual reference is creative source material. Preserve its clean premium-tech mood, spacious hero, soft light background, compact pill navigation, service tags, strong CTA, large visual proof area, and separate result chart. Prototypes may borrow composition closely while exploring the look.

Do not use generated HTML imitations as visual source-of-truth. The screenshot in `references/references.webp` is the source; prototypes must be judged against it.

Treat project rules as creative defaults, not hard bans. If a bold prototype is stronger than the written rule, explore it and judge it visually.

## Design Rules

- Write visible site copy in Russian unless explicitly asked otherwise.
- Use real business meaning: заявки, трафик, CPL, ROMI, SEO-рост, конверсии, скорость запуска.
- During prototyping, invented logos, numbers, cases, charts, and proof widgets are allowed as visual scaffolding.
- Treat factual cleanup as a separate pre-publication pass, not as a blocker for creative exploration.
- Use icons, symbols, emojis, custom marks, or playful glyphs only when they are part of a deliberate visual language, never as lazy default decoration.
- Avoid generic AI landing patterns: centered hero with vague slogans, two predictable CTA buttons, three identical cards, purple gradient blobs, interchangeable icons, and fake-polished SaaS copy.
- Keep the reference's soft lavender as the base mood, but allow stronger colors, glows, masks, texture, and unusual art direction when the concept earns it.
- Use `Poppins` as the primary font across the site; it is the closest practical match to the reference.
- Start from neutral surfaces plus the reference accent, but expand the palette when it makes the design more memorable and coherent.
- Prefer asymmetric, editorial composition on desktop; collapse to clean single-column mobile layouts.
- Maintain touch targets of at least 44px.
- Respect `prefers-reduced-motion`.
- For simple UI states, prefer cheap motion such as `transform` and `opacity`; for hero work, charts, SVG, masks, filters, canvas, WebGL, and brand moments, use whatever technique creates the strongest result and still runs smoothly.

## Skill Workflow

- For new pages and substantial UI changes, use the local Codex skills `frontend-design`, `design-taste-frontend`, and `ui-ux-pro-max` as design guardrails.
- For SEO structure, metadata, internal linking, schema, and page briefs, use the relevant local SEO skills: `seo`, `seo-page`, `seo-technical`, `seo-schema`, `seo-sitemap`, `keyword-research`, `content-gap-analysis`, and `seo-geo` when AI citation/GEO structure matters.
- For client-facing Russian copy, use `humanize-russian` and `infostyle` before treating text as publish-ready.
- For non-trivial build requests with unclear scope, use `spec-pilot`: clarify the task, write a short spec, get explicit approval, then implement.

## Client Work Report

Keep a client-facing work log in `reports/client-work-log.md`.

Update it after meaningful work that a client should understand: new pages, SEO structure, content architecture, UX improvements, performance/accessibility work, important bug fixes, integrations, analytics, or grouped small improvements.

Do not log every tiny internal correction. If several small fixes support one visible outcome, group them into one clear entry.

Write report entries in Russian, plainly and with care for a non-technical client. Explain necessary terms in parentheses on first use. Focus each entry on:

- what changed;
- why it was needed;
- how it helps the site, SEO, conversion, trust, or future maintenance;
- what is still placeholder or needs factual confirmation.

Use the report-writer role before finishing a significant task: review the actual diff, decide whether it belongs in the client report, and add or update the entry in a calm client-facing style.

## Build Rules

- Check `package.json` before importing any third-party package.
- Use existing project stack once selected. Until then, standalone HTML prototypes are acceptable in `prototypes/`, but not as visual references.
- Use semantic HTML: one `h1`, clear sections, real buttons/links, useful alt text.
- Test at desktop and mobile widths before delivery.
- Keep commits small and meaningful.
