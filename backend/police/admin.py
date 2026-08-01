from django.contrib import admin
from .models import PoliceDispatch


@admin.register(PoliceDispatch)
class PoliceDispatchAdmin(admin.ModelAdmin):
    list_display = (
        'dispatch_number',
        'vehicle_plate',
        'driver_name',
        'threat_type',
        'risk_score',
        'status',
        'timestamp',
    )
    list_filter = ('status', 'threat_type', 'timestamp')
    search_fields = ('dispatch_number', 'vehicle_plate', 'driver_name', 'address', 'sha256_hash')
    readonly_fields = ('id', 'timestamp', 'created_at', 'sha256_hash')
