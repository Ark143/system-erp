from django.urls import path
from .rbac_views import rbac_routes_view

urlpatterns = [
    path('', rbac_routes_view),
]
