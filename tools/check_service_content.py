"""Check the static service preview against its prototype and approved homepage.

Run from any directory with Python 3 and beautifulsoup4 installed.
"""

from collections import Counter
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit

from bs4 import BeautifulSoup, Comment, NavigableString, Tag

from build_service_preview import DEVELOPMENT_INDEX
from service_copy import update_development_copy
from service_demand import SCENARIOS


ROOT = Path(__file__).resolve().parents[1]
SITE = "https://imperil03.github.io/a1/"
SITE_ROOT = urlsplit(SITE)
SERVICE = "razrabotka-sajtov/"
SOURCE = "prototype/" + SERVICE
PREVIEW = "preview/" + SERVICE
BLOCKS = set("address article aside blockquote button dd details div dl dt figcaption figure footer h1 h2 h3 h4 header li main nav ol p section summary table td th tr ul".split())


def read_page(route):
    soup = BeautifulSoup((ROOT / route / "index.html").read_text(encoding="utf-8"), "html.parser")
    for node in soup.find_all(string=lambda value: isinstance(value, Comment)):
        node.extract()
    # Only explicit technical clones are excluded. aria-hidden alone can contain
    # visible source text, including step numbers, review initials and stars.
    for node in soup.select("script:not([src]), style, template, [data-marquee-clone][aria-hidden=true][inert]"):
        node.decompose()
    base = soup.select_one("base[href]")
    return soup, urljoin(SITE + route, base["href"] if base else "")


def raw_text(node):
    if node is None or getattr(node, "name", None) == "svg":
        return ""
    if isinstance(node, NavigableString):
        return str(node)
    chunks = []
    previous = None
    for child in node.children:
        value = raw_text(child)
        if not value:
            continue
        if isinstance(previous, Tag) and isinstance(child, Tag):
            chunks.append(" ")
        chunks.append(value)
        previous = child
    value = "".join(chunks)
    return f" {value} " if node.name in BLOCKS else value


def text(node):
    return " ".join(raw_text(node).split())


def words(node):
    return Counter(text(node).split())


def compare(expected, actual, label, errors):
    if expected == actual:
        return
    for name, difference in (("нет", expected - actual), ("лишнее", actual - expected)):
        if difference:
            examples = list(difference.elements())[:5]
            errors.append(f"{label}: {name} {examples!r}")


def check_text(source, preview, label, errors):
    compare(words(source), words(preview), label, errors)
    # Paragraphs, list items and headings may change markup and order. Inside
    # each, spelling, punctuation and word order must remain intact.
    target_text = text(preview)
    phrases = source.select("h1,h2,h3,p,dt,dd,li,summary,blockquote,figcaption,strong,small")
    for node in phrases:
        if node.select_one("p,ul,ol,li,h3,article,details,figure,div"):
            continue
        phrase = text(node)
        if phrase and phrase not in target_text:
            errors.append(f"{label}: изменена фраза {phrase[:100]!r}")


def hero_facts(node, selector):
    return Counter((text(fact.dt), text(fact.dd)) for fact in node.select(selector))


def links(node, base, rewrite=None):
    result = Counter()
    for anchor in node.select("a[href]"):
        label = text(anchor.select_one("h2,h3") or anchor) or anchor.get("aria-label", "")
        url = urljoin(base, anchor["href"])
        result[(label, rewrite(url) if rewrite else url)] += 1
    return result


def shell_link(url):
    path, separator, fragment = url.partition("#")
    if path == SITE + SOURCE:
        return SITE + PREVIEW + separator + fragment
    return url


def local_file(url):
    parts = urlsplit(url)
    if parts.netloc != SITE_ROOT.netloc or not parts.path.startswith(SITE_ROOT.path):
        return None
    path = ROOT / unquote(parts.path[len(SITE_ROOT.path):])
    return path / "index.html" if parts.path.endswith("/") else path


def check_assets(soup, base, errors):
    for attr, selector in (("src", "[src]"), ("href", "link[href]"), ("poster", "[poster]"),
                           ("data-menu-art", "[data-menu-art]"), ("data-case-video-src", "[data-case-video-src]")):
        for node in soup.select(selector):
            ref = node[attr]
            url = urljoin(base, ref)
            if urlsplit(url).netloc != SITE_ROOT.netloc:
                continue
            file = local_file(url)
            if file is None or not file.is_file():
                errors.append(f"ресурс не найден в /a1/: {ref!r}")


def check_portraits(home, team, errors):
    portraits = {text(figure.select_one("figcaption strong")): urljoin(SITE, figure.img["src"]) if figure.img else None
                 for figure in home.select(".people-grid figure")}
    for figure in team.select("figure"):
        caption = figure.select_one("figcaption")
        if not caption:
            continue
        name = next((name for name in portraits if text(caption).startswith(name + " ")), None)
        if name:
            actual = urljoin(SITE + PREVIEW, figure.img["src"]) if figure.img else None
            if portraits[name] != actual:
                errors.append(f"команда: портрет не совпадает с главной для {name!r}")


def check_demand(preview, errors):
    for scenario in SCENARIOS:
        group = preview.select_one(f'[data-query="{scenario.key}"]')
        branch = preview.select_one(f'[data-branch="{scenario.key}"]')
        page = preview.select_one(f'[data-page="{scenario.key}"]')
        if group is None or branch is None or page is None:
            errors.append(f"схема: неполный сценарий {scenario.service!r}")
            continue
        control = group.select_one('input[type="radio"]')
        if (control is None or control.get("value") != scenario.key
                or group.select_one(f'label[for="{control.get("id")}"]') is None
                or tuple(text(item) for item in group.select("li")) != scenario.queries
                or text(branch) != scenario.service
                or text(page.h4) != scenario.queries[0]
                or text(page.select_one(".demand-browser__address")) != scenario.address
                or page.img is None
                or page.img.get("alt") != scenario.alt
                or not page.img.get("src", "").endswith(f"/demand-example-{scenario.key}.webp")):
            errors.append(f"схема: не согласованы запросы, ветка и макет {scenario.service!r}")
    checked = preview.select(".demand-group input[checked]")
    if [control.get("value") for control in checked] != [SCENARIOS[0].key]:
        errors.append("схема: неверное начальное состояние")
    for selector in (
        '[data-route-input="0"]', '[data-route-input="1"]', "[data-route-junction]",
        ".demand-route--query", ".demand-route--page",
    ):
        if len(preview.select(selector)) != 1:
            errors.append(f"схема: ожидался один элемент {selector!r}")


def main():
    source, _ = read_page(SOURCE)
    update_development_copy(source)
    home, home_base = read_page("")
    preview, preview_base = read_page(PREVIEW)
    errors = []
    for selector in ("body > header", "body > footer", "main #cases"):
        original, current = home.select_one(selector), preview.select_one(selector)
        if not original or not current:
            errors.append(f"нет общего компонента {selector}")
            continue
        check_text(original, current, selector, errors)
        compare(links(original, home_base, shell_link), links(current, preview_base), selector, errors)
        if selector == "main #cases":
            for attribute in ("src", "poster", "data-case-video-src"):
                original_media = Counter(urljoin(home_base, tag[attribute]) for tag in original.select(f"[{attribute}]"))
                current_media = Counter(urljoin(preview_base, tag[attribute]) for tag in current.select(f"[{attribute}]"))
                compare(original_media, current_media, f"кейсы: {attribute}", errors)

    original_hero = source.select_one("main .service-hero")
    hero = preview.select_one("main .service-opening")
    if hero is None:
        errors.append("нет первого экрана")
    else:
        check_text(original_hero, hero, "первый экран", errors)
        compare(hero_facts(original_hero, ".service-hero__facts > div"), hero_facts(hero, ".hero-facts > div"),
                "первый экран: показатели и подписи", errors)
        if len(preview.select("h1")) != 1 or text(hero.h1) != "Разрабатываем сайты с учётом SEO и рекламы":
            errors.append("ожидался один H1 с заголовком услуги")

    order = [
        "service-hero-title", "service-cases-title", "site-types-title", "service-approach-title",
        "service-process-title", "service-tech-title", "service-after-launch-title",
        "service-project-team-title", "reviews-title", "service-faq-title", "contact-title",
    ]
    sections = preview.select("main [data-source-section]")
    if [node["data-source-section"] for node in sections] != order:
        errors.append("изменён состав или порядок разделов")
    nav = preview.select_one("nav[data-section-index]")
    if nav is None or hero is None or hero.find_next_sibling() is not nav:
        errors.append("навигация должна идти сразу под первым экраном")
    else:
        actual = tuple((a["href"][1:], text(a)) for a in nav.select('a[href^="#"]'))
        if actual != DEVELOPMENT_INDEX:
            errors.append("не совпадают подписи или порядок ссылок в навигации")

    counts = {
        "#cases .project-case": 6,
        ".delivery-formats__index > li": 6,
        ".demand-group input[type=radio]": 3,
        ".demand-group": 3,
        ".demand-group li": 6,
        ".demand-branch": 3,
        ".demand-page": 3,
        ".demand-page img": 3,
        "[data-service-board] details": 6,
        "#faq details": 8,
    }
    for selector, count in counts.items():
        if len(preview.select(selector)) != count:
            errors.append(f"проверьте содержимое {selector}, ожидалось {count}")
    if "6 месяцев" not in text(preview.select_one(".delivery-warranty")):
        errors.append("в блоке сопровождения должна быть гарантия 6 месяцев")
    for anchor in ("hero", "cases", "service-pricing-title", "team", "contact", *order):
        if len(preview.find_all(id=anchor)) != 1:
            errors.append(f"ожидался ровно один якорь #{anchor}")
    if team := preview.select_one("#team"):
        check_portraits(home, team, errors)
    check_demand(preview, errors)

    for link in preview.select("main a[href]"):
        href = urljoin(preview_base, link["href"])
        destination = urlsplit(href)
        if destination.netloc != SITE_ROOT.netloc or not destination.path.startswith(SITE_ROOT.path):
            continue
        file = local_file(href)
        if file is None or not file.is_file():
            errors.append(f"не найдена внутренняя страница {href}")
        elif destination.fragment:
            target = preview if destination.path == urlsplit(SITE + PREVIEW).path else BeautifulSoup(
                file.read_text(encoding="utf-8"), "html.parser"
            )
            if not target.find(id=unquote(destination.fragment)):
                errors.append(f"не найден якорь {href}")

    robots = preview.select_one('meta[name="robots"]')
    if not robots or not {"noindex", "nofollow"} <= set(robots.get("content", "").replace(",", " ").lower().split()):
        errors.append("проверьте robots для предпросмотра")
    check_assets(preview, preview_base, errors)
    if errors:
        for error in dict.fromkeys(errors):
            print(error)
        return 1
    print("OK: 11 разделов, первый экран и навигация, блок кейсов с главной, схемы, ссылки и ресурсы.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
