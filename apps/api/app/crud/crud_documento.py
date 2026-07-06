from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update
from uuid import UUID
from api.app.models.documento import DocumentoKYC
from api.app.schemas.documento import DocumentoCreate

class CRUDDocumento:
    async def get_by_loja(self, db: AsyncSession, *, loja_id: UUID) -> list[DocumentoKYC]:
        result = await db.execute(select(DocumentoKYC).where(DocumentoKYC.loja_id == loja_id).order_by(DocumentoKYC.created_at.desc()))
        return result.scalars().all()

    async def create(self, db: AsyncSession, *, loja_id: UUID, obj_in: DocumentoCreate) -> DocumentoKYC:
        db_obj = DocumentoKYC(loja_id=loja_id, **obj_in.model_dump(), status="pendente")
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

documento_kyc = CRUDDocumento()
