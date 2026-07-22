"""create caixa and movimentacao_caixa tables

Revision ID: 96f9b6f6ca9a
Revises: 25ffdcc33e42
Create Date: 2026-07-22 13:01:10.842885

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '96f9b6f6ca9a'
down_revision: Union[str, Sequence[str], None] = '25ffdcc33e42'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    """Upgrade schema."""

    # TABELA CAIXA
    op.create_table(
        'caixa',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('loja_id', sa.UUID(), nullable=False),
        sa.Column('data_caixa', sa.Date(), nullable=False, server_default=sa.text('CURRENT_DATE')), # <- NOVA COLUNA SÓ PRA DATA
        sa.Column('data_abertura', sa.TIMESTAMP(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('data_fechamento', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('usuario_abertura_id', sa.UUID(), nullable=True),
        sa.Column('usuario_fechamento_id', sa.UUID(), nullable=True),
        sa.Column('saldo_abertura', sa.Numeric(14, 2), server_default='0.00', nullable=False),
        sa.Column('total_entradas', sa.Numeric(14, 2), server_default='0.00', nullable=False),
        sa.Column('total_saidas', sa.Numeric(14, 2), server_default='0.00', nullable=False),
        sa.Column('saldo_esperado', sa.Numeric(14, 2), nullable=False, server_default='0.00'),
        sa.Column('saldo_contado', sa.Numeric(14, 2), nullable=True),
        sa.Column('diferenca', sa.Numeric(14, 2), nullable=True),
        sa.Column('status', sa.String(length=20), server_default='aberto', nullable=False),
        sa.Column('observacao', sa.Text(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('NOW()'), nullable=True),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('NOW()'), nullable=True),
        sa.ForeignKeyConstraint(['loja_id'], ['lojas.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['usuario_abertura_id'], ['usuarios.id']),
        sa.ForeignKeyConstraint(['usuario_fechamento_id'], ['usuarios.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('loja_id', 'data_caixa', name='uq_caixa_loja_dia'), # <- AGORA FUNCIONA
        sa.CheckConstraint("status IN ('aberto', 'fechado')", name='ck_caixa_status')
    )
    op.create_index('idx_caixa_loja_data', 'caixa', ['loja_id', 'data_abertura'])
    op.create_index('idx_caixa_status', 'caixa', ['status'])

    # TRIGGER PARA CALCULAR saldo_esperado e diferenca
    op.execute("""
    CREATE OR REPLACE FUNCTION calc_caixa_totais()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.saldo_esperado := NEW.saldo_abertura + NEW.total_entradas - NEW.total_saidas;
        IF NEW.saldo_contado IS NOT NULL THEN
            NEW.diferenca := NEW.saldo_contado - NEW.saldo_esperado;
        ELSE
            NEW.diferenca := NULL;
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """)

    op.execute("""
    CREATE TRIGGER trigger_calc_caixa
    BEFORE INSERT OR UPDATE ON caixa
    FOR EACH ROW EXECUTE FUNCTION calc_caixa_totais();
    """)

    # TABELA MOVIMENTACAO_CAIXA
    op.create_table(
        'movimentacao_caixa',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('caixa_id', sa.UUID(), nullable=False),
        sa.Column('loja_id', sa.UUID(), nullable=False),
        sa.Column('tipo', sa.String(length=20), nullable=False),
        sa.Column('valor', sa.Numeric(14, 2), nullable=False),
        sa.Column('descricao', sa.Text(), nullable=False),
        sa.Column('referencia_id', sa.UUID(), nullable=True),
        sa.Column('referencia_tipo', sa.String(length=50), nullable=True),
        sa.Column('usuario_id', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('NOW()'), nullable=True),
        sa.ForeignKeyConstraint(['caixa_id'], ['caixa.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['loja_id'], ['lojas.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint("tipo IN ('entrada', 'saida', 'sangria', 'abertura')", name='ck_mov_tipo')
    )
    op.create_index('idx_mov_caixa_caixa_id', 'movimentacao_caixa', ['caixa_id'])
    op.create_index('idx_mov_caixa_loja_data', 'movimentacao_caixa', ['loja_id', 'created_at'])

def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DROP TRIGGER IF EXISTS trigger_calc_caixa ON caixa")
    op.execute("DROP FUNCTION IF EXISTS calc_caixa_totais")
    op.drop_table('movimentacao_caixa')
    op.drop_table('caixa')
