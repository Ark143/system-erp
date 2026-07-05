from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AccountViewSet, JournalEntryViewSet, JournalEntryLineViewSet, FiscalYearViewSet
from .reports import trial_balance, account_balance

router = DefaultRouter()
router.register('accounts', AccountViewSet, basename='account')
router.register('journal-entries', JournalEntryViewSet, basename='journalentry')
router.register('je-lines', JournalEntryLineViewSet, basename='journalentryline')
router.register('fiscal-years', FiscalYearViewSet, basename='fiscalyear')

urlpatterns = [
    path('', include(router.urls)),
    path('reports/trial-balance/', trial_balance),
    path('accounts/<int:account_id>/balance/', account_balance),
]
