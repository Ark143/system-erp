from rest_framework import permissions


def has_role(user, roles):
    if not getattr(user, 'is_authenticated', False):
        return False
    return getattr(user, 'role', None) in roles


class IsAdminOrManager(permissions.BasePermission):
    allowed_roles = ('ADMIN', 'MANAGER')

    def has_permission(self, request, view):
        return has_role(request.user, self.allowed_roles)


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return has_role(request.user, ('ADMIN',))


MODULE_ROLES = {
  'governance': ('ADMIN', 'MANAGER'),
  'accounting': ('ADMIN', 'MANAGER', 'STAFF'),
  'reports': ('ADMIN', 'MANAGER', 'STAFF', 'VIEWER'),
  'workflow': ('ADMIN', 'MANAGER', 'STAFF'),
  'users': ('ADMIN', 'MANAGER'),
  'masterdata': ('ADMIN', 'MANAGER', 'STAFF'),
  'sales': ('ADMIN', 'MANAGER', 'STAFF', 'VIEWER'),
  'purchasing': ('ADMIN', 'MANAGER', 'STAFF', 'VIEWER'),
  'inventory': ('ADMIN', 'MANAGER', 'STAFF', 'VIEWER'),
}


class _ModuleRBAC(permissions.BasePermission):
    module_key = None

    def has_permission(self, request, view):
        if not self.module_key:
            return True
        roles = MODULE_ROLES.get(self.module_key)
        if roles is None:
            return True
        return has_role(request.user, roles)


def ModuleRBAC(module_key):
    class _ModuleRBACWithKey(_ModuleRBAC):
        pass
    _ModuleRBACWithKey.module_key = module_key
    return _ModuleRBACWithKey


__all__ = [
  'has_role',
  'IsAdminOrManager',
  'IsAdmin',
  'ModuleRBAC',
  'MODULE_ROLES',
]
