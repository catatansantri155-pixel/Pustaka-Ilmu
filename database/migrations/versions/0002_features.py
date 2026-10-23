"""features: glossary_terms, AIRun tokens, User.mfa_enabled, TranslationSegment.version

Revision ID: 0002
Revises: 0001
"""
revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None

import sqlalchemy as sa
from alembic import op

def upgrade():
    op.add_column("ai_runs", sa.Column("tokens_input", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("ai_runs", sa.Column("tokens_output", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("users", sa.Column("mfa_enabled", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("translation_segments", sa.Column("version", sa.Integer(), nullable=False, server_default="1"))
    op.create_table(
        "glossary_terms",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("term_ar", sa.String(), nullable=False, server_default=""),
        sa.Column("term_id", sa.String(), nullable=False, server_default=""),
        sa.Column("context", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

def downgrade():
    op.drop_table("glossary_terms")
    op.drop_column("translation_segments", "version")
    op.drop_column("users", "mfa_enabled")
    op.drop_column("ai_runs", "tokens_output")
    op.drop_column("ai_runs", "tokens_input")
