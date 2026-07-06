from django.db import models
from django.conf import settings

class Warehouse(models.Model):
    class WarehouseType(models.TextChoices):
        MAIN = 'MAIN', 'Main Warehouse'
        BRANCH = 'BRANCH', 'Branch'
        SUB = 'SUB', 'Sub Warehouse'
        VIRTUAL = 'VIRTUAL', 'Virtual'

    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        INACTIVE = 'INACTIVE', 'Inactive'
        HOLD = 'HOLD', 'Hold'

    code = models.CharField(max_length=20, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    address = models.CharField(max_length=255, blank=True)
    warehouse_type = models.CharField(max_length=20, choices=WarehouseType.choices, default=WarehouseType.MAIN)
    branch = models.CharField(max_length=100, blank=True)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='sub_warehouses')
    cost_center = models.CharField(max_length=100, blank=True)
    profit_center = models.CharField(max_length=100, blank=True)
    gl_account = models.CharField(max_length=50, blank=True)
    contact_person = models.CharField(max_length=100, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_warehouses')

    class Meta:
        ordering = ['code']
        indexes = [models.Index(fields=['code']), models.Index(fields=['status']), models.Index(fields=['branch'])]

    def __str__(self):
        return f"{self.code} - {self.name}"


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
    warehouse = models.CharField(max_length=20, choices=Warehouse.WarehouseType.choices, default=Warehouse.WarehouseType.MAIN)
    qty_on_hand = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    reorder_level = models.DecimalField(max_digits=10, decimal_places=2, default=10)
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    selling_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='inventory_items')
    purchase_gl_account = models.CharField(max_length=50, blank=True)
    sales_gl_account = models.CharField(max_length=50, blank=True)
    default_warehouse = models.CharField(max_length=20, choices=Warehouse.WarehouseType.choices, blank=True)
    item_tax = models.CharField(max_length=50, blank=True)
    withholding_tax = models.CharField(max_length=50, blank=True)
    uom_conversion_rate = models.DecimalField(max_digits=10, decimal_places=4, default=1)
    cost_center = models.CharField(max_length=100, blank=True)
    profit_center = models.CharField(max_length=100, blank=True)
    is_fixed_asset = models.BooleanField(default=False)
    is_inventory_item = models.BooleanField(default=True)
    is_purchase_item = models.BooleanField(default=True)
    is_sales_item = models.BooleanField(default=True)
    is_service = models.BooleanField(default=False)

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
    warehouse = models.CharField(max_length=20, choices=Warehouse.WarehouseType.choices, default=Warehouse.WarehouseType.MAIN)
    source_warehouse = models.CharField(max_length=20, choices=Warehouse.WarehouseType.choices, default=Warehouse.WarehouseType.MAIN)
    target_warehouse = models.CharField(max_length=20, choices=Warehouse.WarehouseType.choices, default=Warehouse.WarehouseType.MAIN)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [models.Index(fields=['item', 'created_at']), models.Index(fields=['warehouse', 'created_at']), models.Index(fields=['move_type']), models.Index(fields=['source_warehouse', 'target_warehouse'])]

    def __str__(self):
        return f"{self.item.sku} - {self.move_type} {self.qty}"


class InventorySettings(models.Model):
    ITEM_NAMING_AUTO = 'AUTO'
    ITEM_NAMING_MANUAL = 'MANUAL'
    ITEM_NAMING_CHOICES = [
        (ITEM_NAMING_AUTO, 'Automatic Naming Series'),
        (ITEM_NAMING_MANUAL, 'Direct Item Code'),
    ]

    VALUATION_FIFO = 'FIFO'
    VALUATION_LIFO = 'LIFO'
    VALUATION_AVCO = 'AVCO'
    VALUATION_STANDARD = 'STANDARD'
    VALUATION_CHOICES = [
        (VALUATION_FIFO, 'FIFO'),
        (VALUATION_LIFO, 'LIFO'),
        (VALUATION_AVCO, 'AVCO'),
        (VALUATION_STANDARD, 'Standard'),
    ]

    company = models.ForeignKey('governance.CompanyConfig', on_delete=models.SET_NULL, null=True, blank=True, related_name='inventory_settings')
    item_naming_method = models.CharField(max_length=20, choices=ITEM_NAMING_CHOICES, default=ITEM_NAMING_AUTO)
    default_item_group = models.ForeignKey('inventory.Category', on_delete=models.SET_NULL, null=True, blank=True, related_name='inventory_settings')
    default_valuation_method = models.CharField(max_length=20, choices=VALUATION_CHOICES, default=VALUATION_AVCO)
    default_uom = models.CharField(max_length=20, default='PC')
    default_warehouse = models.ForeignKey('inventory.Warehouse', on_delete=models.SET_NULL, null=True, blank=True, related_name='inventory_default_settings')
    sample_retention_warehouse = models.ForeignKey('inventory.Warehouse', on_delete=models.SET_NULL, null=True, blank=True, related_name='inventory_sample_settings')
    allow_negative_stock = models.BooleanField(default=False)
    allow_negative_stock_per_batch = models.BooleanField(default=False)
    over_delivery_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    over_transfer_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    role_allowed_to_over_deliver = models.CharField(max_length=64, blank=True, default='')
    allow_edit_rate_quantity_in_stock_transactions = models.BooleanField(default=False)
    auto_insert_item_price = models.BooleanField(default=False)
    auto_re_order = models.BooleanField(default=False)
    enable_stock_reservation = models.BooleanField(default=False)
    auto_reserve_stock = models.BooleanField(default=False)
    use_reservation_agent_for_validation = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='inventory_settings_updates')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['company', 'is_active']),
        ]
        verbose_name = 'Inventory Settings'
        verbose_name_plural = 'Inventory Settings'

    def __str__(self):
        label = self.company_id or 'Global'
        return f'Inventory Settings - {label}'
