from fastapi import APIRouter,Depends,HTTPException,status
import schemas,models,security
from database import get_db
from sqlalchemy.orm import Session




router=APIRouter(tags=["stock"])

@router.post("/stock/receive")
async def receiveStock(payload:schemas.ReceiveStockBatch,db:Session=Depends(get_db),current_user:models.User=Depends(security.getCurrentUser)):

    if not payload.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Item list cannot be empty"
        )

    newTransaction=models.Transaction(
            user_id=current_user.id,
            store_id=current_user.store_id,
            transaction_type="Receive stock",
            total_amount=payload.total_amount
        )
    db.add(newTransaction)
    db.flush()

    for item in payload.items:
        if item.quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Quantity for item ID {item.item_id} must be greater than zero"
            )

        newBatch=models.InventoryStock(
                item_id=item.item_id,
                store_id=current_user.store_id,
                quantity=item.quantity,
                unit_cost=item.unit_cost,
                unit_price=item.unit_price
            )
        db.add(newBatch)

        transactionItems=models.TransactionItem(
                item_id=item.item_id,
                transaction_id=newTransaction.id,
                quantity=item.quantity,
                buying_price=item.unit_cost,
                selling_price=item.unit_cost
            )
        db.add(transactionItems)


    db.commit()
    db.refresh(newTransaction)
   

    return {
        "message": "Stock added successfully",
        "transaction_id": newTransaction.id,
        "items_count":len(payload.items),
        "total_amount": newTransaction.total_amount,
    }