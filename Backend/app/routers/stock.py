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
                selling_price=item.unit_price
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


@router.post("/stock/dispatch")  
async def dispatchStock(
    payload: schemas.DispatchStockBatch,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.getCurrentUser)
):
    # 1. Validate Payload
    if not payload.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Item list cannot be empty"
        )
        
    # 2. Create Parent Transaction
    dispatchTransaction = models.Transaction(
        store_id=current_user.store_id,
        user_id=current_user.id,
        transaction_type="Dispatch Items",
        total_amount=payload.total_amount
    )
    db.add(dispatchTransaction)
    db.flush() # Locks in the dispatchTransaction.id

    # 3. Process Cart Items
    for cart_item in payload.items:
        if cart_item.quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Quantity for item ID {cart_item.item_id} must be greater than zero"
            )

        quantity_needed = cart_item.quantity

        # 4. Fetch Stock Batches (FIFO Order + Row Locking)
        # .with_for_update() locks these rows so two cashiers can't sell the exact same item at the same time
        available_batches = (
            db.query(models.InventoryStock)
            .filter(
                models.InventoryStock.item_id == cart_item.item_id,
                models.InventoryStock.store_id == current_user.store_id,
                models.InventoryStock.quantity > 0
            )
            .order_by(models.InventoryStock.id.asc()) 
            .with_for_update()
            .all()
        )

        # 5. The FIFO Split-Batch Loop
        for batch in available_batches:
            if quantity_needed <= 0:
                break # We fulfilled the cart item, move to the next item in the payload

            # Determine how much we can take from this specific batch
            qty_to_take = min(quantity_needed, batch.quantity)

            # Create the transaction item row
            new_item = models.TransactionItem(
                transaction_id=dispatchTransaction.id,
                item_id=cart_item.item_id, # Fixed from cart_item.id
                quantity=qty_to_take,
                selling_price=cart_item.selling_price,
                reason=cart_item.reason,
                buying_price=batch.unit_price # Cost of goods from the database batch
            )
            db.add(new_item)

            # Deduct from the stock batch and update our remaining requirement
            batch.quantity -= qty_to_take
            quantity_needed -= qty_to_take

        # 6. Insufficient Stock Check
        if quantity_needed > 0:
            # Raising an error automatically aborts and rolls back everything above this line
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for item ID {cart_item.item_id}. Short by {quantity_needed}."
            )

    # 7. Commit Only at the Very End
    db.commit()
    
    return {
        "message": "Dispatch successful",
        "transaction_id": dispatchTransaction.id
    }



@router.get("/stock/price-check")
async def priceCheck(
    item_id:  int,
    quantity: int,
    db:       Session = Depends(get_db),
    current_user: models.User = Depends(security.getCurrentUser)
):
    batches = (
        db.query(models.InventoryStock)
        .filter(
            models.InventoryStock.item_id  == item_id,
            models.InventoryStock.store_id == current_user.store_id,
            models.InventoryStock.quantity > 0
        )
        .order_by(models.InventoryStock.id.asc())
        .all()
    )

    qty_remaining  = quantity
    batches_needed = []

    for batch in batches:
        if qty_remaining <= 0:
            break
        take = min(qty_remaining, batch.quantity)
        batches_needed.append({
            "batch_id":      batch.id,
            "qty":           take,
            "selling_price": batch.unit_price,
            "unit_cost":     batch.unit_cost,
        })
        qty_remaining -= take

    if qty_remaining > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Only {quantity - qty_remaining} units available"
        )

    # Highest selling price among all batches touched
    resolved_price = max(b["selling_price"] for b in batches_needed)
    total          = resolved_price * quantity

    return {
        "resolved_selling_price": resolved_price,
        "total":                  total,
        "batches_touched":        len(batches_needed),
        "quantity":               quantity,
    }