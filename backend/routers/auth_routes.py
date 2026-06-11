from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.database import SessionLocal
from app.models import User
from app.auth import get_password_hash, verify_password, create_access_token

# 1. Initialize the Router
router = APIRouter(
    prefix="/api",
    tags=["Authentication"]
)

# 2. Pydantic Schemas for Auth
class UserCreate(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

# 3. Create User Endpoint
@router.post("/signup")
def create_user(user: UserCreate):
    db = SessionLocal()
    try:
        existing_user = db.query(User).filter(User.email == user.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        hashed_pw = get_password_hash(user.password)

        new_user = User(email=user.email, hashed_password=hashed_pw)
        db.add(new_user)
        db.commit()
        
        return {"status": "success", "message": "Account created successfully!"}
    finally:
        db.close()

# 4. Login User Endpoint
@router.post("/login")
def login_user(user: UserLogin):
    db = SessionLocal()
    try:
        db_user = db.query(User).filter(User.email == user.email).first()
        
        if not db_user or not verify_password(user.password, db_user.hashed_password):
            raise HTTPException(status_code=400, detail="Incorrect email or password")
            
        access_token = create_access_token(data={"sub": str(db_user.id)})
        
        return {
            "status": "success",
            "access_token": access_token, 
            "token_type": "bearer"
        }
    finally:
        db.close()