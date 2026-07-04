from django.urls import path
from .views import register_view, login_view, profile_view, users_list_view, audit_logs_view

urlpatterns = [
    path('register/', register_view),
    path('login/', login_view),
    path('profile/', profile_view),
    path('users/', users_list_view),
    path('audit-logs/', audit_logs_view),
]
