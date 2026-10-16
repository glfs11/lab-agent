from email.policy import default

from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer
from app.database import Base


class Lab(Base):
    __tablename__ = "labs"
    __table_args__ = {"comment": "实验室信息表"}

    name: Mapped[str] = mapped_column(String(50), comment="实验室名称")
    description: Mapped[str | None] = mapped_column(
        String(500), comment="简介", nullable=True
    )
    location: Mapped[str | None] = mapped_column(
        String(100), comment="位置", nullable=True
    )
    capacity: Mapped[int] = mapped_column(Integer, comment="容纳人数", default=0)
    open_time: Mapped[str | None] = mapped_column(
        String(20), comment="开放开始时间", nullable=True
    )
    close_time: Mapped[str | None] = mapped_column(
        String(20), comment="开放结束时间", nullable=True
    )
    img: Mapped[str | None] = mapped_column(
        String(100), comment="封面图", nullable=True
    )
    status: Mapped[int] = mapped_column(
        Integer, comment="状态：0-关闭，1-开放", default=1
    )
