FROM python:3.12.7-slim

WORKDIR /app

RUN apt-get update && apt-get install -y build-essential

COPY apps/api/requirements.txt .

RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

COPY apps/api/ .

EXPOSE 10000

CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "app.main:app", "--bind", "0.0.0.0:10000"]
