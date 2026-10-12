from fastapi import FastAPI
from app.api import api
from app.database import Base, engine
from app.models.user import User  # noqa: F401  必须导入，否则 create_all 不知道这张表

app = FastAPI()
app.include_router(api)
Base.metadata.create_all(bind=engine)  # 建表：表已存在时是幂等的，不会重复建


@app.get("/")
def root():
    return {"message": "Hello FastAPI"}
