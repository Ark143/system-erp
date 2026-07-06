from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from .models import DocumentControlSetting
from .serializers import DocumentControlSettingSerializer

class DocumentControlSettingViewSet(viewsets.ModelViewSet):
    queryset = DocumentControlSetting.objects.all()
    serializer_class = DocumentControlSettingSerializer
    permission_classes = [permissions.IsAuthenticated, ModuleRBAC('settings')]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['prefix', 'series_code', 'note']
    ordering_fields = ['prefix', 'company', 'updated_at']

    def perform_create(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

