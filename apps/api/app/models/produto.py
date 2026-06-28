from sqlalchemy import Column, Integer, String, Float, DateTime, func
from app.db.session import Base

class Produto(Base):
    __tablename__ = "produtos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(255), nullable=False, index=True)
    preco = Column(Float, nullable=False)
    stock = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())