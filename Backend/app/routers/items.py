from fastapi import APIRouter,UploadFile,status,Form,File,Depends,Query
from sqlalchemy.orm import Session
import os
import schemas,models,security
from database import get_db
from supabase import Client,create_client
import uuid
from sqlalchemy import or_
from datetime import timezone,datetime
from typing import List,Optional


from dotenv import load_dotenv
load_dotenv()


router =APIRouter(tags=["Items"])

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SECRET_KEY") # Use Service Role Key for server uploads
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

@router.post("/item")
async def createItem(name: str = Form(...),category_id: int = Form(...),barcode: str = Form(...),
                     is_bin_item: bool = Form(False),image: UploadFile = File(None),db: Session = Depends(get_db),current_user: models.User = Depends(security.getCurrentUser)):

    img_path=None

    if image:
        file_extension = image.filename.split(".")[-1]
        file_name = f"{uuid.uuid4()}.{file_extension}"
        file_bytes = await image.read()

        # Upload file bytes to 'item-images' bucket
        storage_res = supabase.storage.from_("luminous_items").upload(
            path=file_name,
            file=file_bytes,
            file_options={"content-type": image.content_type}
        )
        

        # Retrieve public URL
        img_path = supabase.storage.from_("luminous_items").get_public_url(file_name)
        now =datetime.now(timezone.utc)


    new_item = models.Item(
        name=name,
        category_id=category_id,
        store_keeping_unit=barcode,
        img_path=img_path,
        reorder_level=10, # Default threshold
        updated_at=now

    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    return new_item

@router.get("/items/all",response_model=List[schemas.Showitems])
async def getAllItems(db:Session=Depends(get_db)):
    allItems=db.query(models.Item).all()

    return allItems

@router.get("/items/search")
async def search_items(query:Optional[str]=Query(default=""),db:Session=Depends(get_db),current_user:models.User=Depends(security.getCurrentUser)):
    search = (
        db.query(
            models.Item.id,
            models.Item.name,
            models.Item.store_keeping_unit.label("barcode"),
            models.Category.name.label("category"),
        )
        .outerjoin(models.Category, models.Item.category_id == models.Category.id)
    )

    if query and query.strip():
        search_filter = f"%{query.strip()}%"
        search = search.filter(
            or_(
                models.Item.name.ilike(search_filter),
                models.Item.store_keeping_unit.ilike(search_filter)
            )
        )

    results = search.limit(20).all()

    return [
        {
            "id": item.id,
            "name": item.name,
            "barcode": item.barcode,
            "category": item.category or "Uncategorized",
            "quantity": 0 # Replace with stock query if stock aggregation is enabled
        }
        for item in results
    ]








