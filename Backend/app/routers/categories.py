from fastapi import APIRouter,Depends,HTTPException,status
import schemas,models
from sqlalchemy.orm import Session
from database import get_db
from typing import List


router=APIRouter(tags=['Categories'])

@router.post("/category")
def createCategory (payload:schemas.Createcategory,db:Session=Depends(get_db)):

    existingcategory=db.query(models.Category).filter(models.Category.name==payload.name).first()

    if existingcategory:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category already exists")

    category=models.Category(
          name=payload.name,
          description=payload.description
    )
    db.add(category)
    db.commit()
    db.refresh(category)

    return category

@router.get("/categories",response_model=List[schemas.Showcategories])
def getCategories(db:Session=Depends(get_db)):
    categories=db.query(models.Category).all()

    return categories

@router.get("/categories/count")
def getCategoriesCount(db:Session=Depends(get_db)):
    categories=db.query(models.Category).all()

    return len(categories)
