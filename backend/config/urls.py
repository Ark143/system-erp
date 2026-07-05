from django.contrib import admin
from django.urls import path, include
from config.api_root import api_root

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', api_root),
    path('api/auth/', include('apps.users.urls')),
    path('api/auth/rbac-routes/', include('apps.users.rbac_urls')),
    path('api/inventory/', include('apps.inventory.urls')),
    path('api/sales/', include('apps.sales.urls')),
    path('api/purchasing/', include('apps.purchasing.urls')),
    path('api/accounting/', include('apps.accounting.urls')),
    path('api/reports/', include('apps.reports.urls')),
    path('api/governance/', include('apps.governance.urls')),
    path('api/workflow/', include('apps.workflow.urls')),
    path('api/masterdata/', include('apps.masterdata.urls')),
]
