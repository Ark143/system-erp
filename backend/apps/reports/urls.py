from django.urls import path
from .views import GeneralLedgerView, TrialBalanceView, FinancialReportsView

urlpatterns = [
    path('general-ledger/', GeneralLedgerView.as_view()),
    path('trial-balance/', TrialBalanceView.as_view()),
    path('financial-reports/', FinancialReportsView.as_view()),
]
