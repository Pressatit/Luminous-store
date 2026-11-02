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
    if current_user.role in ["admin", "manager"]:
        shift = db.query(models.Shift).filter(
            models.Shift.store_id == current_user.store_id,
            models.Shift.status == "Active"
        ).first()

    else:
        shift = db.query(models.Shift).filter(
            models.Shift.cashier_id == current_user.id,
            models.Shift.status == "Active"
        ).first()
    
    if not shift:
        return None

    cashier = db.query(models.User).filter(models.User.id == shift.cashier_id).first()

    return {
        "shift_id":shift.id,
        "status":shift.status,
        "opened_at":shift.opened_at.isoformat(),
        "opening_balance":shift.opening_balance,
        "cashier_name":cashier.name    }

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
    return {"message": "Shift started successfully", 
            "shift_id": new_shift.id,
            "status": new_shift.status,
            "opening_balance":new_shift.opening_balance,
            "opened_at":new_shift.opened_at.isoformat(),
            "cashier_name":current_user.name,
            "store_name":store.store_name
         }

@router.post("/close")
async def close_shift(
    #closing_balance: float, 
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
    #shift.closing_balance = closing_balance
    
    # Notification for closure
    notification = models.Notification(
        store_id=current_user.store_id,
        message=f"Till closed by {current_user.name}."
    )
    db.add(notification)
    
    db.commit()
    return {"message": "Shift closed successfully",
            "shift_id":shift.id,
            "opened_at":shift.opened_at,
            "closed_at":shift.ended_at.isoformat(),
            "status":shift.status}