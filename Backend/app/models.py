import uuid
from sqlalchemy import Column,Integer,String,Float,ForeignKey,DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import base
from sqlalchemy.dialects.postgresql import JSONB, UUID

class User(base):
    __tablename__="users"
    
    id=Column(UUID(as_uuid=True),primary_key=True,default=uuid.uuid4,index=True)
    store_id=Column(Integer,ForeignKey("stores.id"),nullable=False)
    name=Column(String,nullable=False)
    email=Column(String,nullable=False)
    role=Column(String,nullable=False)
    hashed_password=Column(String,nullable=False)
    created_at=Column(DateTime(timezone=True),server_default=func.now(),nullable=False)


    shifts=relationship(
        "Shift",
        backref="user"
    )

    transactions=relationship(
        "Transaction",
        backref="user"
    )
    
class Store(base):
    __tablename__="stores"

    id=Column(Integer,primary_key=True,index=True)
    store_name=Column(String,nullable=False)
    location=Column(String,nullable=False)
    created_at=Column(DateTime(timezone=True),server_default=func.now(),nullable=False)


    users=relationship(
        "User",
        backref="store"
    )

    shifts=relationship(
        "Shift",
        backref="store"
    )

    stock=relationship(
        "InventoryStock",
        backref="store"
    )

    transactions=relationship(
        "Transaction",
        backref="store"
    )


class Shift(base):
    __tablename__="shifts"

    id=Column(UUID(as_uuid=True),primary_key=True,default=uuid.uuid4,index=True)
    store_id=Column(Integer,ForeignKey("stores.id"),nullable=False)
    cashier_id=Column(UUID(as_uuid=True),ForeignKey("users.id"),nullable=False)
    status=Column(String,nullable=False,default="Active")
    opened_at=Column(DateTime(timezone=True),server_default=func.now(),nullable=False)
    ended_at=Column(DateTime(timezone=True),server_onupdate=func.now(),nullable=False)

    

class Category(base):
    __tablename__="categories"                     

    id=Column(Integer,primary_key=True,index=True)
    name=Column(String,nullable=False)
    description=Column(String,nullable=False)
    
    items=relationship(
        "Item",
        backref="category"
    )


class Item(base):
    __tablename__="items"
    
    id=Column(Integer,primary_key=True,index=True)
    name=Column(String,nullable=False)
    category_id=Column(Integer,ForeignKey("categories.id"),nullable=False)
    store_keeping_unit=Column(String,nullable=False) #barcode read
    unit_cost=Column(Float,nullable=False)  # Original Price bought
    unit_price=Column(Float,nullable=False) # Original Price to be sold
    img_path=Column(String,nullable=False)
    reorder_level=Column(Integer,nullable=False,default="10")   # Any quantity below this raises alarm 
    created_at=Column(DateTime(timezone=True),server_default=func.now(),nullable=False)
    updated_at=Column(DateTime(timezone=True),server_onupdate=func.now(),nullable=False)

    stock=relationship(
        "InventoryStock",
        backref="item"
    )
    transaction_items=relationship(
        "TransactionItem",
        backref="item"
    )

class InventoryStock(base):
    __tablename__="stock"

    id=Column(Integer,primary_key=True,index=True)
    item_id=Column(Integer,ForeignKey("items.id"),nullable=False)
    store_id=Column(Integer,ForeignKey("stores.id"),nullable=False)
    quantity=Column(Integer,nullable=False,default="0")
    updated_at=Column(DateTime(timezone=True),server_onupdate=func.now(),nullable=False)

class Transaction(base):
    __tablename__="transactions"

    id=Column(Integer,primary_key=True,index=True)
    store_id=Column(Integer,ForeignKey("stores.id"),nullable=False)
    user_id=Column(UUID(as_uuid=True),ForeignKey("users.id"),nullable=False)
    transaction_type=Column(String,nullable=False)
    total_amount=Column(Float,nullable=False)
    created_at=Column(DateTime(timezone=True),server_default=func.now(),nullable=False)

    transaction_items=relationship(
        "TransactionItem",
        backref="transaction"
    )

class TransactionItem(base):
    __tablename__="transaction_items"

    id=Column(Integer,primary_key=True,index=True)
    transaction_id=Column(Integer,ForeignKey("transactions.id"),nullable=False)
    item_id=Column(Integer,ForeignKey("items.id"),nullable=False)
    quantity=Column(Integer,nullable=False)
    buying_price=Column(Float,nullable=False)
    selling_price=Column(Float,nullable=False)
    created_at=Column(DateTime(timezone=True),server_default=func.now(),nullable=False)

