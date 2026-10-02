from fastapi import APIRouter,Depends,HTTPException,status
from sqlalchemy.orm import Session

import models
import schemas
import uuid
from database import get_db
from security import getCurrentUser

router=APIRouter(tags=['Devices'])

@router.post("/device/register")
async def add_device(label:str,
                     db:Session=Depends(get_db),
                     ):
    existing=db.query(models.Device).filter(models.Device.label==label).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Device exists"
        )

    token=str(uuid.uuid4())

    device=models.Device(
        device_token=token,
        label=label,
        is_Active=False
    )

    db.add(device)
    db.commit()
    db.refresh(device)

    return{
        "token":token,
        "status":"pending",
        "message":"Wait for managers approval of device registration"
    }

@router.patch("/device/{token}/approve")
async def approve(token:str,
                  db:Session=Depends(get_db),
                  currentUser:models.User=Depends(getCurrentUser)):
    
    if currentUser.role == "cashier":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="This role is not allowed access to this "
        )
    
    device = db.query(models.Device).filter(
        models.Device.device_token == token
    ).first()

    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    device.is_active  = True
    device.store_id=currentUser.store_id,
    db.commit()

    return{ 
        "message": f"Device '{device.label}' approved for store {currentUser.store_id}" 
        }



@router.get("/devices")
async def listDevices(
    db:           Session = Depends(get_db),
    current_user: models.User = Depends(getCurrentUser)
):
    if current_user.role == "cashier":
        raise HTTPException(status_code=403, detail="Admin only")

    devices = db.query(models.Device).filter(
        models.Device.store_id == current_user.store_id
    ).all()

    return devices
