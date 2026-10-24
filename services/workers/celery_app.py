import os
from celery import Celery
app = Celery("pustaka", broker=os.environ.get("REDIS_URL","redis://localhost:6379/0"), backend=os.environ.get("REDIS_URL","redis://localhost:6379/0"))
app.conf.task_always_eager = os.environ.get("CELERY_TASK_ALWAYS_EAGER","true").lower() in ("1","true","yes")

app.conf.imports = ("workers.tasks",)
app.conf.broker_connection_retry_on_startup = True

app.conf.beat_schedule = {
    "content-queue": {"task": "drain_content_queue", "schedule": 15.0},
    "daily-database-backup": {"task": "backup_database", "schedule": 86400.0},
}
