# ReportesWeb (TrasquilaBI) - Guía de Despliegue

Sistema de reportes web integrado con CONTPAQi Comercial, modernizado para ejecutarse en contenedores Docker.

## 📦 Contenido del Paquete

Este proyecto incluye:
- **Backend (API)**: Python/FastAPI. Se conecta a SQL Server para leer datos y a SQLite para gestionar usuarios.
- **Frontend (Web)**: React/Vite. Interfaz gráfica moderna y rápida.
- **Base de Datos de Usuarios**: `reporter_backend/auth.db` (SQLite). Contiene los usuarios y contraseñas; viaja con el proyecto.

---

## 🛠 Requisitos del Cliente

Para instalar esto en un nuevo cliente, solo necesitas:
1.  **Docker Desktop** instalado y corriendo.
2.  **Acceso a SQL Server**: Credenciales (usuario `sa` o similar) y saber el puerto/instancia.

---

## 🚀 Guía de Instalación (Paso a Paso)

### 1. Copiar la Carpeta
Copia toda la carpeta `ReporteadorTrasquila` a la computadora del cliente.

### 2. Configurar Conexión (.env)
Abre el archivo `reporter_backend/.env` con un editor de texto (Bloc de notas).
Modifica **SOLO** las siguientes líneas con los datos del cliente:

```env
# 1. IP o Nombre del Servidor SQL (usualmente host.docker.internal si está en la misma PC)
DB_SERVER=host.docker.internal

# 2. Nombre de la Base de Datos de CONTPAQi Comercial
DB_NAME=adCOMERCIALIZADORATRASQUILA

# 3. Usuario de SQL Server
DB_USER=sa

# 4. Contraseña de SQL Server
DB_PASSWORD=TuPasswordDeSQL

# 5. Cadena de Conexión (IMPORTANTE: Actualizar PUERTO y PASSWORD aquí también)
# Formato: SERVER=host.docker.internal,PUERTO;DATABASE=NOMBRE_DB;UID=USUARIO;PWD=PASSWORD
SQLSERVER_REPORTING_DSN=DRIVER={ODBC Driver 17 for SQL Server};SERVER=host.docker.internal,63206;DATABASE=adCOMERCIALIZADORATRASQUILA;UID=sa;PWD=TuPasswordDeSQL
```

> **NOTA IMPORTANTE SOBRE EL PUERTO:**
> Si el SQL Server del cliente usa una instancia dinámica (ej. `COMPAC`), debes averiguar el puerto TCP dinámico (ej. `63206`) y ponerlo en la cadena de conexión después de la coma.

### 3. Iniciar el Sistema
Abre una terminal (PowerShell o CMD) en la carpeta del proyecto y ejecuta:

```bash
docker-compose up -d
```

Esto descargará e iniciará todo automáticamente.

### 4. Verificar
Abre el navegador y entra a:
**http://localhost:5173**

---

## 👤 Gestión de Usuarios

Los usuarios **NO** se guardan en SQL Server. Se guardan en el archivo `reporter_backend/auth.db`.
Este archivo ya incluye tus usuarios actuales. Al copiar la carpeta al cliente, **los usuarios se van contigo**.

**Credenciales por defecto (si no las has cambiado):**
- **Usuario:** `admin`
- **Contraseña:** `password123`

---

## 🔍 Dependencias de Base de Datos (Vistas)

El sistema asume que la base de datos de CONTPAQi Comercial tiene las siguientes Vistas creadas:

1.  **`zzVentasResumen`**: Para KPIs y totales rápidos.
2.  **`zzVentasPorProducto`**: Para detalles y Top Productos.
3.  **`zz_SucursalesReporte`**: Catálogo de sucursales.

Si la base de datos del cliente es nueva, asegúrate de ejecutar el script SQL de creación de vistas antes de usar el sistema.

---

## ❓ Solución de Problemas Comunes

**Error: "Login timeout expired"**
- Verifica que el puerto en `SQLSERVER_REPORTING_DSN` sea el correcto.
- Asegúrate de que el firewall de Windows permita conexiones al puerto de SQL Server.

**Error: "Invalid object name 'zzVentasResumen'"**
- Faltan las vistas en la base de datos. Ejecuta el script de vistas en SQL Server Management Studio.
