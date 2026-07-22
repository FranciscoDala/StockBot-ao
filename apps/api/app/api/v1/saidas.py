from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime

from app.database import get_db
from app.models.saida import Saida
from app.schemas.saida import SaidaCreate, SaidaRead, SaidaUpdate
from app.core.security import get_current_user # usa o teu dep de auth
from app.models.usuario import Usuario

router = APIRouter(
    prefix="/saidas",
    tags=["Saídas"]
)

@router.post("/", response_model=SaidaRead, status_code=status.HTTP_201_CREATED)
def criar_saida(
    saida: SaidaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    # Valida se o usuário tem acesso a loja
    if current_user.loja_id!= saida.loja_id and current_user.nivel not in ["ADMIN"]:
        raise HTTPException(status_code=403, detail="Sem permissão para esta loja")

    db_saida = Saida(**saida.dict(), criado_por=current_user.id)
    db.add(db_saida)
    db.commit()
    db.refresh(db_saida)
    return db_saida

@router.get("/", response_model=List[SaidaRead])
def listar_saidas(
    loja_id: UUID,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    # Valida se o usuário tem acesso a loja
    if current_user.loja_id!= loja_id and current_user.nivel not in ["ADMIN"]:
        raise HTTPException(status_code=403, detail="Sem permissão para esta loja")

    saidas = db.query(Saida).filter(Saida.loja_id == loja_id).order_by(Saida.data_saida.desc()).all()
    return saidas

@router.delete("/{saida_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_saida(
    saida_id: UUID,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    db_saida = db.query(Saida).filter(Saida.id == saida_id).first()
    if not db_saida:
        raise HTTPException(status_code=404, detail="Saída não encontrada")

    if current_user.loja_id!= db_saida.loja_id and current_user.nivel not in ["DONO", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Sem permissão para deletar")

    db.delete(db_saida)
    db.commit()
    return
