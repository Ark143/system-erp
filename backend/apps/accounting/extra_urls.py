from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
  ExchangeRateViewSet,
  CurrencyViewSet,
  GLDefaultAccountViewSet,
  PaymentEntryViewSet,
  BankReconciliationViewSet,
)

router = DefaultRouter()
router.register('exchange-rates', ExchangeRateViewSet, basename='exchangerate')
router.register('currencies', CurrencyViewSet, basename='currency')
router.register('gl-default-accounts', GLDefaultAccountViewSet, basename='gldefaultaccount')
router.register('payment-entries', PaymentEntryViewSet, basename='paymententry')
router.register('bank-reconciliation', BankReconciliationViewSet, basename='bankreconciliation')

urlpatterns = [
    path('', include(router.urls)),
]
