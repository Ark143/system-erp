import urllib.request, json
base='http://127.0.0.1:8002/api'
login = urllib.request.Request(base+'/auth/login/', data=json.dumps({"email":"admin@example.com","password":"admin"}).encode(), headers={"Content-Type":"application/json"}, method='POST')
with urllib.request.urlopen(login) as r:
    token = json.loads(r.read())['access']

req = urllib.request.Request(base+'/accounting/accounts/', headers={"Authorization":"Bearer "+token})
with urllib.request.urlopen(req) as r:
    data = json.loads(r.read())
rows = data if isinstance(data, list) else data.get('results', [])
print('status', r.status)
print('count', len(rows) if isinstance(rows, list) else 'n/a')
if isinstance(rows, list) and rows:
    print(json.dumps(rows[0], indent=2)[:2000])
else:
    print(json.dumps(data, indent=2)[:2000])
