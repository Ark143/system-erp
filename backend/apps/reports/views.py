from django.http import JsonResponse
import json
from django.db import connection

def _query(sql, params=None):
    with connection.cursor() as cursor:
        cursor.execute(sql, params or [])
        cols = [c[0] for c in cursor.description]
        return [dict(zip(cols, row)) for row in cursor.fetchall()]

def general_ledger(request):
    rows = _query("""
      SELECT id, je_no, journal_date, status, total_debit, total_credit
      FROM accounting_journalentry
      ORDER BY journal_date DESC, id DESC
      LIMIT 100
    """)
    return JsonResponse({'results': rows})

def trial_balance(request):
    rows = _query("""
      SELECT a.code, a.name, a.account_type,
             SUM(l.debit) AS debit,
             SUM(l.credit) AS credit
      FROM accounting_account a
      JOIN accounting_journalentryline l ON l.account_id = a.id
      JOIN accounting_journalentry je ON je.id = l.journal_entry_id
      WHERE je.status = 'POSTED'
      GROUP BY a.id
      ORDER BY a.code
    """)
    return JsonResponse({'results': rows})

def financial_reports(request):
    return JsonResponse({
      'summary': {
        'total_income': 0,
        'total_expense': 0,
        'net_income': 0,
      },
      'message': 'Implement report engine with JEs filtered by fiscal period.'
    })
