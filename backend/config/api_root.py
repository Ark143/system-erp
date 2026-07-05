from django.http import JsonResponse

def api_root(request):
    return JsonResponse({
        'auth': '/api/auth/',
        'inventory': '/api/inventory/',
        'sales': '/api/sales/',
        'purchasing': '/api/purchasing/',
        'accounting': '/api/accounting/',
        'workflow': '/api/workflow/',
    })
