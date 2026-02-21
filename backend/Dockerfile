FROM python:3.11-slim

RUN useradd -m appuser

RUN apt-get update && apt-get install -y \
    texlive-latex-extra \
    texlive-fonts-recommended \
    texlive-fonts-extra \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install uv

RUN uv pip install --no-cache-dir -r requirements.txt --system

COPY . .

RUN chown -R appuser:appuser /app

USER appuser

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "5000"]