from rest_framework import serializers
from .models import PaymentEntry, BankReconciliation, BankReconciliationLine

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
