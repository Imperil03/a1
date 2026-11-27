"""Compose the service page in the order of the approved brief."""

from urllib.parse import urlsplit

from service_delivery import render_formats, render_handover, render_process, render_technology
from service_demand import render_demand
from service_home_cases import copy_home_cases
from service_proof import copy_proof


def render_home_section(section, prefix):
    """Resolve homepage-relative links and media in a reused section."""
    attributes = ("href", "src", "poster", "data-case-video-src")
    for element in section.select("[href], [src], [poster], [data-case-video-src]"):
        for attribute in attributes:
            value = element.get(attribute)
            if not value:
                continue
            url = urlsplit(value)
            if url.path and not url.scheme and not url.netloc and not value.startswith("/"):
                element[attribute] = prefix + value
    return str(section)


def render_service_content(home, prefix):
    service_sections = (
        render_formats(prefix),
        render_demand(prefix),
        render_process(prefix),
        render_technology(prefix),
        render_handover(prefix),
    )
    return "\n".join((
        render_home_section(copy_home_cases(home), prefix),
        '<div class="service-content">',
        *service_sections,
        '</div>',
        *(render_home_section(section, prefix) for section in copy_proof(home)),
    ))
