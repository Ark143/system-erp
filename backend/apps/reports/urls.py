from django.urls import path
from .views import general_ledger, trial_balance, financial_reports

urlpatterns = [
    path('general-ledger/', general_ledger),
    path('trial-balance/', trial_balance),
    path('financial-reports/', financial_reports),
]
