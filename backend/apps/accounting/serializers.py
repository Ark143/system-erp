from rest_framework import serializers
from .models import Account, JournalEntry, JournalEntryLine, FiscalYear

class AccountSerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(source='parent.name', read_only=True)

    class Meta:
        model = Account
        fields = ['id', 'code', 'name', 'account_type', 'nature', 'parent', 'parent_name', 'is_active', 'created_at', 'updated_at', 'created_by']
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']

class JournalEntryLineSerializer(serializers.ModelSerializer):
    account_code = serializers.CharField(source='account.code', read_only=True)
    account_name = serializers.CharField(source='account.name', read_only=True)

    class Meta:
        model = JournalEntryLine
        fields = ['id', 'journal_entry', 'account', 'account_code', 'account_name', 'description', 'debit', 'credit', 'created_at']
        read_only_fields = ['id', 'journal_entry', 'created_at']

    def validate(self, attrs):
        d = attrs.get('debit', 0)
        c = attrs.get('credit', 0)
        if d < 0 or c < 0:
            raise serializers.ValidationError('NEGATIVE_AMOUNT')
        if d > 0 and c > 0:
            raise serializers.ValidationError('DEBIT_CREDIT_CONFLICT')
        if d == 0 and c == 0:
            raise serializers.ValidationError('ZERO_AMOUNT')
        return attrs

class JournalEntrySerializer(serializers.ModelSerializer):
    lines = JournalEntryLineSerializer(many=True)

    class Meta:
        model = JournalEntry
        fields = ['id', 'je_no', 'journal_date', 'status', 'reference_type', 'reference_id', 'description', 'total_debit', 'total_credit', 'created_at', 'updated_at', 'created_by', 'approved_by', 'lines']
        read_only_fields = ['id', 'je_no', 'total_debit', 'total_credit', 'created_at', 'updated_at', 'created_by', 'approved_by']

    def create(self, validated_data):
        lines_data = validated_data.pop('lines', [])
        je = JournalEntry.objects.create(**validated_data)
        for line_data in lines_data:
            JournalEntryLine.objects.create(journal_entry=je, **line_data)
        je.total_debit = sum(l.debit for l in je.lines.all())
        je.total_credit = sum(l.credit for l in je.lines.all())
        je.save(update_fields=['total_debit', 'total_credit'])
        return je

class FiscalYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = FiscalYear
        fields = ['id', 'name', 'start_date', 'end_date', 'is_closed', 'closed_at', 'created_at']
        read_only_fields = ['id', 'created_at']
