from rest_framework import viewsets, permissions, filters
from django.http import HttpResponse
from django.utils.encoding import escape_uri_path
from .models import Tax, Customer, Supplier, Lead, Employee
from .serializers import TaxSerializer, CustomerSerializer, SupplierSerializer, LeadSerializer, EmployeeSerializer

TEMPLATES = {
  'taxes': 'tax_name,tax_rate,is_recoverable\nVAT,12.00,true',
  'customers': 'customer_name,email,phone,address\nAcme Inc,acme@example.com,+639000000000,123 Street',
  'suppliers': 'supplier_name,email,phone,address\nSupplier A,a@b.com,+639000000001,456 Road',
  'leads': 'lead_name,email,phone,status,notes\nLead Name,lead@example.com,+639000000002,NEW,Interested',
  'employees': 'full_name,email,phone,department,job_title,hire_date\nJuan Dela Cruz,juan@example.com,+639000000003,Sales,Sales Rep,2024-01-01',
}

class TaxViewSet(viewsets.ModelViewSet):
    queryset = Tax.objects.all()
    serializer_class = TaxSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['tax_name']
    ordering_fields = ['tax_name', 'tax_rate', 'created_at']

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['customer_name', 'email', 'phone']
    ordering_fields = ['customer_name', 'created_at']

class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['supplier_name', 'email', 'phone']
    ordering_fields = ['supplier_name', 'created_at']

class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['lead_name', 'email', 'phone']
    ordering_fields = ['-created_at', 'lead_name']

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['full_name', 'email', 'job_title']
    ordering_fields = ['full_name', 'hire_date']

    @action(detail=False, methods=['get'], url_path='template')
    def template(self, request, *args, **kwargs):
        template = TEMPLATES.get('employees', 'full_name,email,phone,department,job_title,hire_date')
        response = HttpResponse(template, content_type='text/csv')
        response['Content-Disposition'] = f"attachment; filename*=UTF-8''{escape_uri_path('employees_template.csv')}"
        return response
