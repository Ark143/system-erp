from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, ItemViewSet, StockMoveViewSet

router = DefaultRouter()
router.register('categories', CategoryViewSet, basename='category')
router.register('items', ItemViewSet, basename='item')
router.register('stock-moves', StockMoveViewSet, basename='stockmove')

urlpatterns = [
    path('', include(router.urls)),
]
