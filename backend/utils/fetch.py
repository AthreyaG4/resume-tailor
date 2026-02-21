import requests
from bs4 import BeautifulSoup


def fetch_job_description(jobID: str):
    target_url = f"https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/{jobID}"
    resp = requests.get(target_url)

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

    description_div = soup.find("div", {"class": "show-more-less-html__markup"})
    description_html = str(description_div) if description_div else ""
    return description_html, company, job_title
