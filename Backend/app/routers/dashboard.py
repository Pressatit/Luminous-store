from fastapi import APIRouter,HTTPException,Depends,Query
from sqlalchemy.orm import Session
import models,schemas,security
from database import get_db
from datetime import datetime,date
from sqlalchemy import and_,func


router=APIRouter(prefix="/dashboard",tags=['Dashboard'])

@router.get('/activity')
async def getReport(currentUser:models.User=Depends(security.getCurrentUser),db:Session=Depends(get_db),
                    date_from:date=Query(...,description='start date'),date_to:date=Query(...,description='end date')):

         dt_from = datetime.combine(date_from, datetime.min.time())
         dt_to   = datetime.combine(date_to,   datetime.max.time())
    
         activities=(
                 db.query(
                           models.TransactionItem.id,
                           models.Item.name.label('item_name'),
                           models.Transaction.transaction_type,
                           models.TransactionItem.quantity,
                           models.User.name.label('served_by'),
                           models.Transaction.created_at
                           )
                           .join(models.Transaction,models.Transaction.id==models.TransactionItem.transaction_id)
                           .join(models.Item,models.Item.id==models.TransactionItem.item_id)
                           .join(models.User,models.User.id==models.Transaction.user_id)
                           .filter(
                                   and_(
                                           models.Transaction.store_id == currentUser.store_id,
                                           models.Transaction.created_at >= dt_from,
                                           models.Transaction.created_at <= dt_to,
                                           
                                   )
                                   
                           ).order_by(models.Transaction.created_at.desc())
                           .all()
                           )
         return[
                 {
                    "id":activity.id,
                    "item_name":activity.item_name,
                    "transaction_type":activity.transaction_type,
                    "quantity":activity.quantity,
                    "served_by":activity.served_by,
                    "created_at":activity.created_at,
                 }
            for activity in activities
         ]




@router.get('/stock-alert')
async def getStock(db:Session=Depends(get_db),currentUser:models.User=Depends(security.getCurrentUser)):

    rows=(
           db.query(
                    models.Item.id,
                    models.Item.name.label('item_name'),
                    models.Category.name.label('category'),
                    func.sum(models.InventoryStock.quantity).label('total_quantity'),
                    )
                    .join(models.Item,models.InventoryStock.item_id==models.Item.id)
                    .join(models.Category,models.Category.id==models.Item.category_id)
                    .filter(models.InventoryStock.store_id==currentUser.store_id)
                    .group_by(models.Item.id,models.Item.name,models.Category.name)
                    .having(func.sum(models.InventoryStock.quantity)<=10)
                    .all()
                    )
    return[
           {
                  "id":row.id,
                  "item_name":row.item_name,
                  "category":row.category,
                  "quantity":row.total_quantity,
                  "low_stock_threshold":10

                  
           }
           for row in rows
    ]