# Интеграция React/shadcn hero

Текущий репозиторий `a1` сейчас является static HTML/CSS сайтом: в нём нет `package.json`, `tsconfig.json`, `tailwind.config.*`, `components.json`, `app/` и `components/`.

Поэтому компонент `HeroSection` из 21st.dev нельзя буквально подключить к текущей странице без миграции на React/Next/Tailwind.

## Как поставить в настоящий shadcn-проект

1. Создать Next + TypeScript проект или мигрировать текущий сайт:

```bash
npx create-next-app@latest a1-next --typescript --tailwind --eslint --app --src-dir false
cd a1-next
npx shadcn@latest init
```

2. Убедиться, что компоненты лежат в стандартном пути:

```text
components/ui
```

Для shadcn это важно, потому что примеры и алиас `@/components/ui/...` ожидают именно эту структуру. Если выбрать другой путь, придётся менять все импорты в блоках.

3. Установить зависимости:

```bash
npm install lucide-react class-variance-authority @radix-ui/react-slot next-themes
```

4. Добавить файлы:

```text
components/blocks/hero-section.tsx
components/ui/button.tsx
components/ui/badge.tsx
components/ui/glow.tsx
components/ui/mockup.tsx
components/ui/icons.tsx
lib/utils.ts
```

5. В `tailwind.config.*` добавить `brand`, `brand-foreground`, `appear` и `appear-zoom`.

6. В `app/globals.css` добавить CSS-переменные `--brand`, `--brand-foreground` и utility delays.

7. Подключить компонент в странице, например `app/page.tsx`, и передать реальные тексты A1 digital.

В этом static-репозитории третий вариант реализован как отдельная страница `hero-shadcn.html`, визуально повторяющая структуру компонента без React-сборки.
