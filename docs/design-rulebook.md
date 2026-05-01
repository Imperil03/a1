# A1 Design Rulebook

## 1. Direction

A1 is a digital agency website for businesses that need measurable growth from advertising, SEO, websites, analytics, SMM, and mobile products.

The visual direction is **premium-tech with a point of view**. The site should look like a team that can handle money, leads, analytics, and product work with discipline, but it should also have a memorable visual idea. It may be calm, bold, playful, cinematic, or experimental. The only real failure mode is looking like a default AI-generated agency landing page.

Reference file:

- `references/references.webp`

The screenshot is creative source material. Prototypes may borrow its composition closely while exploring typography, proportions, spacing rhythm, and interaction details.

This rulebook is a taste compass, not a cage. Rules describe the default direction; a stronger prototype may override them if it looks intentional, memorable, and clearly not generic.

Reference mood:

- large white canvas on a soft cool background;
- compact pill navigation;
- strong black CTA;
- oversized but controlled headline;
- service tags near the hero;
- one large visual proof area;
- separate result chart;
- restrained social proof row.

Creative standard:

- Every prototype needs one memorable decision: an unusual hero composition, a striking data widget, a custom visual metaphor, kinetic typography, an interactive chart, a strong illustration system, or a distinctive rhythm.
- Avoid the default ChatGPT layout: centered H1, vague subtitle, two buttons, three equal cards, soft purple gradient blobs, stock icons, and interchangeable SaaS copy.
- Do not make "clean" mean empty. Premium can be quiet, but it still needs tension, hierarchy, and a recognizable idea.

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

Start from the reference palette: a white main canvas, soft cool background, black CTA, and lavender/blue proof widgets. This is the base, not a prison.

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
- Stronger accents, gradients, glow, texture, and contrast are allowed in prototypes when they create a deliberate art direction.
- Avoid the stock AI look: generic purple-blue blobs, default neon glow, random glass cards, and color used only to fill space.
- If the design becomes one-note lavender, add tension with black, white, gray, photography, charts, typography, or a second controlled accent.
- Use color to create hierarchy, proof, atmosphere, or interaction, not just decoration.

### Typography

Preferred tone: modern, geometric, readable, premium.

Default font:

- Use `Poppins` across headings, navigation, body text, buttons, chips, numbers, and widgets unless a prototype deliberately explores a stronger type direction.
- Load weights `300`, `400`, `500`, `600`, and `700`.
- Fallback: `system-ui`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, sans-serif.

Why:

- The reference has a rounded geometric sans feel; `Poppins` is the closest practical match.
- One font family keeps the first screen clean and close to the screenshot.
- The large hero headline works best with a light/regular geometric weight, not a heavy bold display face.

Usage:

- Hero H1: `Poppins` 400, large, airy, with natural letter spacing.
- Navigation and chips: `Poppins` 400-500.
- CTA buttons: `Poppins` 600.
- Big metrics: `Poppins` 400-500 with tabular numerals where possible.
- Body text: `Poppins` 400.

Rules:

- Body text starts at 16px on mobile.
- No tiny low-contrast gray paragraphs.
- Headline can be large, but must wrap cleanly on mobile.
- Keep letter spacing natural; do not use negative tracking as a default styling trick.
- Keep line length readable: about 60-75 characters on desktop.
- If a different font creates a much stronger concept, try it in a prototype and judge it visually against the reference.

### Spacing And Shape

Use generous spacing, but keep the page businesslike.

Rules:

- Desktop container: about 1120-1280px.
- Main card/panel radius: 20-24px.
- Small chips/buttons: pill radius is allowed.
- Repeated content cards should use 8-16px radius depending on hierarchy.
- Avoid "card soup": too many equally weighted boxes with no hierarchy.
- Use whichever layout method gives the cleanest result, but keep spacing intentional and mobile collapse under control.

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
- trust row with clients, certificates, platforms, technologies, or provisional logo marks.

Hero layout:

- Desktop: asymmetric composition is preferred.
- Mobile: strict single-column layout.
- The main visual proof block should usually dominate secondary widgets, unless a stronger composition proves otherwise.
- The chart should support the business story, not become random decoration.

Avoid default patterns unless you are intentionally subverting them:

- create a centered hero with generic text only;
- split the first screen into many equal cards;
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

Avoid boring production copy:

- filler phrases;
- overloaded SEO jargon;
- fake urgency;
- generic promises with no visual or narrative role;
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

During creative prototyping, proof blocks can be invented freely to search for the strongest visual story.

Useful proof types:

- client logos or provisional logo marks;
- case numbers and growth metrics;
- dashboards and charts;
- screenshots of dashboards with anonymized data;
- certificates;
- platforms and technologies;
- specific process proof: audit, roadmap, weekly reporting.

Rules:

- In prototypes, invented numbers and logos are allowed.
- If a design moves toward publication, run a separate factual cleanup pass.
- Keep visual scaffolding believable enough to test composition and hierarchy.
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

Motion can be part of the brand. It should make the site feel designed, responsive, and a little alive. Do not reduce it to safe fades if the concept calls for something stronger.

Good directions:

- subtle page-load reveal;
- hover lift for important widgets;
- chart bar reveal;
- gentle CTA feedback;
- small staggered entrances.
- SVG line drawing;
- masked text/image reveals;
- animated charts and counters;
- kinetic service tags;
- scroll-driven case transitions;
- shader/canvas/WebGL hero details;
- controlled glow, blur, grain, or refraction effects;
- playful cursor-adjacent effects if they do not hurt usability.

Rules:

- Use `transform` and `opacity` as the default for basic UI states.
- For expressive hero work, charts, SVG, masks, filters, canvas, WebGL, and brand moments, other techniques are allowed.
- Respect `prefers-reduced-motion` with a calmer fallback.
- Watch for visible jank, layout jumps, text overlap, and mobile battery drain.
- Motion should serve hierarchy, story, or delight. Random movement is not design.

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
- a clear icon/symbol language, from a library or custom-made;
- Framer Motion, GSAP, canvas, SVG, CSS, or another motion approach when it fits the concept and stack.

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
- No default ChatGPT look: centered vague hero, three equal cards, stock blobs, and interchangeable copy.
- Any icons, emojis, symbols, glows, gradients, or decorative effects feel intentional and specific to A1.
- First screen has clear offer, services, proof, and CTA.
- Main CTA is visible without scrolling.
- All important charts/widgets have labels or explanations.
- Forms have labels, errors, loading, and success state.
- `git status` is clean after commit.
