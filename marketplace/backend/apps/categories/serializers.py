"""Serializers for the catalogue API (spec §11, §30)."""
from rest_framework import serializers

from .models import AttributeDefinition, Brand, Category


class AttributeDefinitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttributeDefinition
        fields = (
            "id",
            "key",
            "label",
            "value_type",
            "unit",
            "options",
            "required",
            "filterable",
            "sort_order",
        )


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ("id", "name", "slug")


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = (
            "id",
            "name",
            "slug",
            "parent",
            "description",
            "icon",
            "sort_order",
        )


class CategoryNodeSerializer(CategorySerializer):
    """Category with children tree and dynamic attribute definitions."""

    children = serializers.SerializerMethodField()
    attributes = serializers.SerializerMethodField()

    class Meta(CategorySerializer.Meta):
        fields = (*CategorySerializer.Meta.fields, "children", "attributes")

    def get_children(self, obj):
        children = obj.children.all().order_by("sort_order", "name")
        return CategoryNodeSerializer(children, many=True, context=self.context).data

    def get_attributes(self, obj):
        return AttributeDefinitionSerializer(obj.attributes.all(), many=True).data
