"""add_campos_agt_venda

Revision ID: 4ed14a23e128
Revises: 274448712f3e
Create Date: 2026-08-24 10:04:59.653694

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '4ed14a23e128'
down_revision: Union[str, Sequence[str], None] = '274448712f3e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    """Upgrade schema."""
    # ### AJUSTADO - SEM APAGAR NADA E COM DEFAULTS ###

    # 1. Adicionar colunas AGT na tabela vendas
    op.add_column('vendas', sa.Column('subtotal', sa.Numeric(precision=14, scale=2), nullable=False, server_default='0'))
    op.add_column('vendas', sa.Column('valor_iva', sa.Numeric(precision=14, scale=2), nullable=False, server_default='0'))
    op.add_column('vendas', sa.Column('tipo_documento', sa.String(length=10), nullable=False, server_default='RECIBO'))
    op.add_column('vendas', sa.Column('serie', sa.String(length=10), nullable=False, server_default='FT'))
    op.add_column('vendas', sa.Column('numero_fatura', sa.String(length=50), nullable=True))
    op.add_column('vendas', sa.Column('qr_code_url', sa.Text(), nullable=True))
    op.create_index(op.f('ix_vendas_numero_fatura'), 'vendas', ['numero_fatura'], unique=True)

    # 2. Atualizar registros antigos pra ficar consistente
    op.execute("UPDATE vendas SET subtotal = total, valor_iva = 0 WHERE subtotal = 0")

    # 3. Depois de popular, remover o default pra novas vendas terem que vir do código
    op.alter_column('vendas', 'subtotal', server_default=None)
    op.alter_column('vendas', 'valor_iva', server_default=None)
    op.alter_column('vendas', 'tipo_documento', server_default=None)
    op.alter_column('vendas', 'serie', server_default=None)

def downgrade() -> None:
    """Downgrade schema."""
    # ### SÓ REVERTE O QUE ADICIONAMOS ###
    op.drop_index(op.f('ix_vendas_numero_fatura'), table_name='vendas')
    op.drop_column('vendas', 'qr_code_url')
    op.drop_column('vendas', 'numero_fatura')
    op.drop_column('vendas', 'serie')
    op.drop_column('vendas', 'tipo_documento')
    op.drop_column('vendas', 'valor_iva')
    op.drop_column('vendas', 'subtotal')
    # NÃO MEXER EM usuarios_lojas
    # ### end Alembic commands ###
