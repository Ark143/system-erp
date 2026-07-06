from rest_framework import serializers
from .models import Account, JournalEntry, JournalEntryLine, FiscalYear, PaymentEntry, BankReconciliation, BankReconciliationLine

class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = [
            'id', 'code', 'name', 'account_number', 'company', 'is_group',
            'parent', 'root_type', 'report_type', 'account_type',
            'account_currency', 'tax_rate', 'disabled', 'is_active'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class JournalEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = JournalEntry
        fields = ['id', 'je_no', 'journal_date', 'description', 'status', 'reference_id', 'total_debit', 'total_credit', 'created_by', 'approved_by', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class JournalEntryLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = JournalEntryLine
        fields = ['id', 'journal_entry', 'account', 'debit', 'credit', 'description']
        read_only_fields = ['id']

class FiscalYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = FiscalYear
        fields = ['id', 'name', 'start_date', 'end_date', 'is_closed', 'created_by', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class PaymentEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentEntry
        fields = ['id', 'pe_no', 'payment_type', 'status', 'payment_date', 'paid_to', 'account', 'amount', 'currency', 'reference', 'notes', 'created_at', 'created_by']
        read_only_fields = ['id', 'created_at', 'created_by']

class BankReconciliationSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankReconciliation
        fields = ['id', 'recon_no', 'account', 'recon_date', 'start_date', 'end_date', 'status', 'notes', 'created_at', 'created_by']
        read_only_fields = ['id', 'created_at', 'created_by']

class BankReconciliationLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankReconciliationLine
        fields = ['id', 'reconciliation', 'journal_entry', 'amount', 'cleared']
        read_only_fields = ['id']
