from fastapi import APIRouter,HTTPException,Depends,status,Query
from sqlalchemy.orm import Session
import models,schemas,security
from database import get_db
from datetime import date,datetime
from sqlalchemy import and_

router=APIRouter(tags=['report'])


@router.get("/report")
async def getReport(date_from:date=Query(...,description='start date'),date_to:date=Query(...,description='end date'),
                    db:Session=Depends(get_db),currentUser:models.User=Depends(security.getCurrentUser)):
     
     dt_from = datetime.combine(date_from, datetime.min.time())
     dt_to   = datetime.combine(date_to,   datetime.max.time())

     rows=(
          db.query(
               models.TransactionItem.id,
               models.Item.name.label('item_name'),
               models.TransactionItem.quantity,
               models.User.name.label('served_by'),
               models.Transaction.transaction_type,
               models.Transaction.created_at,
               models.Transaction.total_amount,
               models.TransactionItem.reason,
               models.TransactionItem.quantity,
               models.TransactionItem.selling_price,
               models.TransactionItem.buying_price,
               models.Transaction.transaction_type
          )
          
          .join(models.Transaction,models.TransactionItem.transaction_id==models.Transaction.id )
          .join(models.User,models.Transaction.user_id ==models.User.id)
          .join(models.Item,models.TransactionItem.item_id == models.Item.id)
          
          .filter(
               and_(
                    models.Transaction.store_id == currentUser.store_id,
                    models.Transaction.created_at >= dt_from,
                    models.Transaction.created_at <=dt_to,
               )
          )
          .order_by(models.Transaction.created_at.desc())
          .all()

          )

     
          
          
     return [
          {
               "id":row.id,
               "item_name":row.item_name,
               "quantity":row.quantity,
               "served_by":row.served_by,
               "time":row.created_at.strftime("%H:%M"),
               "date":row.created_at.strftime("%d %b %Y"),
               "transaction_type":row.transaction_type,
               "total_amount":(row.quantity*row.buying_price)if row.transaction_type == "Receive stock" else(row.quantity*row.selling_price),
               "reason":row.reason,
               "created_at":row.created_at
            

          }
          for row in rows
     ]
         


