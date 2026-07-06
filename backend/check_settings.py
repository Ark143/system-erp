import urllib.request, json
base = 'http://localhost:8002/api'
login = urllib.request.Request(base+'/auth/login/', data=json.dumps({"email":"admin@example.com","password":"admin"}).encode(), headers={"Content-Type":"application/json"}, method='POST')
with urllib.request.urlopen(login) as r:
    token = json.loads(r.read())['access']
req = urllib.request.Request(base+'/inventory/settings/', headers={"Authorization":"Bearer "+token})
with urllib.request.urlopen(req) as r:
    print(r.read().decode()[:1000])
