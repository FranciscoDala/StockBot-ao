from pydantic import BaseModel, Field, EmailStr, computed_field, model_validator, ConfigDict
from uuid import UUID
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Union

from api.app.schemas.documento import DocumentoOut
from api.app.schemas.usuario import UserRead, Role # <- TROCA: Usa UserRead e Role do UsuarioLoja

# SCHEMA: DonoOut / GerenteOut
# Agora herda de UserRead pra reaproveitar os campos
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
    nif: Optional[str] = None # <- ADICIONEI
    telefone: Optional[str] = None # <- ADICIONEI
    is_active: bool = True

class LojaCreateIn(LojaBase):
    dono_existente_id: Optional[UUID] = None # ID de um usuario já cadastrado
    dono_novo: Optional[DonoCreate] = None # Dados pra criar um usuario novo

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
    nif: Optional[str] = None # <- ADICIONEI
    telefone: Optional[str] = None # <- ADICIONEI
    dono: Optional[DonoUpdateIn] = None

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
    nif: Optional[str] = None # <- ADICIONEI
    telefone: Optional[str] = None # <- ADICIONEI
    gerente: Optional[DonoOut] = None # <- "gerente" é o dono da loja
    total_funcionarios: int = 0 # <- Conta quantos membros ativos tem
    model_config = ConfigDict(from_attributes=True)

class LojaDetailFull(BaseModel):
    id: UUID
    nome: str
    slug: str
    is_active: bool
    created_at: datetime
    endereco: Optional[str] = None
    nif: Optional[str] = None # <- ADICIONEI
    telefone: Optional[str] = None # <- ADICIONEI
    logo_url: Optional[str] = None
    ano_fundacao: Optional[int] = None
    deleted_at: Optional[datetime] = None # <- Pra Soft Delete futuro
    dono: Optional[DonoOut] = None # Alias pra gerente
    gerente: Optional[DonoOut] = None
    documentos: List[DocumentoOut] = []
    funcionarios: List[DonoOut] = [] # <- TROCA: Lista de membros da loja via UsuarioLoja
    vendas: List = []

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

# Aliases pra não quebrar imports antigos
lojadetailread = LojaDetailFull
donoout = DonoOut
lojaread = LojaDetailOut
gerenteout = DonoOut
GerenteOut = DonoOut
