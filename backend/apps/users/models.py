from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models import CharField, EmailField, TextField, ForeignKey, SET_NULL, BooleanField, DateTimeField
from django.utils import timezone

class Department(models.TextChoices):
    IT = 'IT', 'IT'
    SALES = 'SALES', 'Sales'
    PURCHASING = 'PURCHASING', 'Purchasing'
    ACCOUNTING = 'ACCOUNTING', 'Accounting'
    INVENTORY = 'INVENTORY', 'Inventory'
    OPERATIONS = 'OPERATIONS', 'Operations'

class Role(models.TextChoices):
    ADMIN = 'ADMIN', 'Admin'
    MANAGER = 'MANAGER', 'Manager'
    STAFF = 'STAFF', 'Staff'
    VIEWER = 'VIEWER', 'Viewer'

class User(AbstractUser):
    email = EmailField('email address', unique=True)
    department = CharField(max_length=30, choices=Department.choices, blank=True)
    role = CharField(max_length=20, choices=Role.choices, default=Role.STAFF)
    phone = CharField(max_length=20, blank=True)
    company = models.ForeignKey('governance.CompanyConfig', on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    is_active = BooleanField(default=True)
    last_login_at = DateTimeField(null=True, blank=True)
    created_at = DateTimeField(default=timezone.now)
    updated_at = DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        indexes = [
            models.Index(fields=['email', 'department', 'role']),
            models.Index(fields=['is_active', 'role']),
        ]

    def __str__(self):
        return f"{self.email} ({self.role})"

class AuditLog(models.Model):
    user = ForeignKey('users.User', on_delete=SET_NULL, null=True, blank=True)
    action = CharField(max_length=100)
    ip_address = CharField(max_length=45, blank=True)
    user_agent = TextField(blank=True)
    details = TextField(blank=True)
    created_at = DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-created_at']
        indexes = [models.Index(fields=['user', 'action', 'created_at'])]

    def __str__(self):
        return f"{self.user} - {self.action}"
