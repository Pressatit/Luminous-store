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
            detail="Invalid credentials"
        )

    if user.role == "cashier":
       device = db.query(models.Device).filter(models.Device.device_token == payload.token).first()
    
       if not device:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unrecognized device. Please ask an admin to register and activate this device."
        )
        
       if device.store_id != user.store_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is registered to another branch. Access denied."
        )
        
       if not device.is_Active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This device is not activated. Please contact your manager."
        )
    
    accessToken=security.createAccessToken(data={"sub":str(user.id),"role":user.role,"store_id":user.store_id})

    store = db.query(models.Store).filter(models.Store.id == user.store_id).first()

    return {
        "access_token":accessToken,
        "token_type":"bearer",
        "user":{
            "id":user.id,
            "name":user.name,
            "storeId":user.store_id,
            "email":user.email,
            "role":user.role,
            "storeName":store.store_name,
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

     store = db.query(models.Store).filter(models.Store.id == new_user.store_id).first()

     db.refresh(new_user)

     accessToken=security.createAccessToken(data={"sub":str(new_user.id),"role":new_user.role,"store_id":new_user.store_id,})

     

     return {
         "access_token":accessToken,
         "token_type":"bearer",
         "user":new_user,
         "store_name":store.store_name
             
         }
    


