from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAdminUser
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer
from apps.users.models import AuditLog

def log_action(user, action, request=None, details=''):
    meta = {}
    if request:
        meta['ip_address'] = request.META.get('REMOTE_ADDR', '')
        meta['user_agent'] = request.META.get('HTTP_USER_AGENT', '')
    AuditLog.objects.create(user=user, action=action, **meta, details=details)

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    log_action(user, 'REGISTER', request)
    return Response({'message': 'Account created', 'user': UserSerializer(user).data}, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.validated_data['user']
    log_action(user, 'LOGIN', request)
    return Response({
        'refresh': serializer.validated_data['refresh'],
        'access': serializer.validated_data['access'],
        'user': UserSerializer(user).data,
    }, status=status.HTTP_200_OK)

@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    user = request.user
    if request.method == 'GET':
        return Response(UserSerializer(user).data)
    partial = request.method == 'PATCH'
    allowed_fields = ['first_name', 'last_name', 'phone', 'department']
    data = {k: v for k, v in request.data.items() if k in allowed_fields}
    serializer = UserSerializer(user, data=data, partial=partial)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    log_action(user, 'PROFILE_UPDATE', request)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def users_list_view(request):
    if getattr(request.user, 'role', None) not in ['ADMIN', 'MANAGER']:
        return Response({'detail': 'NOT_AUTHORIZED'}, status=status.HTTP_403_FORBIDDEN)
    users = type('users', (), {})()
    users.objects = request.user.__class__
    qs = request.user.__class__.objects.all()
    return Response(UserSerializer(qs, many=True).data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def audit_logs_view(request):
    if getattr(request.user, 'role', None) != 'ADMIN':
        return Response({'detail': 'NOT_AUTHORIZED'}, status=status.HTTP_403_FORBIDDEN)
    logs = AuditLog.objects.select_related('user').all()[:200]
    data = [
        {
            'user': str(l.user) if l.user else None,
            'action': l.action,
            'ip_address': l.ip_address,
            'user_agent': l.user_agent,
            'details': l.details,
            'created_at': l.created_at.isoformat(),
        } for l in logs
    ]
    return Response(data)
