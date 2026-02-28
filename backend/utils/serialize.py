import json


class SetEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, set):
            return list(obj)
        if hasattr(obj, "model_dump"):
            return obj.model_dump()
        return super().default(obj)


def serialize_output(output: dict) -> dict:
    # dumps then loads to resolve all nested sets/pydantic models
    return json.loads(json.dumps(output, cls=SetEncoder))
