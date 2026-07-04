from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 'department', 'role', 'phone', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'username', 'first_name', 'last_name', 'department', 'role', 'phone', 'password', 'confirm_password']

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError('PASSWORDS DO NOT MATCH')
        if not attrs.get('department'):
            attrs['department'] = 'OPERATIONS'
        if not attrs.get('role'):
            attrs['role'] = 'STAFF'
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user

class LoginSerializer(TokenObtainPairSerializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    username_field = 'email'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields.pop('username', None)

    def validate(self, attrs):
        authenticate_kwargs = {
            'email': attrs.get('email'),
            'password': attrs.get('password')
        }
        user = authenticate(**authenticate_kwargs)
        if not user:
            raise serializers.ValidationError('INVALID CREDENTIALS')
        if not user.is_active:
            raise serializers.ValidationError('ACCOUNT DISABLED')
        data = super().validate(user)
        data.update({'user': UserSerializer(user).data})
        return data

class AuditSerializer(serializers.Serializer):
    message = serializers.CharField()
    count = serializers.IntegerField()
