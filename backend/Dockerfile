FROM python:3.11-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

RUN apt-get update && apt-get install -y curl && \
    curl -L https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%400.15.0/tectonic-0.15.0-x86_64-unknown-linux-musl.tar.gz \
    | tar -xz -C /usr/local/bin/ && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

ENV XDG_CACHE_HOME=/usr/local/tectonic-cache

RUN tectonic - <<'EOF'
\documentclass{article}
\usepackage{amsmath, amssymb, amsfonts}
\usepackage{graphicx, xcolor}
\usepackage{tikz, pgfplots}
\usepackage{enumitem, etoolbox}
\usepackage{fontawesome, hyperref, xparse}
\usepackage[utf8]{inputenc}
\usepackage{ragged2e, setspace, titlesec, changepage, geometry}
\usepackage{caption, subcaption, float, booktabs, array, multirow, longtable}
\usepackage{fancyhdr, microtype, lmodern, textcomp}
\begin{document}
Hello Preload
\[\int_0^1 x^2 dx\]
\begin{tikzpicture}\draw (0,0) -- (1,1);\end{tikzpicture}
\begin{itemize}\item Test\end{itemize}
\faEnvelope
\begin{figure}\begin{subfigure}{0.2\textwidth}A\end{subfigure}\end{figure}
\end{document}
EOF

WORKDIR /app

COPY pyproject.toml uv.lock ./

RUN uv sync --no-dev --frozen

COPY . .

CMD ["uv", "run", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "5000"]