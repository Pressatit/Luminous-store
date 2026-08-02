from fastapi import APIRouter,Depends,HTTPException,status
from sqlalchemy.orm import Session
import models,schemas
from database import get_db
from security import getCurrentUser
from typing import List


router=APIRouter(prefix='/users',tags=["Users"])

#Get current user
@router.get("/me")
def getCurrentUser(currentUser:models.User = Depends(getCurrentUser)):

    return {
        "id": str(currentUser.id),
        "name": currentUser.name,
        "email": currentUser.email,
        "role": currentUser.role,
        "store_id": currentUser.store_id
    }

#Get all users
@router.get("/all",response_model=List[schemas.Showuser])
def getAllUsers(db:Session = Depends(get_db)):
    users=db.query(models.User).all()

    return users

#Get user by id
@router.get("/{id}",response_model=schemas.Showuser)
def getUserbyId(id:str,db:Session = Depends(get_db)):
    user=db.query(models.User).filter(models.User.id==id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User {id} does not exist"
        )

    return user





