"""Replace the service hero's original prototype copy with the approved brief."""

ACCENT = "Разрабатываем сайты"
OFFER = "с учётом SEO и рекламы"
DESCRIPTION = (
    "Корпоративные сайты, интернет-магазины, лендинги и веб-сервисы. "
    "Полный цикл разработки — от проектирования до запуска и технического сопровождения."
)


def update_development_copy(prototype):
    hero = prototype.select_one("section.service-hero")
    category = hero.h1
    category.name = "p"
    category.string = "Разработка сайтов"
    category.attrs.pop("id")

    headline = hero.select_one(".service-hero__headline")
    headline.clear()
    headline.name = "h1"
    headline["id"] = hero["aria-labelledby"]
    accent = prototype.new_tag("span", attrs={"class": "service-hero__accent"})
    accent.string = ACCENT
    headline.extend([accent, " " + OFFER])
    hero.select_one(".service-hero__description").string = DESCRIPTION
    action = hero.select_one(".service-hero__copy > a")
    action["href"] = "#contact-title"
    action.attrs.pop("target", None)
    action.attrs.pop("rel", None)

    warranty = hero.select_one(".service-hero__facts .nowrap")
    warranty.string = "6 месяцев"
    for label in hero.select(".service-hero__facts dd"):
        caption = label.get_text(strip=True)
        label.string = caption[:1].upper() + caption[1:]
