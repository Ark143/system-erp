from django.db import models
from django.conf import settings

class Warehouse(models.TextChoices):
    MAIN = 'MAIN', 'Main Warehouse'
    BRANCH_A = 'BRANCH_A', 'Branch A'
    BRANCH_B = 'BRANCH_B', 'Branch B'

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        indexes = [models.Index(fields=['name', 'is_active'])]

    def __str__(self):
        return self.name

class Item(models.Model):
    sku = models.CharField(max_length=30, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    category = models.ForeignKey('inventory.Category', on_delete=models.PROTECT, related_name='items')
    uom = models.CharField(max_length=20, default='PC')
    warehouse = models.CharField(max_length=20, choices=Warehouse.choices, default=Warehouse.MAIN)
    qty_on_hand = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    reorder_level = models.DecimalField(max_digits=10, decimal_places=2, default=10)
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    selling_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='inventory_items')

    class Meta:
        indexes = [
            models.Index(fields=['sku']),
            models.Index(fields=['category', 'is_active']),
            models.Index(fields=['qty_on_hand']),
        ]

    def __str__(self):
        return f"{self.sku} - {self.name}"

class StockMove(models.Model):
    MOVE_TYPE_IN = 'IN'
    MOVE_TYPE_OUT = 'OUT'
    MOVE_TYPE_CHOICES = [
        (MOVE_TYPE_IN, 'In'),
        (MOVE_TYPE_OUT, 'Out'),
    ]

    item = models.ForeignKey('inventory.Item', on_delete=models.PROTECT, related_name='stock_moves')
    move_type = models.CharField(max_length=3, choices=MOVE_TYPE_CHOICES)
    qty = models.DecimalField(max_digits=10, decimal_places=2)
    reference = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [models.Index(fields=['item', 'created_at'])]

    def __str__(self):
        return f"{self.item.sku} - {self.move_type} {self.qty}"
