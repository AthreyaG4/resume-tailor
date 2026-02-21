from config import settings
from llama_cloud_services import LlamaParse

LLAMA_PARSE_API_KEY = settings.LLAMA_PARSE_API_KEY


def parse_resume(file_bytes: bytes, filename: str) -> str:
    parser = LlamaParse(
        api_key=LLAMA_PARSE_API_KEY,
        parse_mode="parse_page_without_llm",
    )

    result = parser.parse(file_bytes, extra_info={"file_name": filename})

    text = ""
    for page in result.pages:
        text = text + page.text
    return text
