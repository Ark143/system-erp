import urllib.request, json
from urllib.error import HTTPError

base='http://127.0.0.1:8002/api'
headers={'Content-Type':'application/json'}
login = urllib.request.Request(base+'/auth/login/', data=json.dumps({"email":"admin@example.com","password":"admin"}).encode(), headers=headers)
with urllib.request.urlopen(login) as r:
    token = json.loads(r.read())['access']
headers['Authorization']='Bearer '+token

companies = json.loads(urllib.request.urlopen(urllib.request.Request(base+'/governance/companies/', headers=headers)).read())
company = next((c for c in companies if c.get('company_name')=='JMIT'), None)
if not company:
    payload={'company_id':'JMIT','company_name':'JMIT','abbreviation':'JMIT','is_active':True}
    req=urllib.request.Request(base+'/governance/companies/', data=json.dumps(payload).encode(), headers=headers, method='POST')
    with urllib.request.urlopen(req) as r:
        company=json.loads(r.read())
company_id=company['company_id']
print('company', company_id)

with open(r'C:\Users\josem\AppData\Local\Programs\devswarm\system-erp\system-erp\backend\chartdata.tsv', encoding='utf-8') as f:
    lines=f.read().split('\n')

type_map={
    'Asset':'ASSET',
    'Liability':'LIABILITY',
    'Equity':'EQUITY',
    'Income':'INCOME',
    'Expense':'EXPENSE',
}

parsed=[]
seen=set()
for line in lines:
    if not line.strip() or line.startswith('ID\tAccount Name'):
        continue
    cols=line.split('\t')
    if len(cols) < 16:
        continue
    display = cols[0].strip()
    if not display or display in seen:
        continue
    seen.add(display)
    account_number = cols[4].strip() or display.split(' - ')[0].strip()
    parsed.append({
      'display': display,
      'code': display.split(' - ')[0].strip()[:20],
      'name': cols[1],
      'company': company_id,
      'parent_code': cols[3] or None,
      'disabled': cols[4].strip() == '0',
      'account_number': account_number,
      'is_group': cols[6].strip() == '1',
      'root_type': cols[7].strip() or 'Asset',
      'report_type': cols[8].strip() or 'Balance Sheet',
      'account_category': cols[9].strip(),
      'account_type': type_map.get((cols[7].strip() or 'Asset'), 'ASSET'),
      'account_currency': cols[9].strip() or 'PHP',
      'tax_rate': float(cols[12].strip() or 0),
      'frozen_balance': cols[13].strip() == 'No',
      'old_parent_name': cols[14] or None,
      'include_in_gross': 1 if str(cols[15]).strip() == '1' else 0,
    })

existing_accounts = json.loads(urllib.request.urlopen(urllib.request.Request(base+'/accounting/accounts/?ordering=code', headers=headers)).read())
existing = {acc['code']: acc['id'] for acc in existing_accounts}

created = 0
updated = 0
lookup = dict(existing)
for row in parsed:
    parent_id = None
    if row['parent_code']:
        parent_id = lookup.get(row['parent_code'])
    if not parent_id:
        parent_id = lookup.get(row['code'])
    payload = {
      'code': row['code'],
      'name': row['name'],
      'company': row['company'],
      'is_group': row['is_group'],
      'parent': parent_id,
      'root_type': row['root_type'],
      'report_type': row['report_type'],
      'account_type': row['account_type'],
      'account_category': row['account_category'],
      'account_currency': row['account_currency'],
      'account_number': row['account_number'],
      'tax_rate': row['tax_rate'],
      'disabled': row['disabled'],
      'is_active': True,
      'frozen_balance': row['frozen_balance'],
      'old_parent': row['old_parent_name'] or '',
      'include_in_gross': row['include_in_gross'],
    }
    existing_id = lookup.get(row['code'])
    if existing_id:
        req = urllib.request.Request(base+f'/accounting/accounts/{existing_id}/', data=json.dumps(payload).encode(), headers=headers, method='PATCH')
        try:
            with urllib.request.urlopen(req) as r:
                updated += 1
        except HTTPError as e:
            print('UPDATE FAIL', row['display'], e.code, e.read().decode())
    else:
        req = urllib.request.Request(base+'/accounting/accounts/', data=json.dumps(payload).encode(), headers=headers, method='POST')
        try:
            with urllib.request.urlopen(req) as r:
                obj = json.loads(r.read())
                lookup[row['code']] = obj['id']
                created += 1
        except HTTPError as e:
            print('CREATE FAIL', row['display'], e.code, e.read().decode())

with urllib.request.urlopen(urllib.request.Request(base+'/accounting/accounts/?ordering=code', headers=headers)) as r:
    data=json.loads(r.read())
print('created', created, 'updated', updated, 'total accounts', len(data))
