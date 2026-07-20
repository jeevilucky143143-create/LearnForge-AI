"""Add error_message column to uploaded_pdfs

Revision ID: c93c13310de3
Revises: a5da15ca8c5d
Create Date: 2026-07-20 10:49:35.718228

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c93c13310de3'
down_revision: Union[str, None] = 'a5da15ca8c5d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('uploaded_pdfs', sa.Column('error_message', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('uploaded_pdfs', 'error_message')
