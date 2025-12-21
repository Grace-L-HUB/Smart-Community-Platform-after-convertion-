from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    MerchantApplication, MerchantProfile, MerchantProduct,
    MerchantCoupon, UserCoupon, MerchantOrder, MerchantOrderItem
)

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


class MerchantOrderItemSerializer(serializers.ModelSerializer):
    """订单商品序列化器"""
    
    class Meta:
        model = MerchantOrderItem
        fields = [
            'id', 'product', 'product_name', 'product_price', 
            'quantity', 'subtotal', 'specifications'
        ]


class MerchantOrderSerializer(serializers.ModelSerializer):
    """商户订单序列化器"""
    
    items = MerchantOrderItemSerializer(many=True, read_only=True)
    merchant_name = serializers.CharField(source='merchant.shop_name', read_only=True)
    user_info = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    pickup_type_display = serializers.CharField(source='get_pickup_type_display', read_only=True)
    used_coupon_info = serializers.SerializerMethodField()
    
    class Meta:
        model = MerchantOrder
        fields = [
            'id', 'order_no', 'merchant', 'merchant_name', 'user', 'user_info',
            'total_amount', 'actual_amount', 'status', 'status_display',
            'pickup_type', 'pickup_type_display', 'contact_name', 'contact_phone',
            'address', 'pickup_code', 'used_coupon', 'used_coupon_info',
            'discount_amount', 'note', 'reject_reason', 'items',
            'created_at', 'accepted_at', 'completed_at'
        ]
        read_only_fields = ['merchant', 'order_no', 'pickup_code', 'created_at']
    
    def get_user_info(self, obj):
        """获取用户信息"""
        return {
            'id': obj.user.id,
            'username': obj.user.username,
            'display_name': getattr(obj.user, 'display_name', obj.user.username),
            'phone': getattr(obj.user, 'phone', ''),
        }
    
    def get_used_coupon_info(self, obj):
        """获取使用的优惠券信息"""
        if obj.used_coupon:
            return {
                'id': obj.used_coupon.id,
                'name': obj.used_coupon.coupon.name,
                'amount': obj.used_coupon.coupon.amount,
                'verification_code': obj.used_coupon.verification_code
            }
        return None


class MerchantCouponSerializer(serializers.ModelSerializer):
    """商户优惠券序列化器"""
    
    merchant_name = serializers.CharField(source='merchant.shop_name', read_only=True)
    type_display = serializers.CharField(source='get_coupon_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    remaining_count = serializers.ReadOnlyField()
    is_valid = serializers.ReadOnlyField()
    
    class Meta:
        model = MerchantCoupon
        fields = [
            'id', 'merchant', 'merchant_name', 'name', 'description',
            'coupon_type', 'type_display', 'amount', 'min_amount',
            'total_count', 'used_count', 'remaining_count', 'per_user_limit',
            'start_date', 'end_date', 'status', 'status_display',
            'is_valid', 'created_at', 'updated_at'
        ]
        read_only_fields = ['merchant', 'used_count', 'created_at', 'updated_at']
    
    def validate(self, data):
        """验证数据"""
        if data.get('start_date') and data.get('end_date'):
            if data['start_date'] >= data['end_date']:
                raise serializers.ValidationError("开始时间必须早于结束时间")
        
        if data.get('amount') and data.get('min_amount'):
            if data['amount'] > data['min_amount']:
                raise serializers.ValidationError("优惠金额不能大于最低消费金额")
        
        return data


class UserCouponSerializer(serializers.ModelSerializer):
    """用户优惠券序列化器"""
    
    coupon_info = serializers.SerializerMethodField()
    merchant_info = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_expired = serializers.SerializerMethodField()
    
    class Meta:
        model = UserCoupon
        fields = [
            'id', 'coupon', 'coupon_info', 'merchant_info', 
            'status', 'status_display', 'verification_code',
            'is_expired', 'used_at', 'received_at'
        ]
        read_only_fields = ['verification_code', 'used_at', 'received_at']
    
    def get_coupon_info(self, obj):
        """获取优惠券信息"""
        return {
            'id': obj.coupon.id,
            'name': obj.coupon.name,
            'description': obj.coupon.description,
            'type': obj.coupon.coupon_type,
            'type_display': obj.coupon.get_coupon_type_display(),
            'amount': obj.coupon.amount,
            'min_amount': obj.coupon.min_amount,
            'start_date': obj.coupon.start_date,
            'end_date': obj.coupon.end_date,
        }
    
    def get_merchant_info(self, obj):
        """获取商户信息"""
        return {
            'id': obj.coupon.merchant.id,
            'name': obj.coupon.merchant.shop_name,
            'logo': obj.coupon.merchant.shop_logo.url if obj.coupon.merchant.shop_logo else None,
        }
    
    def get_is_expired(self, obj):
        """是否已过期"""
        from django.utils import timezone
        return obj.coupon.end_date < timezone.now()


class CouponReceiveSerializer(serializers.Serializer):
    """优惠券领取序列化器"""
    
    coupon_id = serializers.IntegerField()
    
    def validate_coupon_id(self, value):
        """验证优惠券ID"""
        try:
            coupon = MerchantCoupon.objects.get(id=value)
            if not coupon.is_valid:
                raise serializers.ValidationError("优惠券已失效或数量不足")
            return value
        except MerchantCoupon.DoesNotExist:
            raise serializers.ValidationError("优惠券不存在")


class CouponVerifySerializer(serializers.Serializer):
    """优惠券核销序列化器"""
    
    verification_code = serializers.CharField(max_length=32)
    order_id = serializers.IntegerField(required=False)
    
    def validate_verification_code(self, value):
        """验证核销码"""
        try:
            user_coupon = UserCoupon.objects.get(verification_code=value, status='unused')
            return value
        except UserCoupon.DoesNotExist:
            raise serializers.ValidationError("核销码无效或已使用")


class OrderStatusUpdateSerializer(serializers.Serializer):
    """订单状态更新序列化器"""
    
    status = serializers.ChoiceField(choices=MerchantOrder.STATUS_CHOICES)
    reject_reason = serializers.CharField(max_length=200, required=False, allow_blank=True)
    
    def validate(self, data):
        """验证数据"""
        if data.get('status') == 'cancelled' and not data.get('reject_reason'):
            raise serializers.ValidationError("取消订单必须提供原因")
        return data


class PickupCodeVerifySerializer(serializers.Serializer):
    """取餐码验证序列化器"""
    
    pickup_code = serializers.CharField(max_length=6)
    
    def validate_pickup_code(self, value):
        """验证取餐码"""
        if len(value) != 6 or not value.isdigit():
            raise serializers.ValidationError("取餐码必须是6位数字")
        return value