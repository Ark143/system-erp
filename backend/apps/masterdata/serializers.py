from rest_framework import serializers
from .models import Tax, Customer, Supplier, Lead, Employee

class TaxSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tax
        fields = ['id', 'tax_name', 'tax_rate', 'is_recoverable', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ['id', 'customer_name', 'email', 'phone', 'address', 'is_active', 'created_at', 'updated_at', 'created_by']
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']

class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ['id', 'supplier_name', 'email', 'phone', 'address', 'is_active', 'created_at', 'updated_at', 'created_by']
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']

class LeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lead
        fields = ['id', 'lead_name', 'email', 'phone', 'status', 'notes', 'created_at', 'updated_at', 'created_by']
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']

class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = ['id', 'full_name', 'email', 'phone', 'department', 'job_title', 'hire_date', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
