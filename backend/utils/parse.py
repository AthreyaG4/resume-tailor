from config import settings
from schemas import ResumeSchema
import asyncio
from llama_cloud_services import LlamaExtract, SourceText
from llama_cloud import ExtractConfig, ExtractMode, ExtractTarget

LLAMA_PARSE_API_KEY = settings.LLAMA_PARSE_API_KEY


async def parse_resume(file_bytes: bytes, filename: str) -> str:
    config = ExtractConfig(
        extraction_target=ExtractTarget.PER_DOC,
        extraction_mode=ExtractMode.MULTIMODAL,
        parse_model=None,
        extract_model="openai-gpt-4-1",
        system_prompt=None,
        page_range=None,
        num_pages_context=None,
        cite_sources=False,
        use_reasoning=True,
        confidence_scores=False,
        chunk_mode="PAGE",
        high_resolution_mode=True,
        invalidate_cache=False,
    )

    extractor = LlamaExtract(api_key=LLAMA_PARSE_API_KEY)

    loop = asyncio.get_event_loop()

    def extract_resume():
        print("STARTING TO PARSE")
        return extractor.extract(
            ResumeSchema,
            config=config,
            files=SourceText(file=file_bytes, filename=filename),
        ).data

    result = await loop.run_in_executor(None, extract_resume)
    return result
