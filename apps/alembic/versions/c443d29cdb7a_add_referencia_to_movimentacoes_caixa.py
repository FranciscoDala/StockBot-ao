"""add referencia to movimentacoes_caixa

Revision ID: c443d29cdb7a
Revises: 96f9b6f6ca9a
Create Date: 2026-07-22

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'c443d29cdb7a'
down_revision = '96f9b6f6ca9a'

def upgrade():
    # NÃO cria ENUM aqui pq já existe da migration 96f9b6f6ca9a

    # 1. Cria tabela caixa usando os ENUMs que já existem
    op.create_table('caixa',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('loja_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('lojas.id', ondelete='CASCADE'), nullable=False),
        sa.Column('data_caixa', sa.Date(), nullable=False, server_default=sa.text('CURRENT_DATE')),
        sa.Column('data_abertura', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('data_fechamento', sa.TIMESTAMP(timezone=True)),
        sa.Column('usuario_abertura_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('usuarios.id')),
        sa.Column('usuario_fechamento_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('usuarios.id')),
        sa.Column('saldo_abertura', sa.Numeric(14,2), default=0.00, nullable=False),
        sa.Column('total_entradas', sa.Numeric(14,2), default=0.00, nullable=False),
        sa.Column('total_saidas', sa.Numeric(14,2), default=0.00, nullable=False),
        sa.Column('saldo_esperado', sa.Numeric(14,2), default=0.00, nullable=False),
        sa.Column('saldo_contado', sa.Numeric(14,2)),
        sa.Column('diferenca', sa.Numeric(14,2)),
        sa.Column('status', postgresql.ENUM('aberto', 'fechado', name='statuscaixa'), default='aberto', nullable=False), # <- usa o que já existe
        sa.Column('observacao', sa.Text()),
    )
    op.create_unique_constraint('uq_caixa_loja_dia', 'caixa', ['loja_id', 'data_caixa'])

    # 2. Cria tabela movimentacoes_caixa com referencia e novos tipos no ENUM
    op.create_table('movimentacoes_caixa',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('caixa_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('caixa.id', ondelete='CASCADE'), nullable=False),
        sa.Column('loja_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('lojas.id', ondelete='CASCADE'), nullable=False),
        sa.Column('usuario_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('usuarios.id')),
        sa.Column('saida_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('saidas.id'), nullable=True),
        sa.Column('tipo', postgresql.ENUM('abertura', 'entrada', 'saida', 'sangria', 'suprimento', 'estorno', name='tipomovimentacao'), nullable=False), # <- usa o que já existe
        sa.Column('valor', sa.Numeric(14,2), nullable=False),
        sa.Column('descricao', sa.Text()),
        sa.Column('referencia_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('referencia_tipo', sa.String(50), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
    )

def downgrade():
    op.drop_table('movimentacoes_caixa')
    op.drop_table('caixa')
