"""Add Phase 4 PDF columns

Revision ID: a5da15ca8c5d
Revises: e1d16511d6b5
Create Date: 2026-07-18 19:03:04.136860

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a5da15ca8c5d'
down_revision: Union[str, None] = 'e1d16511d6b5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new enum value for 'uploaded'
    op.execute("ALTER TYPE pdfstatus ADD VALUE IF NOT EXISTS 'uploaded'")
    
    op.drop_index(op.f('ix_quizzes_course_id'), table_name='quizzes')
    op.create_index(op.f('ix_quizzes_course_id'), 'quizzes', ['course_id'], unique=True)
    op.add_column('uploaded_pdfs', sa.Column('original_filename', sa.String(), nullable=True))
    op.add_column('uploaded_pdfs', sa.Column('storage_path', sa.String(), nullable=False))
    op.add_column('uploaded_pdfs', sa.Column('mime_type', sa.String(), nullable=False))


def downgrade() -> None:
    op.drop_column('uploaded_pdfs', 'mime_type')
    op.drop_column('uploaded_pdfs', 'storage_path')
    op.drop_column('uploaded_pdfs', 'original_filename')
    op.drop_index(op.f('ix_quizzes_course_id'), table_name='quizzes')
    op.create_index(op.f('ix_quizzes_course_id'), 'quizzes', ['course_id'], unique=False)
    # Note: Postgres doesn't easily support dropping an enum value
