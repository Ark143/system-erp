from django.db import connection
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.users.rbac import ModuleRBAC

_reports_permission = ModuleRBAC('reports')


def _query(sql, params=None):
    with connection.cursor() as cursor:
        cursor.execute(sql, params or [])
        cols = [c[0] for c in cursor.description or []]
        return [dict(zip(cols, row)) for row in cursor.fetchall()]


class GeneralLedgerView(APIView):
    permission_classes = [IsAuthenticated, _reports_permission]

    def get(self, request):
        rows = _query("""
          SELECT id, je_no, journal_date, status, total_debit, total_credit
          FROM accounting_journalentry
          ORDER BY journal_date DESC, id DESC
          LIMIT 100
        """)
        return Response({'results': rows})


class TrialBalanceView(APIView):
    permission_classes = [IsAuthenticated, _reports_permission]

    def get(self, request):
        rows = _query("""
          SELECT a.code, a.name, a.account_type,
                 COALESCE(SUM(l.debit), 0) AS debit,
                 COALESCE(SUM(l.credit), 0) AS credit
          FROM accounting_account a
          LEFT JOIN accounting_journalentryline l ON l.account_id = a.id
          LEFT JOIN accounting_journalentry je ON je.id = l.journal_entry_id AND je.status = 'POSTED'
          GROUP BY a.id
          ORDER BY a.code
        """)
        return Response({'results': rows})


class FinancialReportsView(APIView):
    permission_classes = [IsAuthenticated, _reports_permission]

    def get(self, request):
        return Response({
          'summary': {
            'total_income': 0,
            'total_expense': 0,
            'net_income': 0,
          },
          'message': 'Implement report engine with JEs filtered by fiscal period.'
        })
