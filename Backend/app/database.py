from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from dotenv import load_dotenv
load_dotenv()

import os
DB_URL=os.getenv("DATABASE_URL")

#engine
engine=create_engine(DB_URL)

#Base
base=declarative_base()

#session
SessionLocal=sessionmaker(bind=engine,autocommit=False,autoflush=False)


def get_db():
   db=SessionLocal()
   try:
      yield db
   finally:
      db.close()