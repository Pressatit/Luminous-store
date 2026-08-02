from fastapi import APIRouter,Depends,HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models,schemas
import security
import bcrypt



router=APIRouter(tags=["Auth"])

@router.post("/signin")
def signIn(payload:schemas.Signinrequest,db:Session=Depends(get_db)):
    user=db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not security.verifyPassword(payload.password,user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    accessToken=security.createAccessToken(data={"sub":str(user.id),"role":user.role,"store_id":user.store_id})

    return {
        "access_token":accessToken,
        "token_type":"bearer",
        "user":{
            "userId":user.id,
            "userName":user.name,
            "storeId":user.store_id,
            "userEmail":user.email,
            "userRole":user.role
        }
    }


@router.post("/signup")
def signUp(payload:schemas.Signuprequest,db:Session = Depends(get_db)):
     existingUser=db.query(models.User).filter(models.User.email == payload.email).first()

     if existingUser:
         raise HTTPException(
             status_code=status.HTTP_400_BAD_REQUEST,
             detail="Email already exists"
         )

     #Create new user
     hashedPassword=security.hashPassword(payload.password)

     new_user=models.User(
         name=payload.name,
         email=payload.email,
         role=payload.role,
         hashed_password=hashedPassword,
         store_id=payload.storeId
     )
     db.add(new_user)

     db.commit()
     db.refresh(new_user)

     return new_user


