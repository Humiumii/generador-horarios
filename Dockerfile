FROM node:24-bookworm-slim AS web
WORKDIR /app/web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY catalog.json /app/catalog.json
COPY web/ ./
RUN npm run build

FROM python:3.13-slim-bookworm
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY catalog.json ./
COPY scheduler/ ./scheduler/
COPY --from=web /app/web/dist ./web/dist
EXPOSE 8765
CMD ["sh", "-c", "exec python -m uvicorn scheduler.api:app --host 0.0.0.0 --port ${PORT:-8765}"]
