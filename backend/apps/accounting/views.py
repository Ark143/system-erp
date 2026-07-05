from rest_framework import viewsets, permissions, filters, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from apps.users.rbac import ModuleRBAC
from .models import Account, JournalEntry, JournalEntryLine, FiscalYear, PaymentEntry, BankReconciliation, BankReconciliationLine, ExchangeRate, Currency, GLDefaultAccount
from .serializers import (
  AccountSerializer, JournalEntrySerializer, JournalEntryLineSerializer, FiscalYearSerializer,
  PaymentEntrySerializer, BankReconciliationSerializer, BankReconciliationLineSerializer,
)
class ExchangeRateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExchangeRate
        fields = ['id', 'from_currency', 'to_currency', 'rate', 'rate_date']
        read_only_fields = ['id']
class CurrencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Currency
        fields = ['id', 'code', 'name', 'symbol', 'is_active']
        read_only_fields = ['id']
class GLDefaultAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = GLDefaultAccount
        fields = ['id', 'account', 'account_type']
        read_only_fields = ['id']
class IsAdminOrAccountant(permissions.BasePermission):
    def has_permission(self, request, view):
        return getattr(request.user, 'role', None) in ('ADMIN', 'MANAGER') or request.user.is_staff
class AccountViewSet(viewsets.ModelViewSet):
    queryset = Account.objects.all()
    serializer_class = AccountSerializer
    permission_classes = [IsAdminOrAccountant, ModuleRBAC("accounting")]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['code', 'name']
    ordering_fields = ['code', 'name']
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
class JournalEntryViewSet(viewsets.ModelViewSet):
    queryset = JournalEntry.objects.select_related('created_by', 'approved_by').prefetch_related('lines', 'lines__account').all()
    serializer_class = JournalEntrySerializer
    permission_classes = [permissions.IsAuthenticated, ModuleRBAC("accounting")]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['je_no', 'description', 'reference_id']
    ordering_fields = ['journal_date', 'created_at']
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    @transaction.atomic
    def perform_update(self, serializer):
        instance = serializer.save()
        instance.total_debit = sum(l.debit for l in instance.lines.all())
        instance.total_credit = sum(l.credit for l in instance.lines.all())
        instance.save(update_fields=['total_debit', 'total_credit', 'updated_at'])
    @action(detail=True, methods=['post'])
    def post_entry(self, request, pk=None):
        je = self.get_object()
        if je.status != JournalEntry.JE_STATUS_DRAFT:
            return Response({'detail': 'INVALID_STATUS'}, status=status.HTTP_400_BAD_REQUEST)
        if je.total_debit != je.total_credit:
            return Response({'detail': 'UNBALANCED_ENTRY'}, status=status.HTTP_400_BAD_REQUEST)
        je.status = JournalEntry.JE_STATUS_POSTED
        je.approved_by = request.user
        je.save(update_fields=['status', 'approved_by', 'updated_at'])
        return Response({'status': je.status})
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        je = self.get_object()
        if je.status == JournalEntry.JE_STATUS_POSTED:
            return Response({'detail': 'CANNOT_CANCEL_POSTED'}, status=status.HTTP_400_BAD_REQUEST)
        je.status = JournalEntry.JE_STATUS_CANCELLED
        je.save(update_fields=['status', 'updated_at'])
        return Response({'status': je.status})
class JournalEntryLineViewSet(viewsets.ModelViewSet):
    queryset = JournalEntryLine.objects.select_related('journal_entry', 'account').all()
    serializer_class = JournalEntryLineSerializer
    permission_classes = [permissions.IsAuthenticated, ModuleRBAC("accounting")]
    filter_backends = [filters.SearchFilter]
    search_fields = ['journal_entry__je_no', 'account__code']
    def perform_create(self, serializer):
        serializer.save()
        je = serializer.instance.journal_entry
        je.total_debit = sum(l.debit for l in je.lines.all())
        je.total_credit = sum(l.credit for l in je.lines.all())
        je.save(update_fields=['total_debit', 'total_credit', 'updated_at'])
class FiscalYearViewSet(viewsets.ModelViewSet):
    queryset = FiscalYear.objects.all()
    serializer_class = FiscalYearSerializer
    permission_classes = [IsAdminOrAccountant, ModuleRBAC("accounting")]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['start_date']
class ExchangeRateViewSet(viewsets.ModelViewSet):
    queryset = ExchangeRate.objects.all()
    serializer_class = ExchangeRateSerializer
    permission_classes = [permissions.IsAuthenticated, ModuleRBAC("accounting")]
class CurrencyViewSet(viewsets.ModelViewSet):
    queryset = Currency.objects.all()
    serializer_class = CurrencySerializer
    permission_classes = [permissions.IsAuthenticated, ModuleRBAC("accounting")]
class GLDefaultAccountViewSet(viewsets.ModelViewSet):
    queryset = GLDefaultAccount.objects.all()
    serializer_class = GLDefaultAccountSerializer
    permission_classes = [IsAdminOrAccountant, ModuleRBAC("accounting")]
class PaymentEntryViewSet(viewsets.ModelViewSet):
    queryset = PaymentEntry.objects.all()
    serializer_class = PaymentEntrySerializer
    permission_classes = [permissions.IsAuthenticated, ModuleRBAC("accounting")]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['pe_no', 'paid_to']
    ordering_fields = ['payment_date']
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
class BankReconciliationViewSet(viewsets.ModelViewSet):
    queryset = BankReconciliation.objects.all()
    serializer_class = BankReconciliationSerializer
    permission_classes = [permissions.IsAuthenticated, ModuleRBAC("accounting")]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['recon_no', 'notes']
    ordering_fields = ['recon_date']
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
class BankReconciliationLineViewSet(viewsets.ModelViewSet):
    queryset = BankReconciliationLine.objects.select_related('reconciliation', 'journal_entry').all()
    serializer_class = BankReconciliationLineSerializer
    permission_classes = [permissions.IsAuthenticated, ModuleRBAC("accounting")]
