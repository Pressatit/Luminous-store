from fastapi import APIRouter,UploadFile,status,Form,File,Depends,Query
from sqlalchemy.orm import Session
import os
import schemas,models,security
from database import get_db
from supabase import Client,create_client
import uuid
from sqlalchemy import or_,func
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

@router.get("/items/all")
async def getAllItems(limit: int = Query(default=100, le=1000),current_user: models.User = Depends(security.getCurrentUser),db:Session=Depends(get_db)):

    qty_subq=(
        db.query(
            models.InventoryStock.item_id,
            func.sum(models.InventoryStock.quantity).label("total_quantity")

    ).filter(models.InventoryStock.store_id == current_user.store_id)
     .group_by(models.InventoryStock.item_id)
     .subquery()
    )

    fifo_subq =(
        db.query(
            models.InventoryStock.item_id,
            models.InventoryStock.unit_price.label('fifo_price')
        )
        .filter(
            models.InventoryStock.store_id ==current_user.store_id,
            models.InventoryStock.quantity > 0
        )
        .distinct(models.InventoryStock.item_id)
        .order_by(models.InventoryStock.item_id,models.InventoryStock.id.asc())
        .subquery()
    )

    results = (
        db.query(
            models.Item.id,
            models.Item.name,
            models.Item.store_keeping_unit.label("barcode"),
            models.Item.reorder_level,
            models.Item.img_path,
            models.Category.name.label("category"),
            func.coalesce(qty_subq.c.total_quantity, 0).label("total_quantity"),
            func.coalesce(fifo_subq.c.fifo_price,0.0).label("unit_price")
        )
        .outerjoin(models.Category, models.Item.category_id == models.Category.id)
        .outerjoin(qty_subq,models.Item.id == qty_subq.c.item_id)
        .outerjoin(fifo_subq,models.Item.id ==fifo_subq.c.item_id)
        .order_by(models.Item.created_at.desc())
        .limit(limit)
        .all() 
    )

    return [{
            "id": item.id,
            "name": item.name,
            "img_path":item.img_path,
            "unit_price":float(item.unit_price),
            "category": item.category or "Uncategorized",
            "quantity": int(item.total_quantity),
            "reorder_level":item.reorder_level
        
    }
    for item in results
    ]

@router.get("/items/search")
async def search_items(
    query: Optional[str] = Query(default=""),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.getCurrentUser)
):
    # 1. Total Quantity Subquery
    qty_subq = (
        db.query(
            models.InventoryStock.item_id,
            func.sum(models.InventoryStock.quantity).label("total_quantity")
        )
        .filter(models.InventoryStock.store_id == current_user.store_id)
        .group_by(models.InventoryStock.item_id)
        .subquery()
    )

    # 2. FIFO Price Subquery
    fifo_subq = (
        db.query(
            models.InventoryStock.item_id,
            models.InventoryStock.unit_price.label("fifo_price")
        )
        .filter(
            models.InventoryStock.store_id == current_user.store_id,
            models.InventoryStock.quantity > 0
        )
        .distinct(models.InventoryStock.item_id)
        .order_by(models.InventoryStock.item_id, models.InventoryStock.id.asc())
        .subquery()
    )

    # 3. Main Query Builder
    search = (
        db.query(
            models.Item.id,
            models.Item.name,
            models.Item.store_keeping_unit.label("barcode"),
            models.Category.name.label("category"),
            models.Item.img_path,
            models.Item.reorder_level,
            func.coalesce(qty_subq.c.total_quantity, 0).label("quantity"),
            func.coalesce(fifo_subq.c.fifo_price, 0.0).label("unit_price")
        )
        .outerjoin(models.Category, models.Item.category_id == models.Category.id)
        .outerjoin(qty_subq, models.Item.id == qty_subq.c.item_id)
        .outerjoin(fifo_subq, models.Item.id == fifo_subq.c.item_id)
    )

    # 4. Apply the search filter if one exists
    if query and query.strip():
        search_filter = f"%{query.strip()}%"
        search = search.filter(
            or_(
                models.Item.name.ilike(search_filter),
                models.Item.store_keeping_unit.ilike(search_filter)
            )
        )

    # 5. Execute
    results = search.limit(20).all()

    # 6. Return unified structure
    return [
        {
            "id": item.id,
            "name": item.name,
            "barcode": item.barcode,
            "category": item.category or "Uncategorized",
            "img_path": item.img_path,
            "unit_price": float(item.unit_price),
            "quantity": int(item.quantity),
            "reorder_level": item.reorder_level
        }
        for item in results
    ]








