from pydantic import BaseModel, Field, EmailStr, computed_field, model_validator, ConfigDict
from uuid import UUID
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Union

from app.schemas.documento import DocumentoOut
from app.schemas.usuario import UserRead, Role

class DonoOut(UserRead):
    telefone: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class DonoCreate(BaseModel):
    email: EmailStr
    nome: str
    senha: str = Field(..., min_length=6)
    telefone: Optional[str] = None

class DonoUpdateIn(BaseModel):
    nome: Optional[str] = None
    email: Optional[EmailStr] = None
    telefone: Optional[str] = None

class LojaBase(BaseModel):
    nome: str = Field(..., min_length=3, max_length=100)
    slug: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-z0-9-]+$")
    endereco: Optional[str] = None
    nif: Optional[str] = None
    telefone: Optional[str] = None
    is_active: bool = True
    theme: str = "dark"
    card_style: str = "padrao"
    card_size: str = "medio"
    font_size: str = "medio"
    cor_primaria: str = "#10b981" # ADICIONADO
    cor_fundo: str = "#000000" # ADICIONADO

class LojaCreateIn(LojaBase):
    dono_existente_id: Optional[UUID] = None
    dono_novo: Optional[DonoCreate] = None

    @model_validator(mode='after')
    def check_dono(self):
        if self.dono_existente_id == "":
            self.dono_existente_id = None
        if self.dono_novo and self.dono_novo.senha == "":
            self.dono_novo = None
        if not self.dono_existente_id and not self.dono_novo:
            raise ValueError("Informe 'dono_existente_id' ou 'dono_novo'")
        if self.dono_existente_id and self.dono_novo:
            raise ValueError("Envie apenas 'dono_existente_id' OU 'dono_novo', não os dois")
        return self

class LojaUpdateIn(BaseModel):
    nome: Optional[str] = None
    slug: Optional[str] = None
    is_active: Optional[bool] = None
    endereco: Optional[str] = None
    nif: Optional[str] = None
    telefone: Optional[str] = None
    dono: Optional[DonoUpdateIn] = None
    theme: Optional[str] = None
    card_style: Optional[str] = None
    card_size: Optional[str] = None
    font_size: Optional[str] = None
    cor_primaria: Optional[str] = None # ADICIONADO
    cor_fundo: Optional[str] = None # ADICIONADO

class LojaSelectOut(BaseModel):
    id: UUID
    nome: str
    slug: str
    model_config = ConfigDict(from_attributes=True)

class LojaDetailOut(BaseModel):
    id: UUID
    nome: str
    slug: str
    is_active: bool
    created_at: Union[datetime, str]
    endereco: Optional[str] = None
    nif: Optional[str] = None
    telefone: Optional[str] = None
    logo_url: Optional[str] = None
    gerente: Optional[DonoOut] = None
    total_funcionarios: int = 0
    theme: str
    card_style: str
    card_size: str
    font_size: str
    cor_primaria: str # ADICIONADO
    cor_fundo: str # ADICIONADO
    model_config = ConfigDict(from_attributes=True)

class LojaDetailFull(BaseModel):
    id: UUID
    nome: str
    slug: str
    is_active: bool
    created_at: datetime
    endereco: Optional[str] = None
    nif: Optional[str] = None
    telefone: Optional[str] = None
    logo_url: Optional[str] = None
    ano_fundacao: Optional[int] = None
    deleted_at: Optional[datetime] = None
    dono: Optional[DonoOut] = None
    gerente: Optional[DonoOut] = None
    documentos: List[DocumentoOut] = []
    funcionarios: List[DonoOut] = []
    vendas: List = []
    theme: str
    card_style: str
    card_size: str
    font_size: str
    cor_primaria: str # ADICIONADO
    cor_fundo: str # ADICIONADO

    @model_validator(mode='after')
    def set_aliases(self):
        if self.dono and not self.gerente:
            self.gerente = self.dono
        return self

    @computed_field
    @property
    def name(self) -> str: return self.nome
    @computed_field
    @property
    def status(self) -> str:
        if self.deleted_at: return "apagada"
        return "ativa" if self.is_active else "inativa"
    @computed_field
    @property
    def localizacao(self) -> str: return self.endereco or "não informada"
    @computed_field
    @property
    def ano_fundacao_calc(self) -> int: return self.ano_fundacao or self.created_at.year
    @computed_field
    @property
    def manager(self) -> Optional[DonoOut]: return self.dono
    @computed_field
    @property
    def total_funcionarios(self) -> int: return len([f for f in self.funcionarios if f.is_active])
    @computed_field
    @property
    def total_vendas_30d(self) -> int:
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        return len([v for v in self.vendas if v.created_at >= thirty_days_ago and v.status == "concluida"])

    model_config = ConfigDict(from_attributes=True)

lojadetailread = LojaDetailFull
donoout = DonoOut
lojaread = LojaDetailOut
gerenteout = DonoOut
GerenteOut = DonoOut
