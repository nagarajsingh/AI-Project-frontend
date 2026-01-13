FROM python:3.11-alpine

WORKDIR /app

RUN apk add --no-cache nginx

COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

COPY backend /app/backend
COPY index.html styles.css app.js /var/lib/nginx/html/
COPY start.sh /app/start.sh

RUN chmod +x /app/start.sh

EXPOSE 80 8000

CMD ["/app/start.sh"]
