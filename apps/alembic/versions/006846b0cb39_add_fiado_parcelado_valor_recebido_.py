"""add fiado parcelado: valor_recebido + movimentos_vendas

Revision ID: 006846b0cb39
Revises: b0eeb88166e0
Create Date: 2026-08-10 13:22:12.142238

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '006846b0cb39'
down_revision: Union[str, Sequence[str], None] = 'b0eeb88166e0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    """Upgrade schema."""
    # 1. ADD COLUNA valor_recebido NA TABELA VENDAS - SÓ SE NÃO EXISTIR
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                           WHERE table_name='vendas' AND column_name='valor_recebido') THEN
                ALTER TABLE vendas ADD COLUMN valor_recebido NUMERIC(14, 2) NOT NULL DEFAULT 0;
            END IF;
        END $$;
    """)

    # 2. ALTERAR DEFAULT DO STATUS PARA 'divida' - SÓ SE FOR DIFERENTE
    op.execute("""
        ALTER TABLE vendas ALTER COLUMN status SET DEFAULT 'divida';
    """)

    # 3. CRIAR TABELA NOVA: MOVIMENTOS_VENDAS - SÓ SE NÃO EXISTIR
    op.execute("""
        CREATE TABLE IF NOT EXISTS movimentos_vendas (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            venda_id UUID NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
            loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
            cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
            usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
            valor_pago NUMERIC(14, 2) NOT NULL,
            forma_pagamento VARCHAR(50) NOT NULL,
            observacao TEXT,
            created_at TIMESTAMPTZ DEFAULT now()
        );
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_movimentos_vendas_venda_id ON movimentos_vendas(venda_id);")

def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DROP INDEX IF EXISTS ix_movimentos_vendas_venda_id;")
    op.execute("DROP TABLE IF EXISTS movimentos_vendas;")
    op.execute("ALTER TABLE vendas ALTER COLUMN status SET DEFAULT 'concluida';")
    op.execute("DROP COLUMN IF EXISTS valor_recebido;")


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_movimentos_vendas_venda_id'), table_name='movimentos_vendas')
    op.drop_table('movimentos_vendas')
    op.alter_column('vendas', 'status',
               existing_type=sa.String(length=20),
               server_default='concluida',
               existing_nullable=False)
    op.drop_column('vendas', 'valor_recebido')
