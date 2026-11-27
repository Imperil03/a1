"""Render the three scenarios from the supplied demand-to-page example."""

from dataclasses import dataclass
from html import escape


@dataclass(frozen=True)
class Scenario:
    key: str
    service: str
    short: str
    queries: tuple[str, str]
    address: str
    description: str
    alt: str


SCENARIOS = (
    Scenario(
        "laser", "Лазерная резка", "Резка",
        ("Лазерная резка металла", "Заказать лазерную резку"),
        "/lazernaya-rezka/", "Раскрой листового металла по чертежам заказчика.",
        "Лазерный станок режет лист металла",
    ),
    Scenario(
        "bending", "Гибка металла", "Гибка",
        ("Гибка листового металла", "Заказать гибку металла"),
        "/gibka-metalla/", "Изготовление гнутых деталей по заданным размерам.",
        "Листогибочный пресс формует металлическую деталь",
    ),
    Scenario(
        "welding", "Сварочные работы", "Сварка",
        ("Сварка металлоконструкций", "Заказать сварочные работы"),
        "/svarochnye-raboty/", "Сборка и сварка металлических конструкций по чертежам.",
        "Сварщик соединяет стальные элементы конструкции",
    ),
)
ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>'
SEARCH = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="5.8"/><path d="m15 15 4 4"/></svg>'
HOME = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7v10h-6v-6H9v6H3z"/></svg>'
PAGE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h8l4 4v14H6zM14 3v5h4M9 12h6m-6 4h6"/></svg>'


def render_queries():
    groups = []
    for index, scenario in enumerate(SCENARIOS):
        key = scenario.key
        name = escape(scenario.service)
        rows = "".join(f"<li>{SEARCH}<span>{escape(query)}</span></li>" for query in scenario.queries)
        checked = " checked" if index == 0 else ""
        groups.append(f"""
          <div class="demand-group" data-query="{key}">
            <input class="demand-hidden" type="radio" name="demand-scenario"
                   id="demand-{key}" value="{key}" aria-label="{name}"{checked}>
            <label class="demand-option" for="demand-{key}">
              <span class="demand-option__name">{name}</span>
              <span class="demand-option__short" aria-hidden="true">{escape(scenario.short)}</span>
              <span class="demand-option__arrow" aria-hidden="true">{ARROW}</span>
            </label>
            <ul class="demand-query-list" role="list" aria-label="Запросы: {name}">{rows}</ul>
          </div>""")
    return "".join(groups)


def render_tree():
    return "".join(
        f'<li><span class="demand-branch" data-branch="{scenario.key}">'
        f'{PAGE}{escape(scenario.service)}<span aria-hidden="true"></span></span></li>'
        for scenario in SCENARIOS
    )


def render_result(prefix, scenario):
    title = escape(scenario.queries[0])
    return f"""
      <article class="demand-page" data-page="{scenario.key}" aria-label="{title}">
        <div class="demand-browser__bar">
          <span class="demand-browser__dots" aria-hidden="true"><i></i><i></i><i></i></span>
          <span class="demand-browser__address">{scenario.address}</span>
        </div>
        <div class="demand-mock-nav">
          <strong>МЕТАЛЛ <span>/</span> ПРО</strong>
          <span>Услуги</span><span>О компании</span><span>Контакты</span>
        </div>
        <div class="demand-minihero">
          <div class="demand-minihero__copy">
            <small>Услуги / Металлообработка</small>
            <h4>{title}</h4>
            <p>{escape(scenario.description)}</p>
            <span class="demand-minihero__cta">Рассчитать стоимость {ARROW}</span>
          </div>
          <div class="demand-minihero__visual">
            <img src="{prefix}assets/service-development/demand-example-{scenario.key}.webp"
                 width="724" height="724" alt="{escape(scenario.alt)}" loading="lazy" decoding="async">
          </div>
        </div>
      </article>"""


def render_demand(prefix):
    results = "".join(render_result(prefix, scenario) for scenario in SCENARIOS)
    return f"""
<section class="demand-section" aria-labelledby="service-approach-title" data-source-section="service-approach-title">
  <div class="sc-container">
    <header class="demand-intro">
      <h2 id="service-approach-title" class="service-content__title" data-service-reveal>Проектируем сайт с учётом того, <em>что ищут ваши клиенты</em></h2>
      <p>Изучаем поисковый спрос и на его основе проектируем структуру сайта. Для разных услуг создаём отдельные страницы, а запросы с одинаковым смыслом объединяем на одной странице. Это позволяет направлять посетителей из поиска и рекламы сразу к нужному предложению.</p>
    </header>
    <div class="demand-scene" data-demand-scene>
      <p class="demand-boardtop">На примере сайта металлообрабатывающей компании</p>
      <div class="demand-columns">
        <svg class="demand-routes" aria-hidden="true">
          <defs><marker id="demand-route-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="m1 1 7 4-7 4"/></marker></defs>
          <path class="demand-route demand-route--underlay" data-route-underlay="query"/>
          <path class="demand-route demand-route--underlay" data-route-underlay="page"/>
          <path class="demand-route demand-route--input" data-route-input="0" pathLength="1"/>
          <path class="demand-route demand-route--input" data-route-input="1" pathLength="1"/>
          <path class="demand-route demand-route--query" pathLength="1" marker-end="url(#demand-route-arrow)"/>
          <path class="demand-route demand-route--page" pathLength="1" marker-end="url(#demand-route-arrow)"/>
          <circle class="demand-route__junction" data-route-junction r="3"/>
        </svg>
        <div class="demand-step demand-step--research">
          <header class="demand-step__head"><h3><span aria-hidden="true">01</span> Что ищут клиенты</h3><p>Выберите услугу, чтобы увидеть её страницу</p></header>
          <div class="demand-groups" role="radiogroup" aria-label="Группы поисковых запросов">{render_queries()}</div>
        </div>
        <div class="demand-step demand-step--structure">
          <header class="demand-step__head"><h3><span aria-hidden="true">02</span> Структура сайта</h3></header>
          <div class="demand-map">
            <ul class="demand-tree" role="list">
              <li><span class="demand-tree__root">{HOME}Главная</span>
                <ul role="list"><li><span class="demand-tree__parent">Металлообработка</span>
                  <ul role="list">{render_tree()}</ul>
                </li></ul>
              </li>
            </ul>
          </div>
          <p class="demand-tree-note"><strong>3 услуги — 3 страницы</strong></p>
          <p class="demand-mobile-note">Для каждой услуги — отдельная страница</p>
        </div>
        <div class="demand-step demand-step--interface">
          <header class="demand-step__head"><h3><span aria-hidden="true">03</span> Страница услуги</h3></header>
          <div class="demand-browser">{results}</div>
        </div>
      </div>
      <p class="demand-hidden" data-demand-status aria-live="polite"></p>
    </div>
  </div>
</section>"""
