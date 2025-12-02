# CAMBIO IMPORTANTE: Usamos 'bullseye' (Debian 11) para compatibilidad total con MS SQL
FROM python:3.11-slim-bullseye

WORKDIR /app

# 1. Instalar dependencias y Drivers de Microsoft (Versión corregida)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl gnupg2 build-essential unixodbc-dev && \
    curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add - && \
    curl https://packages.microsoft.com/config/debian/11/prod.list > /etc/apt/sources.list.d/mssql-release.list && \
    apt-get update && \
    ACCEPT_EULA=Y apt-get install -y msodbcsql17 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 2. Instalar requerimientos de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 3. Copiar código
COPY . .

# 4. Arrancar
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]