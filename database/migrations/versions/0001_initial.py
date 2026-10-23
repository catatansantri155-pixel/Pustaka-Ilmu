"""initial"""
revision = "0001"
down_revision = None
branch_labels = None
depends_on = None
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "..", "services", "api"))
from app.db import Base
from app import models  # noqa
def upgrade():
    from alembic import op
    Base.metadata.create_all(bind=op.get_bind())
def downgrade():
    from alembic import op
    Base.metadata.drop_all(bind=op.get_bind())
