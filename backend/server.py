from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
import csv
import io
import asyncio
import urllib.error
import urllib.request
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from collections import defaultdict
import jwt
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')
ASSESSMENT_CONFIG_PATH = ROOT_DIR / "assessment_config.json"

with ASSESSMENT_CONFIG_PATH.open("r", encoding="utf-8") as config_file:
    ASSESSMENT_CONFIG = json.load(config_file)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24
LOGIN_WINDOW_MINUTES = 15
MAX_LOGIN_ATTEMPTS = 5
ALLOWED_ORIGINS = [origin.strip() for origin in os.environ.get('CORS_ORIGINS', '*').split(',') if origin.strip()]
FAILED_LOGIN_ATTEMPTS = defaultdict(list)
WHATSAPP_GRAPH_VERSION = os.environ.get("WHATSAPP_GRAPH_VERSION", "v21.0")
WHATSAPP_ACCESS_TOKEN = os.environ.get("WHATSAPP_ACCESS_TOKEN")
WHATSAPP_PHONE_NUMBER_ID = os.environ.get("WHATSAPP_PHONE_NUMBER_ID")
WHATSAPP_ADMIN_PHONE = os.environ.get("WHATSAPP_ADMIN_PHONE")
WHATSAPP_MESSAGE_TYPE = os.environ.get("WHATSAPP_MESSAGE_TYPE", "text").lower()
WHATSAPP_TEMPLATE_NAME = os.environ.get("WHATSAPP_TEMPLATE_NAME")
WHATSAPP_TEMPLATE_LANGUAGE = os.environ.get("WHATSAPP_TEMPLATE_LANGUAGE", "es_MX")

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# ============ MODELS ============

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str

class ResponseItem(BaseModel):
    question_id: int
    option_id: str

class AssessmentSubmit(BaseModel):
    user_id: str
    responses: List[ResponseItem]

class UserCapture(BaseModel):
    name: str
    email: EmailStr
    phone: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    phone: str
    score: Optional[int] = None
    level: Optional[int] = None
    user_status: str = "abandoned"  # "abandoned" or "completed"
    created_at: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    question: str
    answer: str
    score: int

class AdminLogin(BaseModel):
    email: str
    password: str

class AdminCreate(BaseModel):
    email: str
    password: str
    name: str

class AdminToken(BaseModel):
    access_token: str
    token_type: str = "bearer"

# ============ HELPER FUNCTIONS ============

def calculate_level(score: int) -> int:
    """Calcula el nivel final usando los rangos definidos en assessment_config.json."""
    for level in ASSESSMENT_CONFIG["levels"]:
        if level["min_score"] <= score <= level["max_score"]:
            return level["id"]
    raise HTTPException(status_code=400, detail="Score is outside configured ranges")

def get_level_name(level_id: int) -> str:
    """Devuelve el nombre comercial del nivel para reportes y notificaciones."""
    for level in ASSESSMENT_CONFIG["levels"]:
        if level["id"] == level_id:
            return level["name"]
    return f"Nivel {level_id}"

def get_question_map() -> dict:
    """Prepara un mapa de preguntas para validar respuestas rápido y sin confiar en el frontend."""
    return {
        question["id"]: {
            **question,
            "options_by_id": {option["id"]: option for option in question["options"]},
        }
        for question in ASSESSMENT_CONFIG["questions"]
    }

def get_option_score(option_id: str) -> int:
    """Convierte A/B/C/D/E en puntos según el sistema configurado."""
    score = ASSESSMENT_CONFIG["score_system"].get(option_id.upper())
    if score is None:
        raise HTTPException(status_code=400, detail=f"Invalid option id: {option_id}")
    return score

def normalize_email(email: str) -> str:
    return email.strip().lower()

def normalize_phone(phone: str) -> str:
    return phone.strip()

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(email: str) -> str:
    expiration = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {"sub": email, "exp": expiration}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def ensure_secure_settings() -> None:
    if JWT_SECRET == 'your-secret-key-change-in-production':
        logger.warning("JWT_SECRET is using the default insecure value. Change it before production deployment.")
    if '*' in ALLOWED_ORIGINS:
        logger.warning("CORS_ORIGINS currently allows every origin. Restrict it before final production launch.")

def get_client_identifier(request: Request, email: str) -> str:
    forwarded_for = request.headers.get("x-forwarded-for", "")
    client_ip = forwarded_for.split(",")[0].strip() if forwarded_for else (request.client.host if request.client else "unknown")
    return f"{client_ip}:{email}"

def is_rate_limited(identifier: str) -> bool:
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(minutes=LOGIN_WINDOW_MINUTES)
    FAILED_LOGIN_ATTEMPTS[identifier] = [
        attempt for attempt in FAILED_LOGIN_ATTEMPTS[identifier]
        if attempt > cutoff
    ]
    return len(FAILED_LOGIN_ATTEMPTS[identifier]) >= MAX_LOGIN_ATTEMPTS

def register_failed_attempt(identifier: str) -> None:
    FAILED_LOGIN_ATTEMPTS[identifier].append(datetime.now(timezone.utc))

def clear_failed_attempts(identifier: str) -> None:
    FAILED_LOGIN_ATTEMPTS.pop(identifier, None)

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        admin = await db.admins.find_one({"email": email}, {"_id": 0})
        if admin is None:
            raise HTTPException(status_code=401, detail="Admin not found")
        return admin
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============ MOCK INTEGRATIONS ============

async def record_integration_event(user_id: str, provider: str, status: str, payload: dict):
    """Guarda evidencia de una integración simulada o real para poder auditarla después."""
    event = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "provider": provider,
        "status": status,
        "payload": payload,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.integration_events.insert_one(event)
    return event

async def mock_active_campaign(user_id: str, user_data: dict, level: int):
    """Simula ActiveCampaign. Aquí se cambia por la llamada real cuando tengamos credenciales."""
    tag = "low_level" if level <= 2 else "high_level"
    payload = {
        "name": user_data["name"],
        "email": user_data["email"],
        "phone": user_data["phone"],
        "level": level,
        "level_name": get_level_name(level),
        "tag": tag,
    }
    logging.info("[MOCK ActiveCampaign] %s", payload)
    await record_integration_event(user_id, "active_campaign", "mocked", payload)
    return {"success": True, "status": "mocked", "tag": tag, "message": "ActiveCampaign simulated"}

def build_whatsapp_message(user_data: dict, score: int, level: int) -> str:
    """Arma el texto exacto que recibirá el admin por WhatsApp cuando se conecte la API real."""
    return (
        "Nuevo diagnóstico CEFIN completado\n"
        f"Nombre: {user_data['name']}\n"
        f"Correo: {user_data['email']}\n"
        f"Teléfono: {user_data['phone']}\n"
        f"Resultado: {get_level_name(level)}\n"
        f"Nivel: {level}\n"
        f"Puntuación: {score}"
    )

async def mock_whatsapp_notification(user_id: str, user_data: dict, score: int, level: int):
    """Simula WhatsApp y guarda evidencia del mensaje que se mandaría."""
    message = build_whatsapp_message(user_data, score, level)
    payload = {
        "to": os.environ.get("WHATSAPP_ADMIN_PHONE", "not_configured"),
        "message": message,
        "score": score,
        "level": level,
        "level_name": get_level_name(level),
    }
    logging.info("[MOCK WhatsApp] %s", payload)
    await record_integration_event(user_id, "whatsapp", "mocked", payload)
    return {"success": True, "status": "mocked", "message": "WhatsApp simulated", "message_preview": message}

def build_whatsapp_payload(user_data: dict, score: int, level: int) -> dict:
    """Construye el payload para WhatsApp Cloud API en modo texto o plantilla."""
    if WHATSAPP_MESSAGE_TYPE == "template":
        if not WHATSAPP_TEMPLATE_NAME:
            raise ValueError("WHATSAPP_TEMPLATE_NAME is required when WHATSAPP_MESSAGE_TYPE=template")
        return {
            "messaging_product": "whatsapp",
            "to": WHATSAPP_ADMIN_PHONE,
            "type": "template",
            "template": {
                "name": WHATSAPP_TEMPLATE_NAME,
                "language": {"code": WHATSAPP_TEMPLATE_LANGUAGE},
                "components": [
                    {
                        "type": "body",
                        "parameters": [
                            {"type": "text", "text": user_data["name"]},
                            {"type": "text", "text": user_data["email"]},
                            {"type": "text", "text": user_data["phone"]},
                            {"type": "text", "text": get_level_name(level)},
                            {"type": "text", "text": str(level)},
                            {"type": "text", "text": str(score)},
                        ],
                    }
                ],
            },
        }

    return {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": WHATSAPP_ADMIN_PHONE,
        "type": "text",
        "text": {
            "preview_url": False,
            "body": build_whatsapp_message(user_data, score, level),
        },
    }

def post_whatsapp_payload(payload: dict) -> dict:
    """Envía el request HTTP a Meta usando librería estándar para no agregar dependencias."""
    endpoint = f"https://graph.facebook.com/{WHATSAPP_GRAPH_VERSION}/{WHATSAPP_PHONE_NUMBER_ID}/messages"
    request = urllib.request.Request(
        endpoint,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {WHATSAPP_ACCESS_TOKEN}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=12) as response:
            return {
                "ok": True,
                "status_code": response.status,
                "body": json.loads(response.read().decode("utf-8")),
            }
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8")
        return {
            "ok": False,
            "status_code": error.code,
            "body": json.loads(body) if body else {"error": "Empty response"},
        }
    except urllib.error.URLError as error:
        return {"ok": False, "status_code": None, "body": {"error": str(error.reason)}}

async def send_whatsapp_notification(user_id: str, user_data: dict, score: int, level: int):
    """Manda WhatsApp real si hay credenciales; si no, deja el evento como simulado."""
    if not all([WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ADMIN_PHONE]):
        return await mock_whatsapp_notification(user_id, user_data, score, level)

    try:
        payload = build_whatsapp_payload(user_data, score, level)
        meta_response = await asyncio.to_thread(post_whatsapp_payload, payload)
        status = "sent" if meta_response["ok"] else "failed"
        event_payload = {
            "to": WHATSAPP_ADMIN_PHONE,
            "message_type": WHATSAPP_MESSAGE_TYPE,
            "message_preview": build_whatsapp_message(user_data, score, level),
            "meta_response": meta_response,
        }
        await record_integration_event(user_id, "whatsapp", status, event_payload)

        if not meta_response["ok"]:
            logger.error("[WhatsApp] Meta rejected message: %s", meta_response)
            return {"success": False, "status": status, "message": "WhatsApp failed", "meta_response": meta_response}

        return {"success": True, "status": status, "message": "WhatsApp sent", "meta_response": meta_response}
    except Exception as error:
        event_payload = {
            "to": WHATSAPP_ADMIN_PHONE,
            "message_type": WHATSAPP_MESSAGE_TYPE,
            "message_preview": build_whatsapp_message(user_data, score, level),
            "error": str(error),
        }
        await record_integration_event(user_id, "whatsapp", "failed", event_payload)
        logger.exception("[WhatsApp] Unexpected error sending message")
        return {"success": False, "status": "failed", "message": str(error)}

# ============ ROUTES ============

@api_router.get("/")
async def root():
    return {"message": "Fiscal & Innovation Assessment API"}

# Capture user info (before questions - saves as abandoned)
@api_router.post("/assessment/capture")
async def capture_user_info(data: UserCapture):
    normalized_email = normalize_email(data.email)
    normalized_phone = normalize_phone(data.phone)

    # Check if user with this email already exists and is abandoned
    existing = await db.users.find_one({"email": normalized_email, "status": "abandoned"}, {"_id": 0})
    
    if existing:
        # Update existing abandoned record
        await db.users.update_one(
            {"email": normalized_email, "status": "abandoned"},
            {"$set": {"name": data.name.strip(), "phone": normalized_phone, "created_at": datetime.now(timezone.utc).isoformat()}}
        )
        return {"success": True, "user_id": existing["id"], "message": "User info updated"}
    
    # Create new user record with abandoned status
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "name": data.name.strip(),
        "email": normalized_email,
        "phone": normalized_phone,
        "score": None,
        "level": None,
        "status": "abandoned",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    return {"success": True, "user_id": user_id, "message": "User info captured"}

# Assessment submission (completes the assessment)
@api_router.post("/assessment/submit")
async def submit_assessment(data: AssessmentSubmit):
    # Get user record
    user = await db.users.find_one({"id": data.user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found. Please start assessment again.")

    question_map = get_question_map()
    expected_questions = set(question_map.keys())
    received_questions = {response.question_id for response in data.responses}

    if received_questions != expected_questions:
        raise HTTPException(status_code=400, detail="Assessment responses are incomplete or invalid.")

    stored_responses = []
    total_score = 0
    for response in data.responses:
        question = question_map.get(response.question_id)
        if question is None:
            raise HTTPException(status_code=400, detail=f"Invalid question id: {response.question_id}")

        option = question["options_by_id"].get(response.option_id.upper())
        if option is None:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid option id '{response.option_id}' for question {response.question_id}"
            )

        option_score = get_option_score(response.option_id)
        total_score += option_score
        stored_responses.append({
            "id": str(uuid.uuid4()),
            "user_id": data.user_id,
            "question_id": question["id"],
            "question": question["question"],
            "answer": option["label"],
            "option_id": option["id"],
            "score": option_score
        })

    level = calculate_level(total_score)
    
    # Update user with score, level, and completed status
    await db.users.update_one(
        {"id": data.user_id},
        {"$set": {
            "score": total_score,
            "level": level,
            "status": "completed"
        }}
    )
    
    # Store responses
    for response_doc in stored_responses:
        await db.responses.insert_one(response_doc)
    
    # Integraciones simuladas: dejan evidencia en Mongo y después se reemplazan por APIs reales.
    user_integration_data = {"name": user["name"], "email": user["email"], "phone": user["phone"]}
    ac_result = await mock_active_campaign(data.user_id, user_integration_data, level)
    wa_result = await send_whatsapp_notification(data.user_id, user_integration_data, total_score, level)
    
    return {
        "success": True,
        "user_id": data.user_id,
        "score": total_score,
        "level": level,
        "name": user["name"],
        "integrations": {
            "active_campaign": ac_result,
            "whatsapp": wa_result
        }
    }

@api_router.post("/admin/login", response_model=AdminToken)
async def login_admin(data: AdminLogin, request: Request):
    normalized_email = normalize_email(data.email)
    password = data.password.strip()
    identifier = get_client_identifier(request, normalized_email)

    if is_rate_limited(identifier):
        raise HTTPException(status_code=429, detail="Too many login attempts. Try again later.")

    admin = await db.admins.find_one({"email": normalized_email}, {"_id": 0})
    if not admin or not verify_password(password, admin["password"]):
        register_failed_attempt(identifier)
        raise HTTPException(status_code=401, detail="Invalid credentials")

    clear_failed_attempts(identifier)
    token = create_token(normalized_email)
    return AdminToken(access_token=token)

@api_router.get("/admin/me")
async def get_admin_profile(admin = Depends(get_current_admin)):
    return {"email": admin["email"], "name": admin["name"]}

# User management (protected)
@api_router.get("/admin/users")
async def get_users(
    level: Optional[int] = None,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    admin = Depends(get_current_admin)
):
    query = {}
    if level is not None:
        query["level"] = level
    if status_filter is not None:
        query["status"] = status_filter
    
    users = await db.users.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    # Filter by search if provided
    if search:
        search_lower = search.lower()
        users = [u for u in users if search_lower in u["name"].lower() or search_lower in u["email"].lower()]
    
    return users

@api_router.get("/admin/users/{user_id}")
async def get_user_detail(user_id: str, admin = Depends(get_current_admin)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    responses = await db.responses.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    integration_events = await db.integration_events.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(20)
    
    return {"user": user, "responses": responses, "integration_events": integration_events}

@api_router.get("/admin/export")
async def export_users_csv(
    level: Optional[int] = None,
    status_filter: Optional[str] = None,
    admin = Depends(get_current_admin)
):
    query = {}
    if level is not None:
        query["level"] = level
    if status_filter is not None:
        query["status"] = status_filter
    
    users = await db.users.find(query, {"_id": 0}).sort("created_at", -1).to_list(10000)
    
    # El CSV no soporta estilos; para Excel con formato usamos el frontend y este endpoint queda como respaldo.
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Nombre", "Correo", "Teléfono", "Puntuación", "Nivel", "Resultado", "Estado", "Fecha"])
    for user in users:
        score = user.get('score') if user.get('score') is not None else 'N/A'
        level_val = user.get('level') if user.get('level') is not None else 'N/A'
        level_name = get_level_name(user["level"]) if user.get("level") else "N/A"
        status_val = user.get('status', 'unknown')
        writer.writerow([user["name"], user["email"], user["phone"], score, level_val, level_name, status_val, user["created_at"]])
    
    return {"csv": output.getvalue(), "count": len(users)}

# Questions endpoint
@api_router.get("/questions")
async def get_questions():
    """Return configured assessment questions."""
    return ASSESSMENT_CONFIG["questions"]

@api_router.get("/health")
async def health_check():
    return {"status": "ok"}

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Cache-Control"] = "no-store" if request.url.path.startswith("/api/admin") else response.headers.get("Cache-Control", "no-store")
    return response

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_checks():
    ensure_secure_settings()
    await db.admins.create_index("email", unique=True)
    await db.users.create_index([("email", 1), ("status", 1)])
    await db.responses.create_index("user_id")
    await db.integration_events.create_index([("user_id", 1), ("created_at", -1)])

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
