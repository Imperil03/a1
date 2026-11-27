"""Team, reviews, FAQs and contact for the website development preview."""

from copy import deepcopy
from urllib.parse import urlsplit


DEVELOPMENT_TEAM = ("Илья", "Константин", "Виктория", "Егор")
DEVELOPMENT_REVIEWS = ("Анна Воробьева", "Кира Лебедева", "Максим Певцов")
TEAM_DESCRIPTION = (
    "Формируем команду под конкретную задачу. В зависимости от проекта подключаем "
    "специалистов по аналитике, проектированию, дизайну, разработке, контенту и SEO."
)
CONTACT_COPY = (
    "Расскажите, какой сайт вам нужен или какие задачи не решает существующий. "
    "Предложим подходящий формат разработки, определим состав работ и подготовим "
    "предварительную оценку стоимости.",
    "Первая консультация бесплатная.",
)
FAQ_ITEMS = (
    (
        "Нужно ли готовить техническое задание?",
        (
            "Нет. Для начала достаточно рассказать о компании, её продуктах или услугах и задачах будущего "
            "сайта. Мы поможем определить требования, подобрать подходящий формат и подготовить техническое задание.",
            "Если у вас уже есть готовое техническое задание, можем оценить проект на его основе.",
        ),
    ),
    (
        "Сколько времени занимает разработка сайта?",
        (
            "Ориентировочные сроки указаны в разделе с видами сайтов. Продолжительность разработки зависит "
            "от количества уникальных страниц, сложности функциональности, готовности материалов и скорости "
            "согласования промежуточных результатов.",
            "После обсуждения проекта определяем сроки выполнения работ.",
        ),
    ),
    (
        "Кто готовит тексты и фотографии для сайта?",
        (
            "Можем подготовить тексты самостоятельно, отредактировать ваши материалы или работать совместно "
            "с вашим специалистом.",
            "Для фотографий используем предоставленные материалы, при необходимости помогаем подобрать "
            "изображения, подготовить графику или организовать фотосъёмку. Состав работ согласовываем "
            "при подготовке предложения.",
        ),
    ),
    (
        "Можно ли заказать редизайн существующего сайта?",
        (
            "Да. Сначала оцениваем структуру, дизайн, техническое состояние и функциональность действующего "
            "сайта. Если его основа позволяет решить поставленные задачи, можем обновить интерфейс "
            "и необходимые разделы без полной разработки с нуля.",
        ),
    ),
    (
        "Как происходит перенос сайта с сохранением поисковых позиций?",
        (
            "Перед переносом анализируем существующие страницы, их поисковую видимость и структуру адресов. "
            "По возможности сохраняем действующие URL, а для изменённых страниц настраиваем перенаправления.",
            "После запуска проверяем индексацию и динамику поисковых показателей. Такой подход помогает "
            "минимизировать риски снижения поискового трафика при переходе на новый сайт.",
        ),
    ),
    (
        "Сможем ли мы самостоятельно обновлять информацию на сайте?",
        (
            "Да. В зависимости от функциональности сайта можно самостоятельно редактировать тексты, "
            "изображения, цены, товары, новости и другие материалы через систему управления.",
            "После запуска объясняем, как пользоваться административной частью сайта.",
        ),
    ),
    (
        "Какие расходы могут возникнуть дополнительно к стоимости разработки?",
        (
            "В зависимости от проекта отдельно могут оплачиваться домен, хостинг, лицензии программного "
            "обеспечения, платные модули, подписки на сторонние сервисы, фотосъёмка и другие дополнительные работы.",
            "Перечень необходимых расходов определяем при подготовке предложения, чтобы вы могли заранее "
            "оценить бюджет проекта.",
        ),
    ),
    (
        "Что входит в гарантию на сайт?",
        (
            "Гарантия распространяется на технические ошибки в функциональности, реализованной нашей командой "
            "в рамках согласованного проекта.",
            "Разработка новых функций, изменение утверждённой логики и расширение сайта относятся к отдельным "
            "работам. Подробные условия гарантийного обслуживания фиксируются в договоре.",
        ),
    ),
)


def copy_section(home, selector, heading_id, title=None):
    section = deepcopy(home.select_one(selector))
    heading = section.h2
    section["data-source-section"] = heading_id
    section["aria-labelledby"] = heading_id
    heading["id"] = heading_id
    if title is not None:
        heading.string = title
        heading["data-service-reveal"] = ""
    return section


def render_team(home):
    team = copy_section(home, "#team", "service-project-team-title", "Команда вашего проекта")
    team.select_one(".section-heading p").string = TEAM_DESCRIPTION
    team.select_one(".director-quote").decompose()
    grid = team.select_one(".people-grid")
    employees = {item.select_one("figcaption strong").get_text(strip=True): item for item in grid.select(":scope > li")}
    grid.clear()
    for name in DEVELOPMENT_TEAM:
        grid.append(employees[name])
    return team


def render_reviews(home):
    reviews = copy_section(home, "#reviews", "reviews-title", "Отзывы клиентов")
    track = reviews.select_one(".review-track")
    cards = {card.select_one(".review-author strong").get_text(strip=True): card for card in track.select(":scope > li")}
    track.clear()
    for name in DEVELOPMENT_REVIEWS:
        card = cards[name]
        original = card.select_one("blockquote[cite]")["cite"]
        source = card.select_one(".review-source")
        if urlsplit(original).netloc == "2gis.ru":
            icon = source.img.extract()
            source.clear()
            source.extend((icon, "Отзыв в 2ГИС"))
            source["href"] = original
        track.append(card)
    link = home.new_tag("a", attrs={"class": "text-link service-all-reviews", "href": "prototype/company/reviews/"})
    link.string = "Все отзывы"
    track.insert_after(link)
    return reviews


def render_faq(home):
    faq = copy_section(home, "#faq", "service-faq-title", "Частые вопросы")
    questions = faq.select_one(".faq-list")
    template = questions.details.extract()
    questions.clear()
    for number, (question, paragraphs) in enumerate(FAQ_ITEMS):
        details = deepcopy(template)
        if number:
            del details["open"]
        icon = details.summary.svg.extract()
        details.summary.clear()
        details.summary.extend((question, icon))
        answer = details.select_one(".faq-answer")
        answer.clear()
        for paragraph in paragraphs:
            node = home.new_tag("p")
            node.string = paragraph
            answer.append(node)
        questions.append(details)
    return faq


def render_contact(home):
    contact = copy_section(home, "#contact", "contact-title")
    primary = contact.select_one(".contact-copy")
    primary.string = CONTACT_COPY[0]
    consultation = home.new_tag("p", attrs={"class": "contact-copy"})
    consultation.string = CONTACT_COPY[1]
    primary.insert_after(consultation)
    contact.select_one(".response-time").decompose()
    max_link = contact.select_one('a[href^="https://max.ru/"]')
    icon = max_link.svg.extract()
    max_link.clear()
    max_link.extend(("MAX", icon))
    return contact


def copy_proof(home):
    """Reuse approved component markup and adapt the content to website development."""
    return (render(home) for render in (
        render_team, render_reviews, render_faq, render_contact,
    ))
