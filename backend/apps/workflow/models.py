from django.db import models
from django.conf import settings

class Workflow(models.Model):
    name = models.CharField(max_length=100, unique=True)
    entity_type = models.CharField(max_length=50, help_text='e.g., SalesOrder, PurchaseOrder')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='workflows')

    class Meta:
        ordering = ['name']
        indexes = [models.Index(fields=['entity_type', 'is_active'])]

    def __str__(self):
        return f"{self.name} ({self.entity_type})"


class WorkflowStep(models.Model):
    workflow = models.ForeignKey('workflow.Workflow', on_delete=models.CASCADE, related_name='steps')
    name = models.CharField(max_length=100)
    order = models.IntegerField(default=0)
    approver_role = models.CharField(max_length=20, blank=True)
    approver_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='workflow_steps')
    is_required = models.BooleanField(default=True)

    class Meta:
        ordering = ['order']
        indexes = [models.Index(fields=['workflow', 'order'])]
        unique_together = [['workflow', 'order']]

    def __str__(self):
        return f"{self.workflow.name} - {self.order}. {self.name}"


class Approval(models.Model):
    APPROVAL_STATUS_PENDING = 'PENDING'
    APPROVAL_STATUS_APPROVED = 'APPROVED'
    APPROVAL_STATUS_REJECTED = 'REJECTED'
    APPROVAL_STATUS_CANCELLED = 'CANCELLED'
    APPROVAL_STATUS_CHOICES = [
        (APPROVAL_STATUS_PENDING, 'Pending'),
        (APPROVAL_STATUS_APPROVED, 'Approved'),
        (APPROVAL_STATUS_REJECTED, 'Rejected'),
        (APPROVAL_STATUS_CANCELLED, 'Cancelled'),
    ]
    workflow = models.ForeignKey('workflow.Workflow', on_delete=models.PROTECT, related_name='approvals')
    step = models.ForeignKey('workflow.WorkflowStep', on_delete=models.PROTECT, related_name='approvals')
    entity_type = models.CharField(max_length=50, db_index=True)
    entity_id = models.CharField(max_length=50, db_index=True)
    status = models.CharField(max_length=20, choices=APPROVAL_STATUS_CHOICES, default=APPROVAL_STATUS_PENDING)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approvals')
    notes = models.TextField(blank=True)
    decided_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['entity_type', 'entity_id', 'status']),
            models.Index(fields=['assigned_to', 'status']),
        ]
        unique_together = [['entity_type', 'entity_id', 'step']]

    def __str__(self):
        return f"{self.workflow.name} / {self.entity_type}:{self.entity_id} / step {self.step.order}"
