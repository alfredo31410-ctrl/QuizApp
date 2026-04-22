from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
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
    """Calculate level based on configured score thresholds."""
    for level in ASSESSMENT_CONFIG["levels"]:
        if level["min_score"] <= score <= level["max_score"]:
            return level["id"]
    raise HTTPException(status_code=400, detail="Score is outside configured ranges")

def get_question_map() -> dict:
    return {
        question["id"]: {
            **question,
            "options_by_id": {option["id"]: option for option in question["options"]},
        }
        for question in ASSESSMENT_CONFIG["questions"]
    }

def get_option_score(option_id: str) -> int:
    score = ASSESSMENT_CONFIG["score_system"].get(option_id.upper())
    if score is None:
        raise HTTPException(status_code=400, detail=f"Invalid option id: {option_id}")
    return score

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

async def mock_active_campaign(user_data: dict, level: int):
    """Mock ActiveCampaign integration - simulates API call"""
    tag = "low_level" if level <= 2 else "high_level"
    logging.info(f"[MOCK ActiveCampaign] Sending user data: {user_data['name']}, {user_data['email']}, Level: {level}, Tag: {tag}")
    return {"success": True, "tag": tag, "message": "User added to ActiveCampaign (MOCKED)"}

async def mock_whatsapp_notification(user_data: dict, score: int, level: int):
    """Mock WhatsApp notification to admin"""
    message = f"New assessment submission:\nName: {user_data['name']}\nLevel: {level}\nScore: {score}"
    logging.info(f"[MOCK WhatsApp] Admin notification: {message}")
    return {"success": True, "message": "WhatsApp notification sent (MOCKED)"}

# ============ ROUTES ============

@api_router.get("/")
async def root():
    return {"message": "Fiscal & Innovation Assessment API"}

# Capture user info (before questions - saves as abandoned)
@api_router.post("/assessment/capture")
async def capture_user_info(data: UserCapture):
    # Check if user with this email already exists and is abandoned
    existing = await db.users.find_one({"email": data.email, "status": "abandoned"}, {"_id": 0})
    
    if existing:
        # Update existing abandoned record
        await db.users.update_one(
            {"email": data.email, "status": "abandoned"},
            {"$set": {"name": data.name, "phone": data.phone, "created_at": datetime.now(timezone.utc).isoformat()}}
        )
        return {"success": True, "user_id": existing["id"], "message": "User info updated"}
    
    # Create new user record with abandoned status
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "name": data.name,
        "email": data.email,
        "phone": data.phone,
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
    
    # Mock integrations
    ac_result = await mock_active_campaign({"name": user["name"], "email": user["email"], "phone": user["phone"]}, level)
    wa_result = await mock_whatsapp_notification({"name": user["name"]}, total_score, level)
    
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
async def login_admin(data: AdminLogin):
    normalized_email = data.email.strip().lower()
    password = data.password.strip()
    admin = await db.admins.find_one({"email": normalized_email}, {"_id": 0})
    if not admin or not verify_password(password, admin["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
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
    
    return {"user": user, "responses": responses}

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
    
    # Generate CSV content
    csv_lines = ["Name,Email,Phone,Score,Level,Status,Date"]
    for user in users:
        score = user.get('score') if user.get('score') is not None else 'N/A'
        level_val = user.get('level') if user.get('level') is not None else 'N/A'
        status_val = user.get('status', 'unknown')
        csv_lines.append(f"{user['name']},{user['email']},{user['phone']},{score},{level_val},{status_val},{user['created_at']}")
    
    return {"csv": "\n".join(csv_lines), "count": len(users)}

# Questions endpoint
@api_router.get("/questions")
async def get_questions():
    """Return configured assessment questions."""
    return ASSESSMENT_CONFIG["questions"]

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_checks():
    ensure_secure_settings()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
