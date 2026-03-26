from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

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
    question: str
    answer: str
    score: int

class AssessmentSubmit(BaseModel):
    user: UserCreate
    responses: List[ResponseItem]

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    phone: str
    score: int
    level: int
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
    """Calculate level based on score thresholds"""
    if score <= 14:
        return 1
    elif score <= 18:
        return 2
    elif score <= 22:
        return 3
    elif score <= 26:
        return 4
    else:
        return 5

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(email: str) -> str:
    expiration = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {"sub": email, "exp": expiration}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

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

# Assessment submission
@api_router.post("/assessment/submit")
async def submit_assessment(data: AssessmentSubmit):
    # Calculate total score
    total_score = sum(r.score for r in data.responses)
    level = calculate_level(total_score)
    
    # Create user record
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "name": data.user.name,
        "email": data.user.email,
        "phone": data.user.phone,
        "score": total_score,
        "level": level,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Store user
    await db.users.insert_one(user_doc)
    
    # Store responses
    for response in data.responses:
        response_doc = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "question": response.question,
            "answer": response.answer,
            "score": response.score
        }
        await db.responses.insert_one(response_doc)
    
    # Mock integrations
    ac_result = await mock_active_campaign({"name": data.user.name, "email": data.user.email, "phone": data.user.phone}, level)
    wa_result = await mock_whatsapp_notification({"name": data.user.name}, total_score, level)
    
    return {
        "success": True,
        "user_id": user_id,
        "score": total_score,
        "level": level,
        "integrations": {
            "active_campaign": ac_result,
            "whatsapp": wa_result
        }
    }

# Admin authentication
@api_router.post("/admin/register", response_model=AdminToken)
async def register_admin(data: AdminCreate):
    # Check if admin exists
    existing = await db.admins.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Admin already exists")
    
    # Create admin
    admin_doc = {
        "id": str(uuid.uuid4()),
        "email": data.email,
        "password": hash_password(data.password),
        "name": data.name,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.admins.insert_one(admin_doc)
    
    token = create_token(data.email)
    return AdminToken(access_token=token)

@api_router.post("/admin/login", response_model=AdminToken)
async def login_admin(data: AdminLogin):
    admin = await db.admins.find_one({"email": data.email}, {"_id": 0})
    if not admin or not verify_password(data.password, admin["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(data.email)
    return AdminToken(access_token=token)

@api_router.get("/admin/me")
async def get_admin_profile(admin = Depends(get_current_admin)):
    return {"email": admin["email"], "name": admin["name"]}

# User management (protected)
@api_router.get("/admin/users")
async def get_users(
    level: Optional[int] = None,
    search: Optional[str] = None,
    admin = Depends(get_current_admin)
):
    query = {}
    if level is not None:
        query["level"] = level
    
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
    admin = Depends(get_current_admin)
):
    query = {}
    if level is not None:
        query["level"] = level
    
    users = await db.users.find(query, {"_id": 0}).sort("created_at", -1).to_list(10000)
    
    # Generate CSV content
    csv_lines = ["Name,Email,Phone,Score,Level,Date"]
    for user in users:
        csv_lines.append(f"{user['name']},{user['email']},{user['phone']},{user['score']},{user['level']},{user['created_at']}")
    
    return {"csv": "\n".join(csv_lines), "count": len(users)}

# Questions endpoint
@api_router.get("/questions")
async def get_questions():
    """Return assessment questions"""
    questions = [
        {
            "id": 1,
            "category": "Fiscal Studies",
            "question": "How would you describe your understanding of tax deductions and credits?",
            "options": [
                {"label": "I have basic knowledge of common deductions", "score": 1},
                {"label": "I understand various deduction categories and can optimize them", "score": 2},
                {"label": "I have expert knowledge of complex tax strategies and credits", "score": 3}
            ]
        },
        {
            "id": 2,
            "category": "Fiscal Studies",
            "question": "How do you approach financial compliance and reporting?",
            "options": [
                {"label": "I rely on basic compliance checklists", "score": 1},
                {"label": "I actively monitor regulatory changes and adapt processes", "score": 2},
                {"label": "I implement proactive compliance frameworks and audits", "score": 3}
            ]
        },
        {
            "id": 3,
            "category": "Fiscal Studies",
            "question": "What is your experience with international tax regulations?",
            "options": [
                {"label": "Limited to domestic operations", "score": 1},
                {"label": "Familiar with basic cross-border tax implications", "score": 2},
                {"label": "Expert in transfer pricing and international tax planning", "score": 3}
            ]
        },
        {
            "id": 4,
            "category": "Innovation",
            "question": "How does your organization approach digital transformation?",
            "options": [
                {"label": "We have basic digital tools in place", "score": 1},
                {"label": "We actively implement automation and digital workflows", "score": 2},
                {"label": "We lead with AI-driven processes and continuous innovation", "score": 3}
            ]
        },
        {
            "id": 5,
            "category": "Innovation",
            "question": "How do you incorporate R&D into your business strategy?",
            "options": [
                {"label": "Limited R&D activities focused on maintenance", "score": 1},
                {"label": "Dedicated R&D budget with periodic innovation projects", "score": 2},
                {"label": "Strategic R&D integrated with business objectives", "score": 3}
            ]
        },
        {
            "id": 6,
            "category": "Innovation",
            "question": "What is your approach to adopting emerging technologies?",
            "options": [
                {"label": "We wait for technologies to mature before adopting", "score": 1},
                {"label": "We pilot new technologies selectively", "score": 2},
                {"label": "We actively seek and implement cutting-edge solutions", "score": 3}
            ]
        },
        {
            "id": 7,
            "category": "Accounting",
            "question": "How would you rate your financial forecasting capabilities?",
            "options": [
                {"label": "Basic budgeting with historical data", "score": 1},
                {"label": "Rolling forecasts with scenario analysis", "score": 2},
                {"label": "Advanced predictive analytics and modeling", "score": 3}
            ]
        },
        {
            "id": 8,
            "category": "Accounting",
            "question": "What accounting standards does your organization follow?",
            "options": [
                {"label": "Basic GAAP compliance", "score": 1},
                {"label": "Full GAAP with some IFRS knowledge", "score": 2},
                {"label": "Multi-standard compliance with advanced reporting", "score": 3}
            ]
        },
        {
            "id": 9,
            "category": "Accounting",
            "question": "How sophisticated is your cost accounting system?",
            "options": [
                {"label": "Basic cost tracking and allocation", "score": 1},
                {"label": "Activity-based costing with regular analysis", "score": 2},
                {"label": "Advanced cost modeling with profitability analytics", "score": 3}
            ]
        },
        {
            "id": 10,
            "category": "Accounting",
            "question": "How do you manage financial controls and risk?",
            "options": [
                {"label": "Standard internal controls and periodic reviews", "score": 1},
                {"label": "Comprehensive risk framework with regular assessments", "score": 2},
                {"label": "Enterprise risk management with real-time monitoring", "score": 3}
            ]
        }
    ]
    return questions

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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
