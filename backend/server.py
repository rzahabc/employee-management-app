from fastapi import FastAPI, APIRouter, HTTPException, Query, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
import hashlib
import base64


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'employees_db')]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Helper function to hash password
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

# ========================= MODELS =========================

# User Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    password: str
    role: str  # 'admin', 'manager', 'user'
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    username: str
    password: str
    role: str = 'user'

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    role: str
    created_at: datetime

# Employee Models
class Employee(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    rank: str
    seniority: str
    phone: str
    assigned_work: str
    sector: str
    photo: Optional[str] = None  # Base64 encoded image
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class EmployeeCreate(BaseModel):
    name: str
    rank: str
    seniority: str
    phone: str
    assigned_work: str
    sector: str
    photo: Optional[str] = None

class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    rank: Optional[str] = None
    seniority: Optional[str] = None
    phone: Optional[str] = None
    assigned_work: Optional[str] = None
    sector: Optional[str] = None
    photo: Optional[str] = None

# Sector Models
class Sector(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SectorCreate(BaseModel):
    name: str

# Settings Models
class Settings(BaseModel):
    id: str = "app_settings"
    header_text: str = "منطقة شرق الدلتا"
    footer_text: str = "تصميم مقدم د. / رامي ابو الذهب"
    logo: Optional[str] = None  # Base64 encoded image

class SettingsUpdate(BaseModel):
    header_text: Optional[str] = None
    footer_text: Optional[str] = None
    logo: Optional[str] = None

# ========================= INITIALIZATION =========================

@app.on_event("startup")
async def startup_event():
    # Check if default admin exists
    admin = await db.users.find_one({"username": "zahab"})
    if not admin:
        default_admin = User(
            username="zahab",
            password=hash_password("9999"),
            role="admin"
        )
        await db.users.insert_one(default_admin.dict())
        logging.info("Default admin user created")
    
    # Check if settings exist
    settings = await db.settings.find_one({"id": "app_settings"})
    if not settings:
        default_settings = Settings()
        await db.settings.insert_one(default_settings.dict())
        logging.info("Default settings created")
    
    # Add default sectors if none exist
    sectors_count = await db.sectors.count_documents({})
    if sectors_count == 0:
        default_sectors = ["القطاع الأول", "القطاع الثاني", "القطاع الثالث"]
        for sector_name in default_sectors:
            sector = Sector(name=sector_name)
            await db.sectors.insert_one(sector.dict())
        logging.info("Default sectors created")

# ========================= AUTH ROUTES =========================

@api_router.post("/auth/login")
async def login(user_data: UserLogin):
    user = await db.users.find_one({"username": user_data.username})
    if not user:
        raise HTTPException(status_code=401, detail="اسم المستخدم غير صحيح")
    
    if user["password"] != hash_password(user_data.password):
        raise HTTPException(status_code=401, detail="كلمة المرور غير صحيحة")
    
    return {
        "id": user["id"],
        "username": user["username"],
        "role": user["role"]
    }

@api_router.post("/auth/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    # Check if username exists
    existing = await db.users.find_one({"username": user_data.username})
    if existing:
        raise HTTPException(status_code=400, detail="اسم المستخدم موجود بالفعل")
    
    new_user = User(
        username=user_data.username,
        password=hash_password(user_data.password),
        role=user_data.role
    )
    await db.users.insert_one(new_user.dict())
    
    return UserResponse(
        id=new_user.id,
        username=new_user.username,
        role=new_user.role,
        created_at=new_user.created_at
    )

@api_router.get("/users", response_model=List[UserResponse])
async def get_users():
    users = await db.users.find().to_list(1000)
    return [UserResponse(
        id=u["id"],
        username=u["username"],
        role=u["role"],
        created_at=u["created_at"]
    ) for u in users]

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str):
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    return {"message": "تم حذف المستخدم بنجاح"}

@api_router.put("/users/{user_id}/role")
async def update_user_role(user_id: str, role: str):
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"role": role}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    return {"message": "تم تحديث الصلاحية بنجاح"}

# ========================= EMPLOYEE ROUTES =========================

@api_router.post("/employees", response_model=Employee)
async def create_employee(employee: EmployeeCreate):
    new_employee = Employee(**employee.dict())
    await db.employees.insert_one(new_employee.dict())
    return new_employee

@api_router.get("/employees", response_model=List[Employee])
async def get_employees(
    search: Optional[str] = Query(None),
    sector: Optional[str] = Query(None),
    seniority: Optional[str] = Query(None),
    assigned_work: Optional[str] = Query(None)
):
    query = {}
    
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    if sector:
        query["sector"] = sector
    if seniority:
        query["seniority"] = seniority
    if assigned_work:
        query["assigned_work"] = {"$regex": assigned_work, "$options": "i"}
    
    employees = await db.employees.find(query).to_list(1000)
    return [Employee(**emp) for emp in employees]

@api_router.get("/employees/{employee_id}", response_model=Employee)
async def get_employee(employee_id: str):
    employee = await db.employees.find_one({"id": employee_id})
    if not employee:
        raise HTTPException(status_code=404, detail="الموظف غير موجود")
    return Employee(**employee)

@api_router.put("/employees/{employee_id}", response_model=Employee)
async def update_employee(employee_id: str, employee_update: EmployeeUpdate):
    update_data = {k: v for k, v in employee_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    result = await db.employees.update_one(
        {"id": employee_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="الموظف غير موجود")
    
    updated = await db.employees.find_one({"id": employee_id})
    return Employee(**updated)

@api_router.delete("/employees/{employee_id}")
async def delete_employee(employee_id: str):
    result = await db.employees.delete_one({"id": employee_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="الموظف غير موجود")
    return {"message": "تم حذف الموظف بنجاح"}

# ========================= SECTOR ROUTES =========================

@api_router.post("/sectors", response_model=Sector)
async def create_sector(sector: SectorCreate):
    new_sector = Sector(name=sector.name)
    await db.sectors.insert_one(new_sector.dict())
    return new_sector

@api_router.get("/sectors", response_model=List[Sector])
async def get_sectors():
    sectors = await db.sectors.find().to_list(100)
    return [Sector(**s) for s in sectors]

@api_router.put("/sectors/{sector_id}")
async def update_sector(sector_id: str, sector: SectorCreate):
    result = await db.sectors.update_one(
        {"id": sector_id},
        {"$set": {"name": sector.name}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="القطاع غير موجود")
    return {"message": "تم تحديث القطاع بنجاح"}

@api_router.delete("/sectors/{sector_id}")
async def delete_sector(sector_id: str):
    result = await db.sectors.delete_one({"id": sector_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="القطاع غير موجود")
    return {"message": "تم حذف القطاع بنجاح"}

# ========================= SETTINGS ROUTES =========================

@api_router.get("/settings", response_model=Settings)
async def get_settings():
    settings = await db.settings.find_one({"id": "app_settings"})
    if not settings:
        default_settings = Settings()
        await db.settings.insert_one(default_settings.dict())
        return default_settings
    return Settings(**settings)

@api_router.put("/settings", response_model=Settings)
async def update_settings(settings_update: SettingsUpdate):
    update_data = {k: v for k, v in settings_update.dict().items() if v is not None}
    
    await db.settings.update_one(
        {"id": "app_settings"},
        {"$set": update_data},
        upsert=True
    )
    
    updated = await db.settings.find_one({"id": "app_settings"})
    return Settings(**updated)

# ========================= HEALTH CHECK =========================

@api_router.get("/")
async def root():
    return {"message": "Employee Management API", "status": "running"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
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
