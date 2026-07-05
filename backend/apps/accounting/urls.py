from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
  AccountViewSet, JournalEntryViewSet, JournalEntryLineViewSet, FiscalYearViewSet,
  ExchangeRateViewSet, CurrencyViewSet, GLDefaultAccountViewSet,
  PaymentEntryViewSet, BankReconciliationViewSet,
)
from .reports import trial_balance, account_balance

router = DefaultRouter()
router.register('accounts', AccountViewSet, basename='account')
router.register('journal-entries', JournalEntryViewSet, basename='journalentry')
router.register('journal-entry-lines', JournalEntryLineViewSet, basename='journalentryline')
router.register('fiscal-years', FiscalYearViewSet, basename='fiscalyear')
router.register('exchange-rates', ExchangeRateViewSet, basename='exchangerate')
router.register('currencies', CurrencyViewSet, basename='currency')
router.register('gl-default-accounts', GLDefaultAccountViewSet, basename='gldefaultaccount')
router.register('payment-entries', PaymentEntryViewSet, basename='paymententry')
router.register('bank-reconciliation', BankReconciliationViewSet, basename='bankreconciliation')

urlpatterns = [
    path('', include(router.urls)),
    path('reports/trial-balance/', trial_balance),
    path('accounts/<int:account_id>/balance/', account_balance),
]
