from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WorkflowViewSet, WorkflowStepViewSet, ApprovalViewSet

router = DefaultRouter()
router.register('workflows', WorkflowViewSet, basename='workflow')
router.register('workflow-steps', WorkflowStepViewSet, basename='workflowstep')
router.register('approvals', ApprovalViewSet, basename='approval')

urlpatterns = [
    path('', include(router.urls)),
]
