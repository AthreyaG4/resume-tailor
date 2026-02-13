FROM python:3.11-slim

RUN useradd -m appuser

WORKDIR /app

COPY requirements.txt .
RUN pip install uv

RUN uv pip install --no-cache-dir -r requirements.txt --system

COPY . .

RUN chown -R appuser:appuser /app

USER appuser

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "5000"]