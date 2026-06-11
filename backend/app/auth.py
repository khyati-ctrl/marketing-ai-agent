import bcrypt
from datetime import datetime, timedelta
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.database import SessionLocal
from app.models import User

# 1. New direct Blender tool
def get_password_hash(password: str) -> str:
    # Convert text to bytes, blend it with a random salt, and return as text
    salt = bcrypt.gensalt()
    hashed_bytes = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed_bytes.decode('utf-8')

# 2. New direct Checking tool
def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Compare the newly typed password against the saved hash
    return bcrypt.checkpw(
        plain_password.encode('utf-8'), 
        hashed_password.encode('utf-8')
    )

# 3. Hotel Keycard (JWT)
SECRET_KEY = "my_super_secret_marketing_key" 
ALGORITHM = "HS256"

def create_access_token(data: dict):
    to_encode = data.copy()
    
    # Set the keycard to expire in 24 hours
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    
    # Create and sign the token using our secret key
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# 4. The Bouncer (Security Guard)
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    db = SessionLocal()
    try:
        # 1. Grab the token from the header
        token = credentials.credentials
        
        # 2. Decode the token to find the user ID inside
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid credentials")
            
        # 3. Find the exact user in the database
        user = db.query(User).filter(User.id == int(user_id)).first()
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
            
        return user # Hand the confirmed user over to the endpoint
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired. Please log in again.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token.")
    finally:
        db.close()