"""Copy the full homepage cases section to the service page."""

from copy import copy


def copy_home_cases(home):
    section = copy(home.select_one("section#cases"))
    heading = section.find("h2")
    heading["id"] = "service-cases-title"
    heading["data-service-reveal"] = ""
    section["aria-labelledby"] = heading["id"]
    section["data-source-section"] = heading["id"]

    return section
