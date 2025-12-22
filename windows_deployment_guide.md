# Guía de Despliegue en Windows Server (Sin Docker)

Esta guía detalla los pasos para desplegar el "Reporteador Trasquila" en un entorno Windows Server donde no es posible utilizar Docker.
El despliegue consiste en ejecutar el Backend (FastAPI/Python) como un servicio de Windows y servir el Frontend (React/Vite) como archivos estáticos a través del mismo backend.

## Prerrequisitos

Antes de comenzar, asegúrate de tener instalado en el servidor:

1.  **Python 3.10+**: [Descargar Python](https://www.python.org/downloads/windows/).
    *   **IMPORTANTE**: Al instalar, marca la casilla "Add Python to PATH".
2.  **Node.js (Opcional, solo para construir)**: [Descargar Node.js](https://nodejs.org/).
    *   Necesario solo si vas a compilar el frontend en el servidor. Si compilas en tu máquina local y subes la carpeta `dist`, no es necesario.
3.  **ODBC Driver 17 for SQL Server**: [Descargar Driver](https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server).
    *   Necesario para que Python se conecte a la base de datos SQL Server.
4.  **NSSM (Non-Sucking Service Manager)**: [Descargar NSSM](https://nssm.cc/download).
    *   Herramienta para ejecutar el script de Python como un servicio de Windows. Descarga el zip y extrae `nssm.exe` (versión win64) en una carpeta accesible (ej. `C:\tools\nssm.exe`).

---

## 1. Preparación del Frontend

El frontend debe compilarse a archivos estáticos (HTML/JS/CSS).

### Opción A: Compilar en máquina local (Recomendado)
1.  En tu máquina de desarrollo, navega a `reporter_frontend`.
2.  Ejecuta:
    ```powershell
    npm run build
    ```
3.  Esto generará una carpeta `dist` dentro de `reporter_frontend`.
4.  Copia esta carpeta `dist` al servidor, dentro de la estructura del proyecto (ver sección Estructura de Carpetas).

### Opción B: Compilar en el servidor
1.  Instala Node.js en el servidor.
2.  Navega a `reporter_frontend`.
3.  Ejecuta `npm install` y luego `npm run build`.

---

## 2. Preparación del Backend

1.  Copia todo el código del proyecto al servidor (ej. `C:\Apps\ReporteadorTrasquila`).
2.  Navega a la carpeta del proyecto.

### Crear Entorno Virtual
Abre PowerShell como Administrador y ejecuta:

```powershell
cd C:\Apps\ReporteadorTrasquila
python -m venv venv
```

### Activar Entorno e Instalar Dependencias
```powershell
.\venv\Scripts\Activate
pip install --upgrade pip
cd reporter_backend
pip install -r requirements.txt
```

### Configuración de Variables de Entorno
1.  En `reporter_backend`, copia el archivo `.env.example` y renómbralo a `.env`.
2.  Edita `.env` con los datos reales del servidor:

```ini
APP_ENV=production
APP_PORT=9000

# Cadena de conexión a SQL Server
# Ajusta SERVER, UID (usuario) y PWD (contraseña).
# Si usas autenticación de Windows, la cadena cambia ligeramente.
SQLSERVER_REPORTING_DSN=mssql+pyodbc://sa:MiPasswordSeguro@LOCALHOST/ReportesDB?driver=ODBC+Driver+17+for+SQL+Server

# Base de datos local para usuarios (se creará automáticamente si no existe)
AUTH_DATABASE_URL=sqlite:///./auth.db
```

---

## 3. Verificar Ejecución Manual

Antes de crear el servicio, prueba que todo funciona manualmente.

1.  Asegúrate de que la carpeta `dist` (frontend compilado) esté en `C:\Apps\ReporteadorTrasquila\reporter_frontend\dist`.
2.  Desde `reporter_backend` (con el entorno virtual activado):

```powershell
python -m app.main
# O si usas uvicorn directo:
uvicorn app.main:app --host 0.0.0.0 --port 9000
```

3.  Abre un navegador en el servidor y ve a `http://localhost:9000`. Deberías ver la aplicación.
4.  Presiona `Ctrl+C` para detenerlo.

---

## 4. Crear Servicio de Windows (NSSM)

Para que la aplicación inicie automáticamente con Windows y se reinicie si falla.

1.  Abre PowerShell como Administrador.
2.  Ejecuta el comando de instalación de NSSM (ajusta la ruta donde guardaste nssm.exe):

```powershell
C:\tools\nssm.exe install ReporteadorTrasquila
```

3.  Se abrirá una ventana de configuración. Llena los campos:

    *   **Application Tab**:
        *   **Path**: `C:\Apps\ReporteadorTrasquila\venv\Scripts\uvicorn.exe`
            *(Apunta al uvicorn dentro del entorno virtual)*
        *   **Startup directory**: `C:\Apps\ReporteadorTrasquila\reporter_backend`
        *   **Arguments**: `app.main:app --host 0.0.0.0 --port 9000 --workers 4`

    *   **Details Tab**:
        *   **Display name**: Reporteador Trasquila Service
        *   **Description**: Servicio API y Web para Reportes.
        *   **Startup type**: Automatic

    *   **I/O Tab (Opcional pero recomendado para logs)**:
        *   **Output (stdout)**: `C:\Apps\ReporteadorTrasquila\logs\service.log`
        *   **Error (stderr)**: `C:\Apps\ReporteadorTrasquila\logs\error.log`
            *(Asegúrate de crear la carpeta `logs` antes)*

4.  Haz clic en **Install service**.

### Iniciar el servicio
```powershell
Start-Service ReporteadorTrasquila
```

### Verificar estado
```powershell
Get-Service ReporteadorTrasquila
```

Si necesitas editar el servicio después:
```powershell
C:\tools\nssm.exe edit ReporteadorTrasquila
```

---

## 5. Firewall

Asegúrate de abrir el puerto **9000** en el Firewall de Windows para permitir acceso desde otras máquinas en la red.

1.  Panel de Control > Sistema y Seguridad > Firewall de Windows Defender > Configuración avanzada.
2.  Reglas de entrada > Nueva Regla...
3.  Tipo: Puerto.
4.  TCP, Puertos locales específicos: `9000`.
5.  Permitir la conexión.
6.  Nombre: `Reporteador Web 9000`.

---

¡Listo! La aplicación ahora debería estar accesible en `http://IP_DEL_SERVIDOR:9000`.
