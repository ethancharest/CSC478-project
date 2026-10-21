# Slim version of the base Python image: smaller image, faster pulls.
FROM python:3.11-slim

WORKDIR /app

# curl is used by the docker-compose healthcheck (local development only).
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first so the pip layer is cached until they change.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

# Run as an unprivileged user instead of root.
RUN useradd --uid 10001 --no-create-home appuser
USER 10001

EXPOSE 5000

# Gunicorn is a production WSGI server; 2 workers handle concurrent requests.
CMD ["gunicorn", "--workers", "2", "--bind", "0.0.0.0:5000", "--access-logfile", "-", "app:app"]
