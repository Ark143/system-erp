from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TaxViewSet, CustomerViewSet, SupplierViewSet, LeadViewSet, EmployeeViewSet

router = DefaultRouter()
router.register('taxes', TaxViewSet, basename='tax')
router.register('customers', CustomerViewSet, basename='customer')
router.register('suppliers', SupplierViewSet, basename='supplier')
router.register('leads', LeadViewSet, basename='lead')
router.register('employees', EmployeeViewSet, basename='employee')

urlpatterns = [
    path('', include(router.urls)),
]
