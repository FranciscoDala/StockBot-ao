from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, cast
from uuid import UUID
from datetime import datetime

from app.db.session import get_db # <- CORRIGIDO: app.db.session
from app.models.cliente import Cliente # <- CORRIGIDO: app.models.cliente
from app.models.venda import Venda # <- CORRIGIDO
from app.schemas.cliente import ClienteCreate, ClienteOut # <- CORRIGIDO
from app.core.deps import get_current_user

router = APIRouter()

def _cliente_to_out(db: Session, cliente: Cliente) -> ClienteOut:
    total_divida = db.query(func.coalesce(func.sum(Venda.total), 0)).filter(
        Venda.cliente_id == cliente.id,
        Venda.status == "pendente"
    ).scalar() or 0.0

    ultima_venda = db.query(Venda).filter(Venda.cliente_id == cliente.id).order_by(Venda.created_at.desc()).first()
    ultima_compra: datetime = cast(datetime, ultima_venda.created_at) if ultima_venda else cast(datetime, cliente.created_at)
    status_cliente = "com_divida" if total_divida > 0 else "em_dia"

    return ClienteOut(
        id=getattr(cliente, "id"),
        loja_id=getattr(cliente, "loja_id"),
        nome=getattr(cliente, "nome"),
        nome_empresa=getattr(cliente, "nome_empresa"),
        bi=getattr(cliente, "bi"),
        telefone=getattr(cliente, "telefone"),
        email=getattr(cliente, "email"),
        endereco=getattr(cliente, "endereco"),
        cidade=getattr(cliente, "cidade"),
        provincia=getattr(cliente, "provincia"),
        observacoes=getattr(cliente, "observacoes"),
        is_active=getattr(cliente, "is_active"),
        created_at=getattr(cliente, "created_at"),
        total_divida=float(total_divida),
        ultima_compra=ultima_compra,
        status=status_cliente
    )

@router.get("/{loja_id}/clientes", response_model=List[ClienteOut]) # <- CORRIGIDO: tirou /lojas/id
def listar_clientes(
    loja_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    clientes = db.query(Cliente).filter(Cliente.loja_id == loja_id, Cliente.is_active == True).all()
    return [_cliente_to_out(db, c) for c in clientes]

@router.post("/{loja_id}/clientes", response_model=ClienteOut, status_code=status.HTTP_201_CREATED) # <- CORRIGIDO
def criar_cliente(
    loja_id: UUID,
    cliente_in: ClienteCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if cliente_in.bi:
        existe = db.query(Cliente).filter(Cliente.loja_id == loja_id, Cliente.bi == cliente_in.bi).first()
        if existe: raise HTTPException(status_code=400, detail="BI já cadastrado para esta loja")

    data = cliente_in.model_dump()
    data["loja_id"] = loja_id
    db_cliente = Cliente(**data)

    db.add(db_cliente)
    db.commit()
    db.refresh(db_cliente)
    return _cliente_to_out(db, db_cliente)

@router.get("/{loja_id}/clientes/{cliente_id}/pendentes") # <- CORRIGIDO
def listar_pendencias_cliente(
    loja_id: UUID,
    cliente_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    vendas = db.query(Venda).filter(
        Venda.loja_id == loja_id,
        Venda.cliente_id == cliente_id,
        Venda.status == "pendente"
    ).order_by(Venda.created_at.desc()).all()

    return [{
        "id": str(v.id),
        "data_venda": v.created_at,
        "total": float(v.total),
        "total_itens": v.total_itens
    } for v in vendas]

@router.post("/{loja_id}/clientes/{cliente_id}/receber") # <- CORRIGIDO
def receber_pagamento_cliente(
    loja_id: UUID,
    cliente_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    vendas_pendentes = db.query(Venda).filter(
        Venda.loja_id == loja_id,
        Venda.cliente_id == cliente_id,
        Venda.status == "pendente"
    ).all()

    if not vendas_pendentes:
        raise HTTPException(status_code=404, detail="Cliente não possui dívidas")

    for venda in vendas_pendentes:
        venda.status = "concluida"
        venda.valor_recebido = venda.total
        venda.forma_pagamento = "Dinheiro"

    db.commit()
    return {"detail": f"{len(vendas_pendentes)} vendas quitadas com sucesso"}
