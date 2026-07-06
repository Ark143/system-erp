from django.db import models

class CompanyConfig(models.Model):
    company_id = models.CharField(max_length=64, primary_key=True)
    company_name = models.CharField(max_length=255)
    abbreviation = models.CharField(max_length=5, unique=True)
    auto_company_id = models.BooleanField(default=True)
    parent_company = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subsidiaries')
    is_group = models.BooleanField(default=False)
    
    # Identity & Localization
    legal_name = models.CharField(max_length=255, blank=True, default='')
    trade_name = models.CharField(max_length=255, blank=True, default='')
    company_type = models.CharField(max_length=64, blank=True, default='')
    registration_number = models.CharField(max_length=128, blank=True, default='')
    tax_registration_number = models.CharField(max_length=128, blank=True, default='')
    date_of_incorporation = models.DateField(null=True, blank=True)
    country = models.CharField(max_length=64, default='US')
    state = models.CharField(max_length=64, blank=True, default='')
    city = models.CharField(max_length=64, blank=True, default='')
    address = models.TextField(blank=True, default='')
    phone = models.CharField(max_length=20, blank=True, default='')
    email = models.EmailField(max_length=255, blank=True, default='')
    website = models.URLField(blank=True, default='')
    timezone = models.CharField(max_length=32, blank=True, default='UTC')
    
    # Accounting defaults
    base_currency = models.ForeignKey('governance.Currency', on_delete=models.PROTECT, related_name='company_base_currencies', null=True, blank=True)
    default_valuation_method = models.CharField(max_length=20, choices=[('FIFO','FIFO'),('LIFO','LIFO'),('AVCO','AVCO'),('STANDARD','STANDARD')], default='AVCO')
    unrealized_profit_loss_account = models.CharField(max_length=64, blank=True, default='')
    default_bank_account = models.CharField(max_length=64, blank=True, default='')
    default_cash_account = models.CharField(max_length=64, blank=True, default='')
    default_receivable_account = models.CharField(max_length=64, blank=True, default='')
    default_payable_account = models.CharField(max_length=64, blank=True, default='')
    
    # Warehouses
    default_stock_warehouse = models.ForeignKey('governance.Warehouse', on_delete=models.SET_NULL, null=True, blank=True, related_name='default_stock_companies')
    default_manufacturing_warehouse = models.ForeignKey('governance.Warehouse', on_delete=models.SET_NULL, null=True, blank=True, related_name='default_manufacturing_companies')
    
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.company_name

class Branch(models.Model):
    branch_id = models.CharField(max_length=64, primary_key=True)
    company = models.ForeignKey(CompanyConfig, on_delete=models.CASCADE, related_name='branches')
    branch_name = models.CharField(max_length=255)
    branch_timezone = models.CharField(max_length=64, default='UTC')

    def __str__(self):
        return self.branch_name

class Warehouse(models.Model):
    warehouse_id = models.CharField(max_length=64, primary_key=True)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='warehouses')
    warehouse_name = models.CharField(max_length=255)
    is_virtual = models.BooleanField(default=False)

    def __str__(self):
        return self.warehouse_name

class DecimalConfig(models.Model):
    config_id = models.CharField(max_length=64, primary_key=True)
    company = models.ForeignKey(CompanyConfig, on_delete=models.CASCADE, related_name='decimal_configs', null=True, blank=True)
    currency_decimals = models.PositiveSmallIntegerField(default=2)
    quantity_decimals = models.PositiveSmallIntegerField(default=4)
    price_decimals = models.PositiveSmallIntegerField(default=4)

    def __str__(self):
        return self.config_id

class Currency(models.Model):
    currency_id = models.CharField(max_length=16, primary_key=True)
    currency_symbol = models.CharField(max_length=8, blank=True, default='')

    def __str__(self):
        return self.currency_id

class CurrencyExchangeRate(models.Model):
    rate_id = models.BigAutoField(primary_key=True)
    from_currency = models.ForeignKey(Currency, on_delete=models.PROTECT, related_name='outbound_rates')
    to_currency = models.ForeignKey(Currency, on_delete=models.PROTECT, related_name='inbound_rates')
    rate_date = models.DateField()
    exchange_rate = models.DecimalField(max_digits=18, decimal_places=8)

    class Meta:
        unique_together = ('from_currency', 'to_currency', 'rate_date')

    def __str__(self):
        return f'{self.from_currency}->{self.to_currency} {self.rate_date}'

class FiscalPeriod(models.Model):
    period_id = models.CharField(max_length=64, primary_key=True)
    company = models.ForeignKey(CompanyConfig, on_delete=models.CASCADE, related_name='fiscal_periods', null=True, blank=True)
    period_name = models.CharField(max_length=128)
    start_date = models.DateField()
    end_date = models.DateField()
    is_globally_locked = models.BooleanField(default=False)

    def __str__(self):
        return self.period_name

class ModulePeriodLock(models.Model):
    lock_id = models.BigAutoField(primary_key=True)
    period = models.ForeignKey(FiscalPeriod, on_delete=models.CASCADE, related_name='module_locks')
    module_name = models.CharField(max_length=64)
    is_locked = models.BooleanField(default=False)

    class Meta:
        unique_together = ('period', 'module_name')

    def __str__(self):
        return f'{self.period}:{self.module_name}'

class GLDefaultAccount(models.Model):
    config_id = models.CharField(max_length=64, primary_key=True)
    company = models.ForeignKey(CompanyConfig, on_delete=models.CASCADE, related_name='gl_defaults', null=True, blank=True)
    ar_default_account = models.CharField(max_length=64, blank=True, default='')
    ap_default_account = models.CharField(max_length=64, blank=True, default='')
    revenue_default_account = models.CharField(max_length=64, blank=True, default='')
    cogs_default_account = models.CharField(max_length=64, blank=True, default='')
    inventory_asset_account = models.CharField(max_length=64, blank=True, default='')
    tax_payable_account = models.CharField(max_length=64, blank=True, default='')
    tax_receivable_account = models.CharField(max_length=64, blank=True, default='')
    fx_gain_loss_account = models.CharField(max_length=64, blank=True, default='')
    inventory_adjustment_account = models.CharField(max_length=64, blank=True, default='')

    def __str__(self):
        return self.config_id

class StockBalance(models.Model):
    balance_id = models.BigAutoField(primary_key=True)
    item = models.ForeignKey('inventory.Item', on_delete=models.CASCADE, related_name='stock_balances')
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name='stock_balances')
    quantity_on_hand = models.DecimalField(max_digits=18, decimal_places=6, default=0)
    quantity_reserved = models.DecimalField(max_digits=18, decimal_places=6, default=0)
    quantity_available = models.DecimalField(max_digits=18, decimal_places=6, default=0)
    average_unit_cost = models.DecimalField(max_digits=18, decimal_places=6, default=0)

    class Meta:
        unique_together = ('item', 'warehouse')

    def __str__(self):
        return f'{self.item}:{self.warehouse}'

class ItemCategory(models.Model):
    category_id = models.BigAutoField(primary_key=True)
    company = models.ForeignKey(CompanyConfig, on_delete=models.CASCADE, related_name='item_categories', null=True, blank=True)
    category_name = models.CharField(max_length=255)
    valuation_method = models.CharField(max_length=20, choices=[('FIFO','FIFO'),('LIFO','LIFO'),('AVCO','AVCO'),('STANDARD','STANDARD'),('INHERIT','INHERIT')], default='INHERIT')

    def __str__(self):
        return self.category_name

class InventoryCostLayer(models.Model):
    layer_id = models.BigAutoField(primary_key=True)
    company = models.ForeignKey(CompanyConfig, on_delete=models.CASCADE, related_name='cost_layers', null=True, blank=True)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name='cost_layers')
    item = models.ForeignKey('inventory.Item', on_delete=models.CASCADE, related_name='cost_layers')
    source_receipt_id = models.CharField(max_length=128, blank=True, default='')
    layer_date = models.DateTimeField()
    received_quantity = models.DecimalField(max_digits=18, decimal_places=6)
    remaining_quantity = models.DecimalField(max_digits=18, decimal_places=6)
    unit_cost = models.DecimalField(max_digits=18, decimal_places=6)
    is_fully_consumed = models.BooleanField(default=False)

    def __str__(self):
        return f'Layer {self.layer_id} - {self.item}'

class InventoryJournal(models.Model):
    inv_journal_id = models.BigAutoField(primary_key=True)
    item = models.ForeignKey('inventory.Item', on_delete=models.CASCADE, related_name='inventory_journals')
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name='inventory_journals')
    cost_layer = models.ForeignKey(InventoryCostLayer, on_delete=models.SET_NULL, null=True, blank=True, related_name='journals')
    source_document_type = models.CharField(max_length=64)
    source_document_id = models.CharField(max_length=128, blank=True, default='')
    quantity_delta = models.DecimalField(max_digits=18, decimal_places=6)
    unit_cost = models.DecimalField(max_digits=18, decimal_places=6)
    total_valuation_delta = models.DecimalField(max_digits=18, decimal_places=6)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Journal {self.inv_journal_id}'

class CycleCount(models.Model):
    STATUS_DRAFT = 'DRAFT'
    STATUS_COUNTING = 'COUNTING'
    STATUS_RECONCILED = 'RECONCILED'

    STATUS_CHOICES = [
        (STATUS_DRAFT, 'Draft'),
        (STATUS_COUNTING, 'Counting'),
        (STATUS_RECONCILED, 'Reconciled'),
    ]

    cycle_count_id = models.BigAutoField(primary_key=True)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name='cycle_counts')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    scheduled_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f'CycleCount {self.cycle_count_id}'

class CycleCountItem(models.Model):
    count_item_id = models.BigAutoField(primary_key=True)
    cycle_count = models.ForeignKey(CycleCount, on_delete=models.CASCADE, related_name='items')
    item = models.ForeignKey('inventory.Item', on_delete=models.CASCADE, related_name='cycle_count_items')
    system_quantity = models.DecimalField(max_digits=18, decimal_places=6)
    counted_quantity = models.DecimalField(max_digits=18, decimal_places=6, null=True, blank=True)
    variance_quantity = models.DecimalField(max_digits=18, decimal_places=6, null=True, blank=True)
    adjustment_journal_entry_id = models.CharField(max_length=128, blank=True, default='')

    def __str__(self):
        return f'CycleCountItem {self.count_item_id}'

class AuditTrail(models.Model):
    audit_id = models.BigAutoField(primary_key=True)
    company = models.ForeignKey(CompanyConfig, on_delete=models.CASCADE, related_name='audit_trails', null=True, blank=True)
    user = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_trails')
    table_name = models.CharField(max_length=128)
    record_id = models.CharField(max_length=128)
    action_type = models.CharField(max_length=16, choices=[('INSERT','INSERT'),('UPDATE','UPDATE'),('DELETE','DELETE')])
    old_values_json = models.JSONField(null=True, blank=True)
    new_values_json = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Audit {self.audit_id}'

class Role(models.Model):
    role_id = models.BigAutoField(primary_key=True)
    role_name = models.CharField(max_length=128, unique=True)

    def __str__(self):
        return self.role_name

class UserCompanyAssignment(models.Model):
    assignment_id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='company_assignments')
    company = models.ForeignKey(CompanyConfig, on_delete=models.CASCADE, related_name='user_assignments')
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True, related_name='user_assignments')

    class Meta:
        unique_together = ('user', 'company')

    def __str__(self):
        return f'{self.user} -> {self.company}'

class Permission(models.Model):
    permission_id = models.CharField(max_length=128, primary_key=True)
    module_name = models.CharField(max_length=64)

    def __str__(self):
        return self.permission_id

class RolePermission(models.Model):
    role_permission_id = models.BigAutoField(primary_key=True)
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='permissions')
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE, related_name='roles')

    class Meta:
        unique_together = ('role', 'permission')

    def __str__(self):
        return f'{self.role}:{self.permission}'
