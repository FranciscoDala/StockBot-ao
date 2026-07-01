from pydantic import BaseModel, Field, EmailStr, computed_field
from uuid import UUID
from datetime import datetime, timedelta, timezone
from typing import Optional, List
from api.app.schemas.usuario import UsuarioOut
from api.app.schemas.documento import DocumentoOut
from api.app.schemas.funcionario import FuncionarioOut

class GerenteOut(BaseModel):
    id: UUID
    nome: str
    email: EmailStr
    telefone: Optional[str] = None

    class Config:
        from_attributes = True

class LojaBase(BaseModel):
    nome: str = Field(..., min_length=3, max_length=100)
    slug: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-z0-9-]+$")
    is_active: bool = True

class LojaCreate(LojaBase):
    usuario_id_dono: UUID | None = None
    gerente_nome: str | None = None
    gerente_email: EmailStr | None = None
    gerente_senha: str | None = None

class LojaUpdate(BaseModel):
    nome: str | None = None
    is_active: bool | None = None
    usuario_id_dono: UUID | None = None

class LojaRead(LojaBase):
    id: UUID
    created_at: datetime
    usuario_id_dono: UUID
    dono: Optional[UsuarioOut] = None
    gerente: Optional[GerenteOut] = None

    class Config:
        from_attributes = True

class LojaListRead(LojaRead):
    pass

# SCHEMA PRA /lojas/{slug} - Mapeia tudo pro front
class LojaDetailRead(BaseModel):
    # 1. Campos do Model - Vem direto do SQLAlchemy
    id: UUID
    nome: str
    slug: str
    is_active: bool
    created_at: datetime
    endereco: Optional[str] = None
    logo_url: Optional[str] = None
    ano_fundacao: Optional[int] = None # <-- Campo normal do DB. Sem @computed_field

    gerente: Optional[GerenteOut] = None
    documentos: List[DocumentoOut] = []
    funcionarios: List[FuncionarioOut] = []
    vendas: List = []

    # 2. Campos pro Frontend - Mapeados com computed_field
    @computed_field
    @property
    def name(self) -> str:
        return self.nome

    @computed_field
    @property
    def status(self) -> str:
        return "Ativa" if self.is_active else "Inativa"

    @computed_field
    @property
    def localizacao(self) -> str:
        return self.endereco or "Não informada"

    @computed_field
    @property
    def ano_fundacao_calc(self) -> int: # <-- Nome diferente pra não conflitar com o DB
        return self.ano_fundacao or self.created_at.year

    @computed_field
    @property
    def manager(self) -> Optional[GerenteOut]:
        return self.gerente

    @computed_field
    @property
    def total_funcionarios(self) -> int:
        return len([f for f in self.funcionarios if f.is_active])

    @computed_field
    @property
    def total_vendas_30d(self) -> int:
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        return len([v for v in self.vendas if v.created_at >= thirty_days_ago and v.status == "concluida"])

    class Config:
        from_attributes = True