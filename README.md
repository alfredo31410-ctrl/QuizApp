# QuizApp

Aplicacion de diagnostico CEFIN con frontend en React y backend en FastAPI.

## Stack recomendado para lanzar rapido

- Frontend: Vercel
- Backend: Railway
- Base de datos: MongoDB Atlas

## Que instalar

### 1. Node.js

- Instala Node.js 20 LTS desde [https://nodejs.org/](https://nodejs.org/)

### 2. Python

- Instala Python 3.11 o 3.12 desde [https://www.python.org/downloads/windows/](https://www.python.org/downloads/windows/)
- Activa la opcion `Add Python to PATH`

### 3. MongoDB Atlas

- Crea una cuenta en [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas)
- Crea un cluster gratuito
- Crea un usuario de base de datos
- Agrega tu IP actual a la lista de acceso
- Copia tu cadena de conexion

## Variables de entorno

### Backend

1. Copia [backend/.env.example](/C:/Users/cgcon/OneDrive/Escritorio/QUIZZ/QuizApp/backend/.env.example)
2. Crea `backend/.env`
3. Llena estos valores:

```env
MONGO_URL=
DB_NAME=quizapp
JWT_SECRET=
CORS_ORIGINS=http://localhost:3000
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ADMIN_PHONE=
WHATSAPP_MESSAGE_TYPE=text
```

Variables opcionales si usas plantilla aprobada por Meta:

```env
WHATSAPP_MESSAGE_TYPE=template
WHATSAPP_TEMPLATE_NAME=diagnostico_cefin
WHATSAPP_TEMPLATE_LANGUAGE=es_MX
WHATSAPP_GRAPH_VERSION=v21.0
```

### Frontend

1. Copia [frontend/.env.example](/C:/Users/cgcon/OneDrive/Escritorio/QUIZZ/QuizApp/frontend/.env.example)
2. Crea `frontend/.env`
3. Llena este valor:

```env
REACT_APP_BACKEND_URL=http://localhost:8000
```

## Como correr en local

### Backend

```powershell
cd C:\Users\cgcon\OneDrive\Escritorio\QUIZZ\QuizApp\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

### Crear el primer admin

Con el entorno virtual activo:

```powershell
python seed_admin.py
```

El registro publico de admins esta deshabilitado. El acceso admin es solo por `email + contrasena` creados manualmente.

### Frontend

```powershell
cd C:\Users\cgcon\OneDrive\Escritorio\QUIZZ\QuizApp\frontend
npm install
npm start
```

## Archivos importantes para modificar despues

### Contenido del diagnostico

- [backend/assessment_config.json](/C:/Users/cgcon/OneDrive/Escritorio/QUIZZ/QuizApp/backend/assessment_config.json)

Aqui cambias:

- preguntas
- opciones A-E
- puntajes
- clasificacion final
- textos de resultados por nivel

### Backend principal

- [backend/server.py](/C:/Users/cgcon/OneDrive/Escritorio/QUIZZ/QuizApp/backend/server.py)

Aqui cambias:

- endpoints
- autenticacion
- exportaciones
- integraciones reales

## WhatsApp real

El backend ya puede mandar mensajes con WhatsApp Cloud API de Meta.

Para pruebas rapidas puedes usar:

```env
WHATSAPP_MESSAGE_TYPE=text
```

Para produccion formal normalmente conviene usar:

```env
WHATSAPP_MESSAGE_TYPE=template
```

Nota importante: WhatsApp tiene reglas de Meta. Los mensajes libres tipo `text` solo funcionan si existe una conversacion abierta o en ciertos entornos de prueba. Para iniciar conversaciones en produccion, Meta suele requerir una plantilla aprobada.

Variables necesarias en Railway:

- `WHATSAPP_ACCESS_TOKEN`: token permanente o token valido de Meta.
- `WHATSAPP_PHONE_NUMBER_ID`: ID del numero emisor en Meta.
- `WHATSAPP_ADMIN_PHONE`: numero destino en formato internacional sin `+`, por ejemplo `525512345678`.
- `WHATSAPP_MESSAGE_TYPE`: `text` o `template`.
- `WHATSAPP_TEMPLATE_NAME`: requerido si usas `template`.
- `WHATSAPP_TEMPLATE_LANGUAGE`: por ejemplo `es_MX`.
- `WHATSAPP_GRAPH_VERSION`: opcional, por defecto `v21.0`.

Despues de cada diagnostico completo, revisa el detalle del usuario en el admin. La seccion `Integraciones` muestra si WhatsApp quedo `sent`, `failed` o `mocked`, junto con la respuesta de Meta.

### Crear admin manual

- [backend/seed_admin.py](/C:/Users/cgcon/OneDrive/Escritorio/QUIZZ/QuizApp/backend/seed_admin.py)

### Configuracion de entorno backend

- `backend/.env`

### Configuracion de entorno frontend

- `frontend/.env`

### Login admin

- [frontend/src/pages/AdminLogin.jsx](/C:/Users/cgcon/OneDrive/Escritorio/QUIZZ/QuizApp/frontend/src/pages/AdminLogin.jsx)

### Flujo del cuestionario

- [frontend/src/pages/Assessment.jsx](/C:/Users/cgcon/OneDrive/Escritorio/QUIZZ/QuizApp/frontend/src/pages/Assessment.jsx)

### Pantalla de resultados

- [frontend/src/pages/Result.jsx](/C:/Users/cgcon/OneDrive/Escritorio/QUIZZ/QuizApp/frontend/src/pages/Result.jsx)

### Panel admin

- [frontend/src/pages/AdminDashboard.jsx](/C:/Users/cgcon/OneDrive/Escritorio/QUIZZ/QuizApp/frontend/src/pages/AdminDashboard.jsx)
- [frontend/src/pages/UserDetail.jsx](/C:/Users/cgcon/OneDrive/Escritorio/QUIZZ/QuizApp/frontend/src/pages/UserDetail.jsx)

## Que falta para produccion

- Configurar MongoDB Atlas real
- Configurar `JWT_SECRET` seguro
- Configurar `CORS_ORIGINS` con tu dominio real
- Desplegar backend en Railway
- Desplegar frontend en Vercel
- Crear primer admin con `seed_admin.py`
- Reemplazar mocks de ActiveCampaign, WhatsApp y Calendly por integraciones reales cuando toque

## Deploy recomendado

### Backend en Railway

- Crea un proyecto nuevo en Railway
- Conecta tu repositorio de GitHub
- En el servicio del backend usa `backend` como Root Directory
- Railway detectara Python por `requirements.txt`
- El arranque esta definido en [backend/Procfile](/C:/Users/cgcon/OneDrive/Escritorio/QUIZZ/QuizApp/backend/Procfile)

Variables que debes cargar en Railway:

- `MONGO_URL`
- `DB_NAME`
- `JWT_SECRET`
- `CORS_ORIGINS`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_ADMIN_PHONE`
- `WHATSAPP_MESSAGE_TYPE`

Cuando termine el deploy, genera un dominio publico en Railway.

### Frontend en Vercel

- Crea un proyecto nuevo en Vercel
- Conecta el mismo repositorio de GitHub
- Usa `frontend` como Root Directory
- El frontend es CRA y Vercel lo puede compilar con `npm run build`
- El rewrite para React Router ya esta en [frontend/vercel.json](/C:/Users/cgcon/OneDrive/Escritorio/QUIZZ/QuizApp/frontend/vercel.json)

Variable que debes cargar en Vercel:

- `REACT_APP_BACKEND_URL`

Despues del deploy del backend, esta variable debe apuntar al dominio publico de Railway, por ejemplo:

```env
REACT_APP_BACKEND_URL=https://tu-backend-production.up.railway.app
```

### Importante

Si usas un dominio real despues, recuerda actualizar:

- `CORS_ORIGINS` en Railway
- `REACT_APP_BACKEND_URL` en Vercel
