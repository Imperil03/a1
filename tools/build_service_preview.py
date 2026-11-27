"""Build the static web-development preview from the approved home and prototype.

Run with Python and beautifulsoup4. The generated page has no build-time dependencies at runtime.
"""
import posixpath
from hashlib import sha256
from html import escape
from pathlib import Path
from urllib.parse import urlsplit

from bs4 import BeautifulSoup

from service_content import render_service_content
from service_copy import update_development_copy


ROOT = Path(__file__).resolve().parents[1]
DEVELOPMENT = "razrabotka-sajtov"


def shell_url(value, prefix, slug):
    url = urlsplit(value)
    if url.scheme or url.netloc or value.startswith("/"):
        return value
    if url.path.rstrip("/") == f"prototype/{slug}":
        return f"#{url.fragment}" if url.fragment else "./"
    return prefix + value


def render_shell(element, prefix, slug):
    for tag in element.find_all(True):
        for attr in ("href", "src", "data-menu-art"):
            if attr in tag.attrs:
                tag[attr] = shell_url(tag[attr], prefix, slug)
        if tag.has_attr("srcset"):
            candidates = []
            for candidate in tag["srcset"].split(","):
                address, *descriptor = candidate.split()
                candidates.append(" ".join([shell_url(address, prefix, slug), *descriptor]))
            tag["srcset"] = ", ".join(candidates)
    return str(element)


def render_stage(prefix):
    base = prefix + "assets/service-development/"
    return f"""
      <div class="hero-reel-slot">
        <div class="showreel-player service-reel">
          <video aria-label="Демонстрация интерактивного интерфейса на смартфоне"
                 controls muted loop playsinline preload="none" width="540" height="982"
                 poster="{base}hero-mobile-interface.webp"
                 src="{base}hero-mobile-interface.mp4"></video>
          <button class="showreel-control service-reel__toggle" type="button" hidden aria-label="Воспроизвести видео" title="Воспроизвести видео">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path class="service-reel__pause" d="M8 5v14m8-14v14"/><path class="service-reel__play" d="m8 5 11 7-11 7z"/></svg>
          </button>
        </div>
      </div>"""


def offer_lines(offer):
    accent = offer.select_one(".service-hero__accent")
    if accent is None:
        return f'<span class="type-line">{escape(offer.get_text(" ", strip=True))}</span>'
    words = accent.get_text(" ", strip=True)
    tail = offer.get_text(" ", strip=True).removeprefix(words).strip()
    return (f'<span class="type-line type-line--accent">{escape(words)}</span> '
            f'<span class="type-line">{escape(tail)}</span>')


def render_hero(prototype, prefix):
    hero = prototype.select_one("section.service-hero")
    crumbs = hero.select_one(".site-breadcrumbs")
    crumbs.select_one("a")["href"] = prefix
    heading = hero.select_one(".service-hero__headline")
    heading_id = hero["aria-labelledby"]
    category = hero.select_one(".service-hero__label")
    category["class"] = "hero-category"
    descriptions = hero.select(".service-hero__description")
    for paragraph in descriptions:
        paragraph["class"] = "hero-description"
    description = "\n".join(map(str, descriptions))
    action = hero.select_one(".service-hero__copy > a")
    action["class"] = ["service-action"]
    if action.select_one(".cta-motion__label"):
        action["class"].append("cta-motion")
    facts = hero.select_one("dl")
    facts["class"] = "hero-facts"
    offer = offer_lines(heading)
    return f"""
    <section class="service-opening showreel-stage" data-source-section="{heading_id}" aria-labelledby="{heading_id}">
      <div class="home-hero home-hero--flow" id="hero">
        <div class="hero-inner">
          <div class="service-breadcrumbs">{crumbs}</div>
          <div class="hero-layout">
            <div class="service-hero-lead">
              <div class="hero-title">{category}<h1 class="hero-statement" id="{heading_id}">{offer}</h1></div>
              <div class="hero-copy">{description}{action}</div>
            </div>
            {render_stage(prefix)}
            {facts}
          </div>
        </div>
      </div>
    </section>"""


def asset_url(path):
    """Make an already-open preview pick up the corresponding script and styles."""
    if "?" in path:
        return path
    digest = sha256((ROOT / path).read_bytes()).hexdigest()[:10]
    return f"{path}?v={digest}"


def render_index(prototype, sections):
    links = [f'<a href="#{section_id}">{escape(title)}</a>' for section_id, title in sections]
    current = escape(prototype.select_one('.site-breadcrumbs [aria-current]').get_text(" ", strip=True))
    return f"""
    <nav class="service-index" aria-label="Разделы страницы услуги" data-section-index>
      <button type="button" hidden aria-expanded="false" aria-controls="service-index-links" aria-label="Выбрать раздел страницы">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h12M4 18h8"/></svg>
        <span>{current}</span><svg class="index-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      <div id="service-index-links">{''.join(links)}</div>
    </nav>"""


DEVELOPMENT_INDEX = (
    ("service-cases-title", "Проекты"),
    ("site-types-title", "Виды сайтов и цены"),
    ("service-approach-title", "Наш подход"),
    ("service-process-title", "Этапы разработки"),
    ("service-tech-title", "Технологии"),
    ("service-after-launch-title", "Сопровождение"),
    ("service-project-team-title", "Команда"),
    ("reviews-title", "Отзывы"),
    ("service-faq-title", "Частые вопросы"),
)


def build():
    """Render the complete website development preview from its component sources."""
    slug = DEVELOPMENT
    preview = Path("preview") / slug
    prototype_file = ROOT / "prototype" / slug / "index.html"
    prototype = BeautifulSoup(prototype_file.read_text(encoding="utf-8"), "html.parser")
    update_development_copy(prototype)
    home = BeautifulSoup((ROOT / "index.html").read_text(encoding="utf-8"), "html.parser")
    prefix = posixpath.relpath(".", preview.as_posix()) + "/"
    # The approved header and footer also rely on the same cascade as the homepage.
    shared_styles = [
        tag["href"] for tag in home.select('head link[rel~="stylesheet"]')
    ]
    styles = shared_styles + [f"assets/css/{name}.css" for name in (
        "service-page", "service-content", "service-delivery", "service-demand", "service-proof",
    )]
    css = "\n".join(f'    <link rel="stylesheet" href="{prefix}{asset_url(url)}">' for url in styles)
    scripts = (
        "navigation", "heading-reveal", "service-page", "hero-dotfield-glitch", "home-cases",
        "service-content", "service-demand", "service-proof", "contact-stroke",
    )
    script_urls = [asset_url(f"assets/js/{name}.js") for name in scripts]
    cta_script = home.select_one('head script[src^="assets/js/cta-motion.js"]')
    if cta_script:
        script_urls.append(asset_url(cta_script["src"]))
    js = "\n".join(f'    <script defer src="{prefix}{url}"></script>' for url in script_urls)
    page = f"""<!doctype html>
<html lang="ru" data-surface="warm">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <meta name="theme-color" content="#fcfbf9">
    <title>{escape(prototype.title.get_text(strip=True))}</title>
    {prototype.select_one('meta[name="description"]')}
    <link rel="icon" href="{prefix}assets/favicon.svg">
{css}
{js}
    <script type="module" src="{prefix}assets/footer-critter/load.js"></script>
  </head>
  <body class="type-study project-led service-page" data-heading-entrance="chapter" data-motion-tempo="soft" data-hero-variant="dotfield" data-hero-points="hidden">
    <a class="skip-link" href="#main-content">К содержимому</a>
    {render_shell(home.select_one("header.site-header"), prefix, slug)}
    <main id="main-content" tabindex="-1">
      {render_hero(prototype, prefix)}
      {render_index(prototype, DEVELOPMENT_INDEX)}
      {render_service_content(home, prefix)}
    </main>
    {render_shell(home.select_one("footer.a1-footer"), prefix, slug)}
  </body>
</html>
"""
    destination = ROOT / preview / "index.html"
    destination.parent.mkdir(parents=True, exist_ok=True)
    clean_html = "\n".join(line.rstrip() for line in page.splitlines())
    destination.write_text(clean_html + "\n", encoding="utf-8", newline="\n")


if __name__ == "__main__":
    build()
