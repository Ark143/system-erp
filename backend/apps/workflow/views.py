from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from apps.users.rbac import ModuleRBAC
from .models import Workflow, WorkflowStep, Approval
from .serializers import WorkflowSerializer, WorkflowStepSerializer, ApprovalSerializer
class IsAdminOrManager(permissions.BasePermission):
    def has_permission(self, request, view):
        return getattr(request.user, 'role', None) in ('ADMIN', 'MANAGER') or request.user.is_staff
class WorkflowViewSet(viewsets.ModelViewSet):
    queryset = Workflow.objects.all()
    serializer_class = WorkflowSerializer
    permission_classes = [IsAdminOrManager, ModuleRBAC("workflow")]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'entity_type']
    ordering_fields = ['name', 'entity_type']
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
class WorkflowStepViewSet(viewsets.ModelViewSet):
    queryset = WorkflowStep.objects.select_related('workflow', 'approver_user').all()
    serializer_class = WorkflowStepSerializer
    permission_classes = [IsAdminOrManager, ModuleRBAC("workflow")]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['order']
class ApprovalViewSet(viewsets.ModelViewSet):
    queryset = Approval.objects.select_related('workflow', 'step', 'assigned_to').all()
    serializer_class = ApprovalSerializer
    permission_classes = [permissions.IsAuthenticated, ModuleRBAC("workflow")]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['entity_type', 'entity_id', 'workflow__name']
    ordering_fields = ['created_at']
    def get_queryset(self):
        qs = super().get_queryset()
        if getattr(self.request.user, 'role', None) != 'ADMIN' and not self.request.user.is_staff:
            qs = qs.filter(assigned_to=self.request.user)
        return qs
    @transaction.atomic
    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        status_value = request.data.get('status')
        notes = request.data.get('notes', '')
        if instance.status != Approval.APPROVAL_STATUS_PENDING:
            return Response({'detail': 'INVALID_STATUS'}, status=status.HTTP_400_BAD_REQUEST)
        if request.user != instance.assigned_to:
            return Response({'detail': 'NOT_ASSIGNED'}, status=status.HTTP_403_FORBIDDEN)
        if status_value not in (Approval.APPROVAL_STATUS_APPROVED, Approval.APPROVAL_STATUS_REJECTED):
            return Response({'detail': 'INVALID_STATUS'}, status=status.HTTP_400_BAD_REQUEST)
        instance.status = status_value
        instance.notes = notes
        instance.decided_at = timezone.now()
        instance.save(update_fields=['status', 'notes', 'decided_at', 'updated_at'])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
