# 🚀 INICIO RÁPIDO - ReportesWeb en Producción

## Ejecuta estos comandos EN ORDEN (como Administrador):

### 1️⃣ Limpiar servicio antiguo
```cmd
c:\ReportesWeb\cleanup_old_service.bat
```

### 2️⃣ Instalar Caddy
```cmd
c:\ReportesWeb\install_caddy.bat
```

### 3️⃣ Compilar frontend (NO requiere Admin)
```cmd
c:\ReportesWeb\build_frontend.bat
```

### 4️⃣ Instalar servicios de producción
```cmd
c:\ReportesWeb\install_production_services_caddy.bat
```

---

## ✅ Verificación

Si todo funcionó, deberías poder acceder a:
- **Aplicación**: http://localhost:3000/
- **API Docs**: http://localhost:3000/docs

---

## 📋 Gestión Diaria

| Acción | Comando |
|--------|---------|
| Ver estado | `status_production.bat` |
| Iniciar servicios | `start_production.bat` (Admin) |
| Detener servicios | `stop_production.bat` (Admin) |

---

Para más detalles, consulta: [walkthrough.md](file:///C:/Users/PLATAFORMAI/.gemini/antigravity/brain/71e6e5c8-8e61-4d7f-8269-a2b8755bd65d/walkthrough.md)
