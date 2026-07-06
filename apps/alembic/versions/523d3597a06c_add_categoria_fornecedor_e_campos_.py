"""add categoria fornecedor e campos produto v2

Revision ID: 523d3597a06c
Revises: c8cec5181093
Create Date: 2026-07-04 16:24:53.825119

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql # ADICIONADO

# revision identifiers, used by Alembic.
revision: str = '523d3597a06c'
down_revision: Union[str, Sequence[str], None] = 'c8cec5181093'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# CRIAR O ENUM UMA VEZ SÓ
unidade_enum = postgresql.ENUM('UN', 'KG', 'CX', 'GRADE', 'CESTA', 'PCT', 'LT', 'MT', name='unidadeenum')

def upgrade() -> None:
    """Upgrade schema."""
    # ### 1. CRIAR ENUM PRIMEIRO ###
    unidade_enum.create(op.get_bind())

    # ### 2. CRIAR TABELA CATEGORIAS ###
    op.create_table('categorias',
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False), # CORRIGIDO
    sa.Column('loja_id', postgresql.UUID(as_uuid=True), nullable=False), # CORRIGIDO
    sa.Column('nome', sa.String(length=100), nullable=False),
    sa.Column('slug', sa.String(length=50), nullable=True), # Adicionei pra bater com model
    sa.Column('descricao', sa.Text(), nullable=True),
    sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False), # Adicionei
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['loja_id'], ['lojas.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_categorias_loja_id'), 'categorias', ['loja_id'], unique=False)
    op.create_index(op.f('ix_categorias_slug'), 'categorias', ['slug'], unique=True) # Adicionei

    # ### 3. CRIAR TABELA FORNECEDORES ###
    op.create_table('fornecedores',
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False), # CORRIGIDO
    sa.Column('loja_id', postgresql.UUID(as_uuid=True), nullable=False), # CORRIGIDO
    sa.Column('nome', sa.String(length=150), nullable=False),
    sa.Column('cnpj', sa.String(length=20), nullable=True), # Adicionei
    sa.Column('telefone', sa.String(length=20), nullable=True),
    sa.Column('email', sa.String(length=100), nullable=True),
    sa.Column('endereco', sa.String(length=255), nullable=True), # Adicionei
    sa.Column('observacao', sa.Text(), nullable=True), # Adicionei
    sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False), # Adicionei
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['loja_id'], ['lojas.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_fornecedores_loja_id'), 'fornecedores', ['loja_id'], unique=False)

    # ### 4. ATUALIZAR TABELA PRODUTOS ###
    op.add_column('produtos', sa.Column('descricao', sa.Text(), nullable=True))
    op.add_column('produtos', sa.Column('categoria_id', postgresql.UUID(as_uuid=True), nullable=True)) # CORRIGIDO
    op.add_column('produtos', sa.Column('marca', sa.String(length=100), nullable=True))
    op.add_column('produtos', sa.Column('imagem_url', sa.String(length=255), nullable=True))
    op.add_column('produtos', sa.Column('codigo_barras', sa.String(length=50), nullable=True))
    op.add_column('produtos', sa.Column('codigo_qr', sa.String(length=255), nullable=True))
    op.add_column('produtos', sa.Column('ncm', sa.String(length=10), nullable=True))
    op.add_column('produtos', sa.Column('preco_compra', sa.Numeric(precision=10, scale=2), server_default='0', nullable=False)) # Default
    op.add_column('produtos', sa.Column('preco_venda', sa.Numeric(precision=10, scale=2), nullable=False))
    op.add_column('produtos', sa.Column('preco_promocao', sa.Numeric(precision=10, scale=2), nullable=True))
    op.add_column('produtos', sa.Column('margem_lucro', sa.Numeric(precision=5, scale=2), server_default='0', nullable=False)) # Default
    op.add_column('produtos', sa.Column('custo_medio', sa.Numeric(precision=10, scale=2), server_default='0', nullable=False)) # Default
    op.add_column('produtos', sa.Column('estoque_minimo', sa.Integer(), server_default='5', nullable=False)) # Default
    op.add_column('produtos', sa.Column('estoque_maximo', sa.Integer(), nullable=True))
    op.add_column('produtos', sa.Column('unidade', unidade_enum, server_default='UN', nullable=False)) # USANDO VARIAVEL DO ENUM
    op.add_column('produtos', sa.Column('peso_kg', sa.Numeric(precision=10, scale=3), nullable=True))
    op.add_column('produtos', sa.Column('fornecedor_id', postgresql.UUID(as_uuid=True), nullable=True)) # CORRIGIDO
    op.add_column('produtos', sa.Column('localizacao', sa.String(length=100), nullable=True))
    op.add_column('produtos', sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True))

    op.create_index(op.f('ix_produtos_categoria_id'), 'produtos', ['categoria_id'], unique=False)
    op.create_index(op.f('ix_produtos_codigo_barras'), 'produtos', ['codigo_barras'], unique=False)
    op.create_index(op.f('ix_produtos_loja_id'), 'produtos', ['loja_id'], unique=False)
    op.create_index(op.f('ix_produtos_nome'), 'produtos', ['nome'], unique=False)
    op.create_index(op.f('ix_produtos_sku'), 'produtos', ['sku'], unique=False)
    op.create_foreign_key(None, 'produtos', 'fornecedores', ['fornecedor_id'], ['id'], ondelete='SET NULL')
    op.create_foreign_key(None, 'produtos', 'categorias', ['categoria_id'], ['id'], ondelete='SET NULL')
    op.drop_column('produtos', 'preco')
    # ### end Alembic commands ###

def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('produtos', sa.Column('preco', sa.NUMERIC(precision=10, scale=2), autoincrement=False, nullable=False))
    op.drop_constraint(None, 'produtos', type_='foreignkey')
    op.drop_constraint(None, 'produtos', type_='foreignkey')
    op.drop_index(op.f('ix_produtos_sku'), table_name='produtos')
    op.drop_index(op.f('ix_produtos_nome'), table_name='produtos')
    op.drop_index(op.f('ix_produtos_loja_id'), table_name='produtos')
    op.drop_index(op.f('ix_produtos_codigo_barras'), table_name='produtos')
    op.drop_index(op.f('ix_produtos_categoria_id'), table_name='produtos')
    op.drop_column('produtos', 'deleted_at')
    op.drop_column('produtos', 'localizacao')
    op.drop_column('produtos', 'fornecedor_id')
    op.drop_column('produtos', 'peso_kg')
    op.drop_column('produtos', 'unidade')
    op.drop_column('produtos', 'estoque_maximo')
    op.drop_column('produtos', 'estoque_minimo')
    op.drop_column('produtos', 'custo_medio')
    op.drop_column('produtos', 'margem_lucro')
    op.drop_column('produtos', 'preco_promocao')
    op.drop_column('produtos', 'preco_venda')
    op.drop_column('produtos', 'preco_compra')
    op.drop_column('produtos', 'ncm')
    op.drop_column('produtos', 'codigo_qr')
    op.drop_column('produtos', 'codigo_barras')
    op.drop_column('produtos', 'imagem_url')
    op.drop_column('produtos', 'marca')
    op.drop_column('produtos', 'categoria_id')
    op.drop_column('produtos', 'descricao')
    op.drop_index(op.f('ix_fornecedores_loja_id'), table_name='fornecedores')
    op.drop_table('fornecedores')
    op.drop_index(op.f('ix_categorias_loja_id'), table_name='categorias')
    op.drop_index(op.f('ix_categorias_slug'), table_name='categorias') # Adicionei
    op.drop_table('categorias')

    # ### APAGAR ENUM POR ULTIMO ###
    unidade_enum.drop(op.get_bind())
