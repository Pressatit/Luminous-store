from pydantic import BaseModel,EmailStr
from typing import List

class Signinrequest(BaseModel):
    email: EmailStr
    password:str

class Signuprequest(BaseModel):
    name:str 
    email:EmailStr
    role:str
    storeId:int
    password:str
    

class Showuser(BaseModel):
    name:str
    email:str
    role:str
    store_id:int

    class Config():
       from_attributes= True

class Createcategory(BaseModel):
    name:str
    description:str

class Showcategories(BaseModel):
    id:int
    name:str

    class Config():
           from_attributes= True

class Showitems(BaseModel):
    id:int
    name:str
    store_keeping_unit:str

class ReceiveStock(BaseModel):
    item_id: int
    quantity: int
    unit_cost: float
    unit_price: float
    

class ReceiveStockBatch(BaseModel):
    total_amount:float
    items:List[ReceiveStock]


