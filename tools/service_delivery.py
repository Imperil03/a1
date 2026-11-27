"""Approved copy for the four service delivery sections."""
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>'
FORMATS = (
    ("Корпоративный сайт", "korporativnye-sajty", "Для компаний с несколькими направлениями деятельности, услугами или сложным продуктом.", "Страницы услуг, информация о компании, кейсы, каталог продукции, формы обращения.", "От 100 000 ₽", "Срок — от 8 недель.", ("prototype/assets/web-development/09-launch.png", 270, 219)),
    ("Интернет-магазин", "internet-magaziny", "Для онлайн-продаж, управления ассортиментом и автоматизации обработки заказов.", "Каталог, фильтры, корзина, онлайн-оплата, доставка и интеграции.", "От 150 000 ₽", "Срок — от 12 недель.", ""),
    ("Сайт-каталог", "sajty-katalogi", "Для производителей, поставщиков и компаний с большим ассортиментом продукции, которым не обязательно принимать оплату через сайт.", "Категории продукции, карточки товаров, характеристики, фильтры и запрос стоимости.", "От 150 000 ₽", "Срок — по согласованию.", ("prototype/cases/niko-m/assets/service-page-before-after.webp", 1586, 992)),
    ("Лендинг", "landing-page", "Для продвижения отдельной услуги, продукта, мероприятия или рекламного предложения.", "Презентация предложения, преимущества, условия, формы заявки и аналитика.", "От 60 000 ₽", "Срок — от 5 недель.", ""),
    ("Сайт-визитка", "sajty-vizitki", "Компактный сайт для небольших компаний и специалистов.", "Информация о компании, основные услуги, примеры работ и контакты.", "От 60 000 ₽", "Срок — от 4 недель.", ""),
    ("Веб-сервисы и порталы", "veb-servisy", "Индивидуальная разработка для нестандартных бизнес-задач и автоматизации процессов.", "Личные кабинеты, системы бронирования, калькуляторы, корпоративные порталы и образовательные платформы.", "Стоимость и сроки рассчитываются индивидуально.", "", ""),
)

STAGES = (
    ("Аналитика и исследование", (
        "Изучаем бизнес, продукт, целевую аудиторию и конкурентную среду. Определяем задачи будущего сайта, требования к функциональности и критерии оценки проекта.",
    ), "требования к сайту и согласованное направление разработки.", (
        ("01-brief.png", "Пример брифа", 251, 189), ("02-semantic-core.png", "Пример семантического ядра", 269, 188),
    )),
    ("Структура и прототипы", (
        "Определяем состав разделов и страниц, продумываем навигацию, содержание ключевых блоков и пользовательские сценарии. Создаём прототипы, чтобы согласовать логику сайта до начала дизайна.",
    ), "карта сайта и прототипы ключевых страниц.", (
        ("03-site-structure.png", "Пример карты сайта", 271, 189), ("04-prototype.png", "Пример прототипа страницы", 251, 245),
    )),
    ("Подготовка контента", (
        "Готовим тексты, редактируем предоставленные материалы, подбираем изображения и определяем, какая информация необходима для каждой страницы.",
    ), "подготовленное содержание сайта.", (
        ("05-content.png", "Пример подготовленного содержания", 269, 240),
    )),
    ("Дизайн", (
        "Разрабатываем визуальную концепцию, оформляем ключевые страницы и адаптируем интерфейс для компьютеров, планшетов и смартфонов.",
        "Учитываем фирменный стиль, особенности продукта и удобство взаимодействия с сайтом.",
    ), "согласованные дизайн-макеты.", (
        ("06-prototype-to-design.png", "Пример перехода от прототипа к дизайну", 271, 247),
    )),
    ("Разработка и интеграции", (
        "Программируем сайт, подключаем систему управления, реализуем необходимые функции и интеграции с внешними сервисами.",
        "Настраиваем административную часть для управления содержанием сайта.",
    ), "рабочая версия сайта на тестовом адресе.", (
        ("07-development.png", "Фрагмент кода на этапе разработки", 251, 222),
    )),
    ("Тестирование и запуск", (
        "Проверяем интерфейсы, формы, функциональность и интеграции. Настраиваем аналитику и выполняем базовую техническую SEO-подготовку.",
        "После публикации проверяем работоспособность сайта на основном домене и доступность страниц для поисковых систем.",
    ), "опубликованный и протестированный сайт.", (
        ("08-analytics.png", "Пример подключения аналитики", 270, 222), ("09-launch.png", "Пример сайта после запуска", 270, 219),
    )),
)

PLATFORMS = (
    ("1С-Битрикс", "1c-bitrix", "Корпоративные сайты, крупные каталоги, интернет-магазины и проекты с интеграцией 1С."),
    ("WordPress", "wordpress", "Корпоративные сайты, информационные проекты и сайты с регулярно обновляемым содержанием."),
    ("Tilda", "tilda", "Лендинги, небольшие сайты и проекты с относительно простым функционалом."),
    ("Laravel", "laravel", "Веб-сервисы, личные кабинеты, порталы и системы с индивидуальной бизнес-логикой."),
)


def linked_name(prefix, slug, name):
    path = f"prototype/razrabotka-sajtov/{slug}/"
    label = escape(name)
    if (ROOT / path / "index.html").is_file():
        return f'<a href="{prefix}{path}">{label}</a>'
    return label


def intro(key, title, lead):
    return f"""
      <div class="sc-service-section-intro delivery-intro">
        <h2 class="service-content__title" id="{key}" data-service-reveal>{title}</h2>
        <p class="sc-intro-copy">{lead}</p>
      </div>"""


def section(key, cls, content):
    return f"""
<section data-source-section="{key}" aria-labelledby="{key}" class="{cls}">
  <div class="sc-container">{content}</div>
</section>"""


def render_formats(prefix):
    key = "site-types-title"
    heading = intro(key, "Какой сайт нужен вашему бизнесу?",
        "Разрабатываем сайты разного масштаба — от компактных лендингов до интернет-магазинов и сложных веб-сервисов. Подбираем формат с учётом ваших задач, бюджета и планов развития.")
    entries = []
    for title, slug, audience, features, price, timing, image in FORMATS:
        term = f"<span>{timing}</span>" if timing else ""
        terms_class = "format-terms format-terms--individual" if not timing else "format-terms"
        sample = ""
        if image:
            url, width, height = image
            sample = (f'<img class="format-sample" src="{prefix}{url}" alt="" '
                      f'width="{width}" height="{height}" loading="lazy" decoding="async">')
        entries.append(f"""
          <li class="delivery-format">
            <div class="format-name"><h3>{linked_name(prefix, slug, title)}</h3>{sample}</div>
            <div class="format-detail"><p>{audience}</p><p>{features}</p></div>
            <p class="{terms_class}"><strong>{price}</strong>{term}</p>
          </li>""")
    return section(key, "delivery-formats", f"""{heading}
      <ul class="delivery-formats__index">{"".join(entries)}</ul>
      <div class="delivery-estimate">
        <details class="sc-service-cost-factors">
          <summary><h3 id="service-pricing-title">От чего зависит стоимость разработки?</h3></summary>
          <p>Стоимость определяется количеством уникальных страниц, сложностью дизайна и функциональности, объёмом подготовки контента, необходимыми интеграциями и требованиями к срокам.</p>
          <p>До начала разработки согласовываем состав работ и стоимость проекта. Если часть функциональности можно реализовать на следующем этапе, предлагаем поэтапный запуск.</p>
        </details>
        <a class="sc-button sc-button--primary" href="#contact-title">Получить предварительную оценку {ARROW}</a>
      </div>""")


def render_process(prefix):
    key = "service-process-title"
    heading = intro(key, "От идеи до запуска сайта",
        "Работаем поэтапно, согласовывая с вами промежуточные результаты. Вы понимаете, как развивается проект и какие решения принимаются на каждом этапе.")
    entries = []
    for index, (title, paragraphs, result, visuals) in enumerate(STAGES, 1):
        copy = "".join(f"<p>{paragraph}</p>" for paragraph in paragraphs)
        images = "".join(
            f'<img src="{prefix}prototype/assets/web-development/{filename}" alt="{alt}" '
            f'width="{width}" height="{height}" loading="lazy" decoding="async">'
            for filename, alt, width, height in visuals
        )
        entries.append(f"""
        <li>
          <details id="service-stage-{index}"{" open" if index == 1 else ""}>
            <summary><span class="sc-web-process-card__number" aria-hidden="true">{index:02d}</span><strong>{title}</strong></summary>
            <div class="sc-web-process-panel">
              <figure class="sc-web-process-visual">{images}</figure>
              <div class="sc-service-process__body">
                {copy}
                <p class="sc-service-process__result"><strong>Результат этапа:</strong> {result}</p>
              </div>
            </div>
          </details>
        </li>""")
    return section(key, "sc-service-process delivery-process", f"""{heading}
      <ol class="sc-service-process__list" data-service-board>{"".join(entries)}</ol>""")


def render_technology(prefix):
    key = "service-tech-title"
    heading = intro(key, "Технологии под задачи проекта",
        "Подбираем платформу с учётом функциональности сайта, необходимых интеграций, планов развития и стоимости дальнейшего сопровождения.")
    rows = "".join(f'<li><h3>{linked_name(prefix, slug, name)}</h3><p>{body}</p></li>' for name, slug, body in PLATFORMS)
    return section(key, "delivery-tech", f"""{heading}
      <div class="delivery-tech__layout">
        <div>
          <ul class="delivery-platforms">{rows}</ul>
          <a class="delivery-certification" href="https://www.1c-bitrix.ru/partners/321338.php">
            <img src="{prefix}assets/service-development/1c-bitrix-logo.svg" width="344" height="67" loading="lazy" decoding="async" alt="">
            <span>Сертифицированный партнёр 1С-Битрикс {ARROW}</span>
          </a>
        </div>
        <div class="delivery-integrations">
          <h3>Интеграции с внешними системами</h3>
          <p>Подключаем сервисы, необходимые для работы сайта и автоматизации бизнес-процессов.</p>
          <div class="delivery-integrations__map">
            <div class="delivery-integrations__site">Сайт</div>
            <ul>
              <li>1С и товароучётные системы.</li>
              <li><a href="{prefix}prototype/prices/#price-crm">Битрикс24 и amoCRM.</a></li>
              <li>Онлайн-оплата.</li>
              <li>Службы доставки.</li>
              <li>Телефония и коллтрекинг.</li>
              <li>Веб-аналитика.</li>
              <li>Внешние API.</li>
            </ul>
          </div>
        </div>
      </div>""")


def render_handover(prefix):
    key = "service-after-launch-title"
    heading = intro(key, "Ваш сайт остаётся под вашим управлением",
        "После завершения разработки передаём доступы к сайту, домену, хостингу и подключённым сервисам в соответствии с условиями договора. Объясняем, как самостоятельно обновлять информацию и управлять содержанием сайта.")
    return section(key, "delivery-handover", f"""{heading}
      <div class="delivery-handover__panel">
        <div class="delivery-handover__access">
          <h3>Что получает клиент после завершения проекта</h3>
          <ul>
            <li>Доступ к системе управления сайтом.</li>
            <li>Административные доступы к подключённым сервисам.</li>
            <li>Инструкции по работе с сайтом.</li>
            <li>Исходные материалы, предусмотренные договором.</li>
          </ul>
        </div>
        <div class="delivery-warranty">
          <h3>Гарантия — <strong>6 месяцев</strong></h3>
          <p>Исправляем технические ошибки в реализованной нами части проекта без дополнительной оплаты в рамках гарантийных условий договора.</p>
        </div>
      </div>
      <div class="delivery-follow-up">
        <article>
          <h3>Техническая поддержка</h3>
          <p>Следим за работоспособностью сайта, обновляем программное обеспечение, выполняем резервное копирование и дорабатываем функциональность.</p>
          <a href="{prefix}prototype/prices/#price-support">Техническая поддержка сайтов {ARROW}</a>
        </article>
        <article>
          <h3>Продвижение и развитие</h3>
          <p>Можем подключить SEO-продвижение, контекстную рекламу и аналитику. Развиваем сайт с учётом новых задач бизнеса и результатов продвижения.</p>
          <div><a href="{prefix}prototype/seo/">SEO-продвижение {ARROW}</a>
            <a href="{prefix}prototype/kontekstnaya-reklama/">Контекстная реклама {ARROW}</a></div>
        </article>
      </div>""")
