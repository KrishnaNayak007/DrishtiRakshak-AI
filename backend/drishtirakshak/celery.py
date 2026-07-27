import os
from celery import Celery

# Set default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'drishtirakshak.settings')

app = Celery('drishtirakshak')

# Load settings from Django settings using a CELERY_ namespace
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks from all registered Django apps
app.autodiscover_tasks()