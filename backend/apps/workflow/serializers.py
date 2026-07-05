from rest_framework import serializers
from .models import Workflow, WorkflowStep, Approval

class WorkflowStepSerializer(serializers.ModelSerializer):
    approver_user_name = serializers.CharField(source='approver_user.get_full_name', read_only=True)

    class Meta:
        model = WorkflowStep
        fields = ['id', 'workflow', 'name', 'order', 'approver_role', 'approver_user', 'approver_user_name', 'is_required']
        read_only_fields = ['id', 'workflow']

class WorkflowSerializer(serializers.ModelSerializer):
    steps = WorkflowStepSerializer(many=True)

    class Meta:
        model = Workflow
        fields = ['id', 'name', 'entity_type', 'is_active', 'created_at', 'updated_at', 'created_by', 'steps']
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']

    def create(self, validated_data):
        steps_data = validated_data.pop('steps', [])
        workflow = Workflow.objects.create(**validated_data)
        for step_data in steps_data:
            WorkflowStep.objects.create(workflow=workflow, **step_data)
        return workflow

class ApprovalSerializer(serializers.ModelSerializer):
    workflow_name = serializers.CharField(source='workflow.name', read_only=True)
    step_name = serializers.CharField(source='step.name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)

    class Meta:
        model = Approval
        fields = ['id', 'workflow', 'workflow_name', 'step', 'step_name', 'entity_type', 'entity_id', 'status', 'assigned_to', 'assigned_to_name', 'notes', 'decided_at', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
