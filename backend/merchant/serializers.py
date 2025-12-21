from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import MerchantApplication, MerchantProfile, MerchantProduct

User = get_user_model()


class MerchantApplicationSerializer(serializers.ModelSerializer):
    """商户申请序列化器"""
    
    user_info = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    category_display = serializers.CharField(source='get_shop_category_display', read_only=True)
    reviewer_name = serializers.CharField(source='reviewer.display_name', read_only=True)
    
    class Meta:
        model = MerchantApplication
        fields = [
            'id', 'user', 'user_info', 'shop_name', 'shop_category', 'category_display',
            'shop_phone', 'shop_address', 'shop_description', 'business_hours_start', 
            'business_hours_end', 'business_license', 'identity_card_front', 
            'identity_card_back', 'other_certificates', 'legal_name', 'legal_id_card', 
            'legal_phone', 'status', 'status_display', 'reviewer', 'reviewer_name',
            'review_comment', 'reviewed_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'status', 'reviewer', 'review_comment', 'reviewed_at']
    
    def get_user_info(self, obj):
        """获取用户信息"""
        return {
            'id': obj.user.id,
            'username': obj.user.username,
            'display_name': obj.user.display_name,
            'phone': obj.user.phone,
        }


class MerchantApplicationCreateSerializer(serializers.ModelSerializer):
    """商户申请创建序列化器"""
    
    class Meta:
        model = MerchantApplication
        fields = [
            'shop_name', 'shop_category', 'shop_phone', 'shop_address', 
            'shop_description', 'business_hours_start', 'business_hours_end',
            'business_license', 'identity_card_front', 'identity_card_back',
            'other_certificates', 'legal_name', 'legal_id_card', 'legal_phone'
        ]
    
    def validate(self, data):
        """验证数据"""
        # 检查用户是否已有待审核的申请
        request = self.context.get('request')
        if request and request.user:
            existing_application = MerchantApplication.objects.filter(
                user=request.user,
                status='pending'
            ).exists()
            
            if existing_application:
                raise serializers.ValidationError("您已有待审核的申请，请耐心等待审核结果")
        
        return data
    
    def create(self, validated_data):
        """创建申请"""
        request = self.context.get('request')
        if request and request.user:
            validated_data['user'] = request.user
        
        return super().create(validated_data)


class MerchantApplicationReviewSerializer(serializers.ModelSerializer):
    """商户申请审核序列化器"""
    
    class Meta:
        model = MerchantApplication
        fields = ['status', 'review_comment']
    
    def validate_status(self, value):
        """验证状态"""
        if value not in ['approved', 'rejected']:
            raise serializers.ValidationError("状态只能是 approved 或 rejected")
        return value
    
    def validate(self, data):
        """验证审核数据"""
        if data.get('status') == 'rejected' and not data.get('review_comment'):
            raise serializers.ValidationError("拒绝申请必须填写审核意见")
        return data


class MerchantProfileSerializer(serializers.ModelSerializer):
    """商户档案序列化器"""
    
    user_info = serializers.SerializerMethodField()
    category_display = serializers.CharField(source='get_shop_category_display', read_only=True)
    
    class Meta:
        model = MerchantProfile
        fields = [
            'id', 'user', 'user_info', 'shop_name', 'shop_logo', 'shop_category',
            'category_display', 'shop_phone', 'shop_address', 'shop_description',
            'shop_announcement', 'business_hours_start', 'business_hours_end',
            'is_active', 'total_orders', 'total_revenue', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'total_orders', 'total_revenue']
    
    def get_user_info(self, obj):
        """获取用户信息"""
        return {
            'id': obj.user.id,
            'username': obj.user.username,
            'display_name': obj.user.display_name,
            'phone': obj.user.phone,
        }


class MerchantProfileUpdateSerializer(serializers.ModelSerializer):
    """商户档案更新序列化器"""
    
    class Meta:
        model = MerchantProfile
        fields = [
            'shop_name', 'shop_logo', 'shop_phone', 'shop_address',
            'shop_description', 'shop_announcement', 'business_hours_start',
            'business_hours_end'
        ]


class MerchantProductSerializer(serializers.ModelSerializer):
    """商品序列化器"""
    
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    merchant_name = serializers.CharField(source='merchant.shop_name', read_only=True)
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = MerchantProduct
        fields = [
            'id', 'merchant', 'merchant_name', 'name', 'description', 'image', 'image_url',
            'category', 'category_display', 'price', 'original_price', 'stock',
            'status', 'status_display', 'sales_count', 'service_time_slots',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['merchant', 'sales_count', 'created_at', 'updated_at']
    
    def get_image_url(self, obj):
        """获取图片URL"""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
        return None


class MerchantProductCreateUpdateSerializer(serializers.ModelSerializer):
    """商品创建/更新序列化器"""
    
    class Meta:
        model = MerchantProduct
        fields = [
            'name', 'description', 'image', 'category', 'price', 'original_price', 
            'stock', 'status', 'service_time_slots'
        ]
    
    def validate_price(self, value):
        """验证价格"""
        if value <= 0:
            raise serializers.ValidationError("价格必须大于0")
        return value
    
    def validate_stock(self, value):
        """验证库存"""
        if value < 0:
            raise serializers.ValidationError("库存不能为负数")
        return value
    
    def validate(self, data):
        """验证数据"""
        # 如果设置了原价，原价应该大于售价
        if data.get('original_price') and data.get('price'):
            if data['original_price'] <= data['price']:
                raise serializers.ValidationError("原价应该大于售价")
        
        return data