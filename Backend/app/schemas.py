from pydantic import BaseModel,EmailStr

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


