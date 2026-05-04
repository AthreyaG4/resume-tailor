import requests
from bs4 import BeautifulSoup


def clean_description_html(description_div) -> str:
    html_doc = str(description_div) if description_div else ""
    soup = BeautifulSoup(html_doc, "html.parser")
    parsed_sections = []

    for strong_tag in soup.find_all("strong"):
        header = strong_tag.get_text(strip=True)
        parsed_sections.append(f"{header}\n{'-' * len(header)}")

        content = []
        for sibling in strong_tag.next_siblings:
            if sibling.name == "strong":
                break

            if sibling.name == "ul":
                for li in sibling.find_all("li"):
                    content.append(f"• {li.get_text(strip=True)}")
            elif sibling.name == "br":
                continue
            elif sibling.name:
                text = sibling.get_text(strip=True)
                if text:
                    content.append(text)
            else:
                text = str(sibling).strip()
                if text:
                    content.append(text)

        parsed_sections.append("\n".join(content) + "\n")
    final_string = "\n".join(parsed_sections)
    return final_string


def fetch_job_description(jobID: str):
    target_url = f"https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/{jobID}"
    resp = requests.get(target_url)

    if resp.status_code == 404:
        raise ValueError(f"Job ID {jobID} not found on LinkedIn.")

    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")

    try:
        company = (
            soup.find("div", {"class": "top-card-layout__card"})
            .find("a")
            .find("img")
            .get("alt")
            .strip()
        )
    except:
        company = None

    try:
        job_title = (
            soup.find("div", {"class": "top-card-layout__entity-info"})
            .find("a")
            .text.strip()
        )
    except:
        job_title = None

    location = soup.find("span", class_="topcard__flavor--bullet").get_text(strip=True)

    emp_type = "Not found"
    criteria_headers = soup.find_all("h3", class_="description__job-criteria-subheader")
    for header in criteria_headers:
        if "Employment type" in header.get_text():
            emp_type = header.find_next_sibling("span").get_text(strip=True)

    description_div = soup.find("div", {"class": "show-more-less-html__markup"})
    cleaned_description = (
        clean_description_html(description_div) if description_div else ""
    )

    return cleaned_description, company, job_title, location, emp_type
