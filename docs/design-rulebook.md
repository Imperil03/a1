# A1 Design Rulebook

## 1. Direction

A1 is a digital agency website for businesses that need measurable growth from advertising, SEO, websites, analytics, SMM, and mobile products.

The visual direction is **premium-tech, clean, business-focused, and confident**. The site should look like a team that can handle money, leads, analytics, and product work with discipline. It should not look like a template agency with loud gradients and vague motivational copy.

Reference file:

- `references/references.webp`

Generated HTML imitations are not source-of-truth. If a prototype does not match the screenshot's typography, proportions, spacing rhythm, and composition quality, remove or rewrite it instead of treating it as a reference.

Reference mood:

- large white canvas on a soft cool background;
- compact pill navigation;
- strong black CTA;
- oversized but controlled headline;
- service tags near the hero;
- one large visual proof area;
- separate result chart;
- restrained social proof row.

## 2. Core Promise

The website must communicate one simple business idea:

> A1 helps companies get more qualified requests through advertising, search, websites, analytics, and digital products.

Preferred Russian message variants:

- "Приводим заявки из рекламы, поиска и сильных сайтов"
- "Запускаем digital-системы, которые дают заявки и понятную аналитику"
- "Соединяем рекламу, SEO, сайты и аналитику в одну систему роста"

Avoid vague claims:

- "Выведем бизнес на новый уровень"
- "Комплексные digital-решения"
- "Инновационный подход"
- "Полный спектр услуг"

## 3. Audience

Primary audience:

- business owners;
- marketing directors;
- clinic, service, e-commerce, B2B, and local business managers;
- people who care about leads, cost per lead, traffic quality, and control.

They should understand the first screen in 5-8 seconds:

- what A1 does;
- why it matters;
- what result it is aiming for;
- how to contact the agency.

## 4. Visual System

### Palette

Use a mostly neutral light system with one calm cool accent.

Core tokens:

- `--color-page`: `#eef0ff` or a close soft lavender background.
- `--color-surface`: `#ffffff`.
- `--color-ink`: `#111113` or another off-black, not pure `#000000`.
- `--color-muted`: `#666a75`.
- `--color-line`: `#e7e7ed`.
- `--color-accent`: `#5158d8`.
- `--color-accent-soft`: `#d9dcff`.

Rules:

- Lavender is allowed because it comes from the reference, but keep it soft and controlled.
- No neon purple/blue glow.
- No heavy gradient text.
- No one-note purple interface. Neutral white, black, gray, and content must dominate.
- Use color for structure and proof, not decoration alone.

### Typography

Preferred tone: modern, geometric, readable, premium.

Recommended fonts:

- Headings: `Manrope`, `Satoshi`, `Geist`, `Outfit`, or `Cabinet Grotesk`.
- Body: `Manrope`, `Geist`, `Satoshi`, or system sans fallback.
- Numbers: use tabular numerals where available.

Rules:

- Body text starts at 16px on mobile.
- No tiny low-contrast gray paragraphs.
- Headline can be large, but must wrap cleanly on mobile.
- Do not use negative letter spacing in body text.
- Keep line length readable: about 60-75 characters on desktop.

### Spacing And Shape

Use generous spacing, but keep the page businesslike.

Rules:

- Desktop container: about 1120-1280px.
- Main card/panel radius: 20-24px.
- Small chips/buttons: pill radius is allowed.
- Repeated content cards should use 8-16px radius depending on hierarchy.
- Avoid nesting cards inside cards unless the inner element is a real widget.
- Use CSS Grid for major layouts.
- Avoid complex flex width math.

## 5. First Screen Rules

The first screen is the most important part of the site.

Required elements:

- logo / agency name;
- compact navigation;
- primary CTA;
- concrete H1;
- short supporting sentence if needed;
- service chips;
- one large visual/proof block;
- one separate result chart or analytics widget;
- trust row with real clients, certificates, platforms, or technologies.

Hero layout:

- Desktop: asymmetric composition is preferred.
- Mobile: strict single-column layout.
- The main visual proof block must be larger than secondary widgets.
- The chart should support the business story, not become random decoration.

Do not:

- create a centered hero with generic text only;
- split the first screen into many equal cards;
- use fake client logos;
- use stock metrics as final proof;
- let the hero occupy the whole viewport without hinting that more content exists below.

## 6. Content Rules

Write in Russian by default.

The copy should be concrete and business-oriented:

- "снижаем стоимость заявки";
- "улучшаем видимость в поиске";
- "строим сайт, который помогает рекламе окупаться";
- "настраиваем аналитику, чтобы видеть, какие каналы дают заявки".

Every service block should answer:

- what we do;
- why it matters for business;
- what the client gets next.

Avoid:

- filler phrases;
- overloaded SEO jargon;
- fake urgency;
- unsupported promises;
- "гарантируем топ-1";
- "увеличим продажи в 10 раз";
- generic AI phrases.

## 7. Service Structure

Main services:

- Контекстная реклама
- SEO
- Разработка сайтов
- Мобильные приложения
- Веб-аналитика
- SMM и контент

Suggested landing sections:

- Hero
- Services overview
- How A1 works
- Cases / proof
- Analytics and reporting
- Why A1
- FAQ
- Contact / brief form

Service cards should not all be identical. Use varied layouts:

- one large primary service block;
- supporting rows;
- bento-like but restrained widgets;
- horizontal comparison where useful.

## 8. Proof And Data

Use proof only when it is real or clearly marked as a placeholder during prototyping.

Allowed proof:

- real cases;
- real client logos with permission;
- screenshots of dashboards with anonymized data;
- certificates;
- platforms and technologies;
- specific process proof: audit, roadmap, weekly reporting.

Rules:

- Do not invent clients.
- Do not invent revenue, leads, percentages, or conversion growth.
- Placeholder numbers may be used only in prototypes and must be replaced before production.
- Charts need labels, readable contrast, and a written takeaway.

## 9. Components

### Navigation

- Compact, pill-like desktop nav.
- Clear active state.
- CTA separated visually from nav.
- Mobile nav must be easy to tap and not depend on hover.

### Buttons

- Primary CTA: dark off-black surface with white text.
- Secondary CTA: light surface with border.
- Minimum height: 44px.
- Pressed state: slight scale or translate, no layout shift.

### Tags

- Service tags are part of the visual language.
- Use thin borders, soft backgrounds, and short labels.
- Do not overfill tags with long copy.

### Forms

- Label above input.
- Helper text where useful.
- Error below the related field.
- Loading and success states.
- Phone, Telegram, or email fields should use semantic input types.

## 10. Motion

Motion should make the site feel alive, not theatrical.

Allowed:

- subtle page-load reveal;
- hover lift for important widgets;
- chart bar reveal;
- gentle CTA feedback;
- small staggered entrances.

Rules:

- Respect `prefers-reduced-motion`.
- Animate `transform` and `opacity`.
- Avoid animating `top`, `left`, `width`, `height`.
- No endless motion that distracts from the offer.
- No custom cursor.
- No heavy parallax unless deliberately implemented and tested.

## 11. Accessibility And Responsive QA

Required checks:

- Mobile width: 375px.
- Tablet width: 768px.
- Desktop width: 1440px.
- No horizontal scroll.
- Text does not overlap.
- Buttons and links are at least 44px high/tappable.
- Contrast is readable.
- Keyboard focus is visible.
- Images have useful alt text or are marked decorative.
- Forms are usable with keyboard.
- Motion respects reduced-motion settings.

## 12. Implementation Rules

Before adding dependencies:

- inspect `package.json`;
- use existing project stack;
- do not assume libraries are installed.

Preferred production stack once approved:

- Next.js or Vite + React;
- TypeScript;
- CSS variables or Tailwind tokens;
- Lucide / Phosphor / Radix icons, one family only;
- Framer Motion only if animation needs justify the dependency.

Until the stack is chosen:

- standalone HTML prototypes are acceptable;
- keep prototype files in `prototypes/`;
- keep `references/` for source materials and written analysis only;
- do not let prototypes become final production without cleanup.

## 13. Pre-Build Checklist

Before building any page:

- Read this rulebook.
- Open `references/references.webp`.
- Decide the page's business goal.
- Identify the primary CTA.
- Write the first-screen message in one sentence.
- List what proof is real and what is still placeholder.
- Choose whether the page needs motion or should stay mostly static.

## 14. Pre-Delivery Checklist

Before delivery:

- Page works on mobile and desktop.
- No fake clients or fake case data.
- No emojis as UI icons.
- No generic three-card service row as the main structure.
- No neon purple/blue glow.
- First screen has clear offer, services, proof, and CTA.
- Main CTA is visible without scrolling.
- All important charts/widgets have labels or explanations.
- Forms have labels, errors, loading, and success state.
- `git status` is clean after commit.
