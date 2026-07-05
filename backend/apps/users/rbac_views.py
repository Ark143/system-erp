from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.users.rbac import MODULE_ROLES


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def rbac_routes_view(request):
    role = getattr(request.user, 'role', None) or 'VIEWER'
    visible = ['dashboard']
    for module, roles in MODULE_ROLES.items():
        if role in roles:
            visible.append(module)
    return Response({'role': role, 'visible_modules': visible})
