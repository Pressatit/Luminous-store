from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
import models, schemas, security
from database import get_db

router = APIRouter(prefix="/shifts", tags=["Shifts"])

@router.get("/active")
async def get_active_shift(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(security.getCurrentUser)
):
    shift = db.query(models.Shift).filter(
        models.Shift.cashier_id == current_user.id,
        models.Shift.status == "Active"
    ).first()
    
    if not shift:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="No active shift found. Please open the till."
        )
    return shift

@router.post("/open")
async def open_shift(
    opening_balance: float, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(security.getCurrentUser)
):
    # Check if a shift is already open to prevent duplicates
    existing_shift = db.query(models.Shift).filter(
        models.Shift.cashier_id == current_user.id,
        models.Shift.status == "Active"
    ).first()
    
    if existing_shift:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="You already have an active shift."
        )
        
    new_shift = models.Shift(
        store_id=current_user.store_id,
        cashier_id=current_user.id,
        opening_balance=opening_balance,
        status="Active"
    )
    db.add(new_shift)
    
    # Fire off the notification
    store = db.query(models.Store).filter(models.Store.id == current_user.store_id).first()
    store_name = store.store_name if store else "the hardware store"
    
    notification = models.Notification(
        store_id=current_user.store_id,
        message=f"Till opened by {current_user.name} at {store_name}. Opening balance: Ksh {opening_balance}"
    )
    db.add(notification)
    
    db.commit()
    db.refresh(new_shift)
    return {"message": "Shift started successfully", "shift_id": new_shift.id}

@router.post("/close")
async def close_shift(
    closing_balance: float, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(security.getCurrentUser)
):
    shift = db.query(models.Shift).filter(
        models.Shift.cashier_id == current_user.id,
        models.Shift.status == "Active"
    ).first()
    
    if not shift:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="No active shift found."
        )
        
    shift.status = "Closed"
    shift.ended_at = datetime.utcnow()
    shift.closing_balance = closing_balance
    
    # Notification for closure
    notification = models.Notification(
        store_id=current_user.store_id,
        message=f"Till closed by {current_user.name}. Declared closing balance: Ksh {closing_balance}"
    )
    db.add(notification)
    
    db.commit()
    return {"message": "Shift closed successfully"}