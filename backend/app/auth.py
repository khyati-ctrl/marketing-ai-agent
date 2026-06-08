import bcrypt
from datetime import datetime, timedelta
import jwt

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

# 3. Hotel Keycard (JWT) - unchanged!
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