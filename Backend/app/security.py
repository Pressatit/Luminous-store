import jwt
from datetime import datetime,timedelta,timezone
from passlib.context import CryptContext
import os
from fastapi.security import OAuth2PasswordBearer
from fastapi import HTTPException,Depends,status
import security
from sqlalchemy.orm import Session
from database import get_db
import models


from dotenv import load_dotenv
load_dotenv()

SECRET_KEY=os.getenv("SECRET_KEY")
ALGORITHM=os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 hours

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")
pwd_context=CryptContext(schemes=["bcrypt"],deprecated="auto")

def hashPassword(password:str)->str:
    return pwd_context.hash(password)

def verifyPassword(plain_password:str ,hashed_password:str) -> bool:
    return pwd_context.verify(plain_password,hashed_password)

def createAccessToken(data:dict)-> str :
    to_encode=data.copy()
    expire=datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp":expire})
    return jwt.encode(to_encode,SECRET_KEY,algorithm=ALGORITHM)

def getCurrentUser(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decode the JWT token
        payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    # Fetch user from local PostgreSQL instance
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise credentials_exception
        
    return user