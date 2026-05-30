# app/routers/auth.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta
import logging
import bcrypt
from jose import jwt
from fastapi.security import OAuth2PasswordBearer
from app.core.config import settings
from app.services.supabase_service import supabase_service

logger = logging.getLogger("sellora.auth")

router = APIRouter()

# JWT configuration
SECRET_KEY = settings.JWT_SECRET or "super_secret_key_for_sellora_intelligence"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day

# OAuth2 Token Scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    name: str
    plan: str
    preferred_language: str
    created_at: str

class ProfileUpdate(BaseModel):
    firstName: str
    lastName: str
    preferred_language: Optional[str] = None

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception as e:
        logger.error(f"Password verification error: {e}")
        return False

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Dependency to extract logged-in user
async def get_current_user(token: str = Depends(oauth2_scheme)):
    if not token:
        raise HTTPException(status_code=401, detail="Authentication token required.")
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication token.")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid authentication token.")
    
    try:
        client = supabase_service.get_client()
        res = client.table("users").select("*").eq("id", user_id).execute()
        if not res.data:
            raise HTTPException(status_code=401, detail="User account not found.")
        return res.data[0]
    except Exception as e:
        logger.error(f"Error fetching current user: {e}")
        raise HTTPException(status_code=500, detail="Database diagnostic failure.")

@router.post("/register", response_model=UserResponse)
async def register(user: UserRegister):
    try:
        client = supabase_service.get_client()
        
        # Check if email is already registered
        existing = client.table("users").select("id").eq("email", user.email).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Email is already registered.")
        
        hashed_pw = get_password_hash(user.password)
        
        # Insert user
        res = client.table("users").insert({
            "email": user.email,
            "password_hash": hashed_pw,
            "name": user.name,
            "plan": "free",
            "preferred_language": "en"
        }).execute()
        
        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to create user account.")
        
        created = res.data[0]
        return {
            "id": created["id"],
            "email": created["email"],
            "name": created.get("name", "Test Seller"),
            "plan": created.get("plan", "free"),
            "preferred_language": created.get("preferred_language", "en"),
            "created_at": created.get("created_at", datetime.utcnow().isoformat())
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Signup error: {e}")
        raise HTTPException(status_code=500, detail=f"Database signup failure: {e}")

@router.post("/login")
async def login(credentials: UserLogin):
    try:
        client = supabase_service.get_client()
        
        # Query user by email
        res = client.table("users").select("*").eq("email", credentials.email).execute()
        if not res.data:
            raise HTTPException(status_code=400, detail="Invalid email or password.")
        
        user_record = res.data[0]
        if not verify_password(credentials.password, user_record["password_hash"]):
            raise HTTPException(status_code=400, detail="Invalid email or password.")
        
        # Generate JWT access token
        access_token = create_access_token(data={"sub": user_record["id"], "email": user_record["email"]})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user_record["id"],
                "email": user_record["email"],
                "name": user_record.get("name", "Test Seller"),
                "plan": user_record.get("plan", "free"),
                "preferred_language": user_record.get("preferred_language", "en")
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail=f"Database login failure: {e}")

@router.get("/profile", response_model=UserResponse)
async def get_profile(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "name": current_user.get("name", "Test Seller"),
        "plan": current_user.get("plan", "free"),
        "preferred_language": current_user.get("preferred_language", "en"),
        "created_at": current_user.get("created_at", datetime.utcnow().isoformat())
    }

@router.put("/profile", response_model=UserResponse)
async def update_profile(profile: ProfileUpdate, current_user: dict = Depends(get_current_user)):
    try:
        client = supabase_service.get_client()
        full_name = f"{profile.firstName} {profile.lastName}".strip()
        
        update_data = {"name": full_name}
        if profile.preferred_language:
            update_data["preferred_language"] = profile.preferred_language
            
        res = client.table("users").update(update_data).eq("id", current_user["id"]).execute()
        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to update profile details.")
            
        updated = res.data[0]
        return {
            "id": updated["id"],
            "email": updated["email"],
            "name": updated.get("name", "Test Seller"),
            "plan": updated.get("plan", "free"),
            "preferred_language": updated.get("preferred_language", "en"),
            "created_at": updated.get("created_at", datetime.utcnow().isoformat())
        }
    except Exception as e:
        logger.error(f"Profile update error: {e}")
        raise HTTPException(status_code=500, detail=f"Database update failure: {e}")

