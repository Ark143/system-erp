from django.db import models
from django.conf import settings

class Tax(models.Model):
    tax_name = models.CharField(max_length=100, unique=True)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2)
    is_recoverable = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['tax_name']

    def __str__(self):
        return self.tax_name

class Customer(models.Model):
    customer_name = models.CharField(max_length=200)
    email = models.CharField(max_length=200, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='masterdata_customers')

    class Meta:
        ordering = ['customer_name']

    def __str__(self):
        return self.customer_name

class Supplier(models.Model):
    supplier_name = models.CharField(max_length=200)
    email = models.CharField(max_length=200, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='masterdata_suppliers')

    class Meta:
        ordering = ['supplier_name']

    def __str__(self):
        return self.supplier_name

class Lead(models.Model):
    STATUS_NEW = 'NEW'
    STATUS_CONTACTED = 'CONTACTED'
    STATUS_QUALIFIED = 'QUALIFIED'
    STATUS_CONVERTED = 'CONVERTED'
    STATUS_LOST = 'LOST'
    STATUS_CHOICES = [
        (STATUS_NEW, 'New'),
        (STATUS_CONTACTED, 'Contacted'),
        (STATUS_QUALIFIED, 'Qualified'),
        (STATUS_CONVERTED, 'Converted'),
        (STATUS_LOST, 'Lost'),
    ]
    lead_name = models.CharField(max_length=200)
    email = models.CharField(max_length=200, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_NEW)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='masterdata_leads')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.lead_name

class Employee(models.Model):
    full_name = models.CharField(max_length=200)
    email = models.CharField(max_length=200, unique=True)
    phone = models.CharField(max_length=20, blank=True)
    department = models.CharField(max_length=100, blank=True)
    job_title = models.CharField(max_length=100, blank=True)
    hire_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['full_name']

    def __str__(self):
        return self.full_name
