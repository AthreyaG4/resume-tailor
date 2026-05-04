from langchain_core.callbacks import UsageMetadataCallbackHandler
from schemas import NodeTokenUsage


def extract_tokens(callback: UsageMetadataCallbackHandler) -> tuple[int, int, int, str]:
    inp = sum(v.get("input_tokens", 0) for v in callback.usage_metadata.values())
    out = sum(v.get("output_tokens", 0) for v in callback.usage_metadata.values())
    cached = sum(
        v.get("input_token_details", {}).get("cache_read", 0)
        for v in callback.usage_metadata.values()
    )
    model = next(iter(callback.usage_metadata), "")
    return inp, out, cached, model


def merge_token_usage(existing: list, new: list) -> list:
    result = list(existing)
    for entry in new:
        key = (entry.node, entry.label)
        idx = next((i for i, e in enumerate(result) if (e.node, e.label) == key), None)
        if idx is not None:
            m = result[idx]
            result[idx] = NodeTokenUsage(
                node=m.node,
                label=m.label,
                model=m.model or entry.model,
                input_tokens=m.input_tokens + entry.input_tokens,
                output_tokens=m.output_tokens + entry.output_tokens,
                cached_tokens=m.cached_tokens + entry.cached_tokens,
            )
        else:
            result.append(entry)
    return result
