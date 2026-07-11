from django.contrib import admin

from evidence.models import Evidence, TimelineEvent


class TimelineEventInline(admin.TabularInline):
    model = TimelineEvent
    extra = 0


@admin.register(Evidence)
class EvidenceAdmin(admin.ModelAdmin):
    list_display = ("id", "vehicle", "uploaded_at", "processed", "locked", "sha256_hash")
    inlines = [TimelineEventInline]
