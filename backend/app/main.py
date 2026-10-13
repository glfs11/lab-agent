from fastapi import FastAPI
from app.api import api
from app.database import Base, engine
from app.models.user import User  # noqa: F401  必须导入，否则 create_all 不知道这张表
from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from app.common.exceptions import (
    BusinessException,
    bussiness_excpetion_hadler,
    http_excpetion_hadler,
    validation_excpetion_hadler,
    global_excpetion_hadler,
)

app = FastAPI()
app.include_router(api)
Base.metadata.create_all(bind=engine)  # 建表：表已存在时是幂等的，不会重复建

# 注册异常处理器
app.add_exception_handler(BusinessException, bussiness_excpetion_hadler)
app.add_exception_handler(HTTPException, http_excpetion_hadler)
app.add_exception_handler(RequestValidationError, validation_excpetion_hadler)
# 全局的异常兜底，必须放在最后注册
app.add_exception_handler(Exception, global_excpetion_hadler)


@app.get("/")
def root():
    return {"message": "Hello FastAPI"}
