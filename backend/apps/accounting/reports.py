from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Q, F, Value, DecimalField, CharField
from django.db.models.functions import Coalesce
from .models import Account, JournalEntryLine, JournalEntry

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def trial_balance(request):
    from_date = request.query_params.get('from_date')
    to_date = request.query_params.get('to_date')
    lines = JournalEntryLine.objects.select_related('account', 'journal_entry').filter(journal_entry__status=JournalEntry.JE_STATUS_POSTED)
    if from_date:
        lines = lines.filter(journal_entry__journal_date__gte=from_date)
    if to_date:
        lines = lines.filter(journal_entry__journal_date__lte=to_date)
    agg = lines.values('account').annotate(
        total_debit=Sum('debit'),
        total_credit=Sum('credit'),
        account_code=F('account__code'),
        account_name=F('account__name'),
        account_type=F('account__account_type'),
    )
    result = list(agg.order_by('account__code'))
    return Response(result)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def account_balance(request, account_id):
    account = Account.objects.filter(pk=account_id, is_active=True).first()
    if not account:
        return Response({'detail': 'ACCOUNT_NOT_FOUND'}, status=404)
    from_date = request.query_params.get('from_date')
    to_date = request.query_params.get('to_date')
    lines = JournalEntryLine.objects.filter(account=account, journal_entry__status=JournalEntry.JE_STATUS_POSTED)
    if from_date:
        lines = lines.filter(journal_entry__journal_date__gte=from_date)
    if to_date:
        lines = lines.filter(journal_entry__journal_date__lte=to_date)
    debit = lines.aggregate(d=Coalesce(Sum('debit'), Value(0), output_field=DecimalField()))['d'] or 0
    credit = lines.aggregate(c=Coalesce(Sum('credit'), Value(0), output_field=DecimalField()))['c'] or 0
    return Response({
        'account': f'{account.code} - {account.name}',
        'balance': float(debit) - float(credit),
        'direction': 'DEBIT' if float(debit) > float(credit) else 'CREDIT',
        'debit': float(debit),
        'credit': float(credit),
    })
