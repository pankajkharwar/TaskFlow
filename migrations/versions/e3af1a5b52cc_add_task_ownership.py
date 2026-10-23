
"""Add task ownership

Revision ID: e3af1a5b52cc
Revises: 3b4295c273df
Create Date: 2026-10-24 00:54:54.330303
"""

from alembic import op
import sqlalchemy as sa


# Revision identifiers used by Alembic
revision = "e3af1a5b52cc"
down_revision = "3b4295c273df"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("tasks") as batch_op:
        batch_op.add_column(
            sa.Column("user_id", sa.Integer(), nullable=True)
        )
        batch_op.create_foreign_key(
            "fk_tasks_user_id_users",
            "users",
            ["user_id"],
            ["id"]
        )


def downgrade():
    with op.batch_alter_table("tasks") as batch_op:
        batch_op.drop_constraint(
            "fk_tasks_user_id_users",
            type_="foreignkey"
        )
        batch_op.drop_column("user_id")
