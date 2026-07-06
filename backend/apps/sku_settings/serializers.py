from rest_framework import serializers
from .models import SkuFormatSeries, SkuFormatSelection, DocumentControlSetting

class SkuFormatSeriesSerializer(serializers.ModelSerializer):
    next_code = serializers.SerializerMethodField()

    class Meta:
        model = SkuFormatSeries
        fields = [
            'id', 'module', 'name', 'prefix', 'suffix', 'use_series',
            'counter', 'counter_pad', 'is_active', 'allow_multiple',
            'next_code', 'created_by', 'updated_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'updated_by', 'created_at', 'updated_at']

    def get_next_code(self, obj):
        return obj.next_code()


class SkuFormatSelectionSerializer(serializers.ModelSerializer):
    default_series_name = serializers.CharField(source='default_series.name', read_only=True)
    default_next_code = serializers.SerializerMethodField()

    class Meta:
        model = SkuFormatSelection
        fields = [
            'id', 'module', 'default_series', 'default_series_name',
            'default_next_code', 'updated_by', 'updated_at'
        ]
        read_only_fields = ['updated_by', 'updated_at']

    def get_default_next_code(self, obj):
        if obj.default_series:
            return obj.default_series.next_code()
        return None


class DocumentControlSettingSerializer(serializers.ModelSerializer):
    next_number_display = serializers.SerializerMethodField()

    class Meta:
        model = DocumentControlSetting
        fields = [
            'id', 'company', 'prefix', 'series_code', 'padding',
            'current_number', 'status', 'note', 'updated_by', 'updated_at',
            'next_number_display'
        ]
        read_only_fields = ['updated_by', 'updated_at']

    def get_next_number_display(self, obj):
        return obj.next_number_display()
