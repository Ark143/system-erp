from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SkuFormatSeriesViewSet, SkuFormatSelectionViewSet, DocumentControlSettingViewSet

router = DefaultRouter()
router.register(r'sku-series', SkuFormatSeriesViewSet, basename='sku-series')
router.register(r'sku-selection', SkuFormatSelectionViewSet, basename='sku-selection')
router.register(r'document-control', DocumentControlSettingViewSet, basename='document-control')

urlpatterns = [
    path('', include(router.urls)),
]
