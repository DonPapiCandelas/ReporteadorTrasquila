# ReportesWeb (TrasquilaBI)

Sistema de reportes web integrado con CONTPAQi Comercial, desarrollado con una arquitectura moderna separando el Backend (FastAPI) y el Frontend (React/Vite).

## 📂 Estructura del Proyecto

El proyecto se divide en dos componentes principales:

- **`reporter_backend/`**: API REST desarrollada en Python con FastAPI. Se encarga de la conexión a la base de datos SQL Server, la autenticación de usuarios y la generación de reportes en Excel.
- **`reporter_frontend/`**: Interfaz de usuario desarrollada en React con Vite y Tailwind CSS. Proporciona el Dashboard, las tablas de datos y la visualización de gráficos.

## 🛠 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Python 3.10** o superior.
- **Node.js 18** o superior (incluye npm).
- **SQL Server**: Instancia de CONTPAQi Comercial o compatible.
- **ODBC Driver 17 (o 18) for SQL Server**: Necesario para que Python se conecte a la base de datos.

---

## 🚀 Instalación y Configuración

### 1. Backend (Python/FastAPI)

1.  Navega a la carpeta del backend:
    ```bash
    cd reporter_backend
    ```

2.  Crea un entorno virtual para aislar las dependencias:
    ```bash
    python -m venv venv
    ```

3.  Activa el entorno virtual:
    - **Windows**: `venv\Scripts\activate`
    - **Linux/Mac**: `source venv/bin/activate`

4.  Instala las librerías necesarias:
    ```bash
    pip install -r requirements.txt
    ```

5.  **Configuración (.env)**:
    Crea un archivo `.env` en la carpeta `reporter_backend/app/` (o en la raíz del backend) basándote en el siguiente ejemplo:

    ```env
    # Conexión a Base de Datos de Reportes (CONTPAQi)
    SQLSERVER_REPORTING_DSN=mssql+pyodbc://sa:TuPassword@LOCALHOST\COMPAC/adCOM_TuEmpresa?driver=ODBC+Driver+17+for+SQL+Server

    # Conexión a Base de Datos de Usuarios (Auth)
    SQLSERVER_AUTH_DSN=mssql+pyodbc://sa:TuPassword@LOCALHOST\COMPAC/ReportesWeb_Auth?driver=ODBC+Driver+17+for+SQL+Server

    # Seguridad
    SECRET_KEY=TuClaveSecretaSuperSeguraGeneradaConOpenssl
    ALGORITHM=HS256
    ACCESS_TOKEN_EXPIRE_MINUTES=30
    ```

### 2. Frontend (React/Vite)

1.  Navega a la carpeta del frontend:
    ```bash
    cd reporter_frontend
    ```

2.  Instala las dependencias de Node.js:
    ```bash
    npm install
    ```

3.  (Opcional) Si necesitas cambiar la URL del API, edita el archivo `.env` del frontend o la configuración de Axios en `src/api/axios.ts`.

---

## ▶️ Ejecución

### Iniciar Backend

Desde la carpeta `reporter_backend` (con el entorno virtual activado):

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
El API estará disponible en: `http://localhost:8000`
Documentación interactiva (Swagger): `http://localhost:8000/docs`

### Iniciar Frontend

Desde la carpeta `reporter_frontend`:

```bash
npm run dev
```
La aplicación web estará disponible en: `http://localhost:5173` (o el puerto que indique la consola).

---

## 🎨 Personalización

### Cambiar Colores (Frontend)
Para modificar la paleta de colores de la aplicación web (modo claro y oscuro), edita el archivo:
`reporter_frontend/src/index.css`

Busca la sección `:root` para el tema claro y `.dark` para el tema oscuro. Las variables principales son:
- `--color-primary`: Color principal de la marca.
- `--bg-background`: Color de fondo general.

### Cambiar Logo (Reportes Excel)
Para cambiar el logo que aparece en los archivos Excel generados:
1.  Reemplaza el archivo de imagen en `reporter_backend/app/reports/logo.png` (o la ruta configurada).
2.  Si deseas ajustar el tamaño o posición, edita `reporter_backend/app/reports/excel_generator.py`.

### Personalizar Columnas de Excel
La lógica de generación de Excel se encuentra en:
`reporter_backend/app/reports/excel_generator.py`

Dentro de este archivo, busca las funciones de generación (ej. `generar_excel_ventas_producto`) para modificar:
- Encabezados de columnas.
- Ancho de celdas.
- Colores de fondo y fuentes.

---

## 🆘 Soporte

Si encuentras problemas de conexión a la base de datos, verifica:
1.  Que el servicio de SQL Server esté corriendo.
2.  Que las credenciales en el archivo `.env` sean correctas.
3.  Que el firewall permita la conexión al puerto de SQL Server (usualmente 1433).
