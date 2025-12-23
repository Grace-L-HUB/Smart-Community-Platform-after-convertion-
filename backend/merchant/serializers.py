from rest_framework import serializers
from django.contrib.auth import get_user_model
import random
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
    shop_logo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = MerchantProfile
        fields = [
            'id', 'user', 'user_info', 'shop_name', 'shop_logo', 'shop_logo_url', 'shop_category',
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

    def get_shop_logo_url(self, obj):
        """获取头像完整URL"""
        if obj.shop_logo:
            request = self.context.get('request')
            if request:
                # 构建基础URL
                base_url = f"{request.scheme}://{request.get_host()}"
                # 如果 shop_logo 是字符串
                if isinstance(obj.shop_logo, str):
                    # 如果已经是完整路径（以/开头），直接使用
                    if obj.shop_logo.startswith('/'):
                        return f"{base_url}{obj.shop_logo}"
                    # 否则添加 /media/ 前缀
                    return f"{base_url}/media/{obj.shop_logo}"
                # 如果是 FieldFile 对象，使用 .url 属性
                return f"{base_url}{obj.shop_logo.url}"
            # 如果没有 request，尝试直接返回
            if hasattr(obj.shop_logo, 'url'):
                return obj.shop_logo.url
            return f'/media/{obj.shop_logo}' if obj.shop_logo else None
        return None


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


class LogoUploadSerializer(serializers.Serializer):
    """Logo上传序列化器"""

    logo = serializers.ImageField(help_text="Logo图片文件")

    def validate_logo(self, value):
        """验证Logo文件"""
        # 限制文件大小（最大5MB）
        max_size = 5 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError("图片大小不能超过5MB")

        # 限制文件类型
        allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif']
        import os
        ext = os.path.splitext(value.name)[1].lower()
        if ext not in allowed_extensions:
            raise serializers.ValidationError("只支持 JPG、PNG、GIF 格式的图片")

        return value


class OrderCreateSerializer(serializers.ModelSerializer):
    """订单创建序列化器（小程序使用）"""
    order_items = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        help_text="订单商品列表"
    )
    user_coupon_id = serializers.IntegerField(
        allow_null=True,
        required=False,
        help_text="使用的优惠券ID"
    )
    merchant_id = serializers.IntegerField(
        write_only=True,
        help_text="商户ID"
    )

    class Meta:
        model = MerchantOrder
        fields = [
            'merchant_id', 'contact_name', 'contact_phone', 'pickup_type',
            'address', 'note', 'user_coupon_id', 'order_items'
        ]
        extra_kwargs = {
            'merchant_id': {'write_only': True},
            'contact_name': {'write_only': True},
            'contact_phone': {'write_only': True},
            'pickup_type': {'write_only': True},
            'address': {'write_only': True},
            'note': {'write_only': True},
            'user_coupon_id': {'write_only': True},
            'order_items': {'write_only': True},
        }

    def validate(self, data):
        """验证订单数据"""
        order_items = data.get('order_items', [])
        if not order_items:
            raise serializers.ValidationError("订单商品不能为空")

        # 验证商品
        for item in order_items:
            product_id = item.get('product_id')
            quantity = item.get('quantity', 1)

            if not product_id or quantity <= 0:
                raise serializers.ValidationError("商品ID和数量必须有效")

        return data

    def create(self, validated_data):
        """创建订单"""
        print("DEBUG: create方法开始执行")

        try:
            print(f"DEBUG: validated_data = {validated_data}")
            print(f"DEBUG: validated_data类型 = {type(validated_data)}")

            # 尝试弹出order_items
            try:
                order_items_data = validated_data.pop('order_items')
                print(f"DEBUG: 成功获取order_items_data = {order_items_data}")
            except Exception as e:
                print(f"DEBUG: 弹出order_items失败: {e}")
                raise

            # 尝试弹出user_coupon_id
            try:
                user_coupon_id = validated_data.pop('user_coupon_id', None)
                print(f"DEBUG: 成功获取user_coupon_id = {user_coupon_id}")
            except Exception as e:
                print(f"DEBUG: 弹出user_coupon_id失败: {e}")
                raise

            # 尝试弹出merchant_id
            try:
                merchant_id = validated_data.pop('merchant_id')
                print(f"DEBUG: 成功获取merchant_id = {merchant_id}")
            except Exception as e:
                print(f"DEBUG: 弹出merchant_id失败: {e}")
                raise

            # 尝试转换为整数
            if merchant_id is not None:
                try:
                    merchant_id = int(merchant_id)
                    print(f"DEBUG: merchant_id转换为整数 = {merchant_id}")
                except (ValueError, TypeError) as e:
                    print(f"DEBUG: merchant_id转换整数失败: {e}")
                    merchant_id = 0
            else:
                merchant_id = 0

            # 获取请求数据
            try:
                request = self.context.get('request')
                print(f"DEBUG: 获取request = {request}")
                print(f"DEBUG: request类型 = {type(request)}")

                if request:
                    print(f"DEBUG: request.data = {getattr(request, 'data', 'NO_DATA')}")
                    print(f"DEBUG: request.user = {getattr(request, 'user', 'NO_USER')}")
            except Exception as e:
                print(f"DEBUG: 获取request信息失败: {e}")
                raise

  
            # 获取用户
            user = None
            print("DEBUG: 开始获取user")
            if request:
                try:
                    user = request.user
                    print(f"DEBUG: 获取user = {user}")
                except Exception as e:
                    print(f"DEBUG: 获取user失败: {e}")

            print(f"DEBUG: 最终结果 - user = {user}, merchant_id = {merchant_id}")

            # 验证必要的数据
            if not user:
                raise serializers.ValidationError("用户未登录")
            if not merchant_id or merchant_id == 0:
                raise serializers.ValidationError("商户ID不能为空")

            # 计算订单总金额
            total_amount = 0
            try:
                print(f"DEBUG: 开始计算总金额，order_items_data = {order_items_data}")
                for item_data in order_items_data:
                    subtotal = item_data['price'] * item_data['quantity']
                    total_amount += subtotal
                print(f"DEBUG: 计算总金额 = {total_amount}")
            except Exception as e:
                print(f"DEBUG: 计算总金额失败: {e}")
                raise

            # 处理优惠券
            discount_amount = 0
            actual_amount = total_amount
            used_coupon = None

            if user_coupon_id:
                try:
                    print(f"DEBUG: 开始处理优惠券，user_coupon_id = {user_coupon_id}")
                    from django.utils import timezone
                    user_coupon = UserCoupon.objects.get(
                        id=user_coupon_id,
                        user=user,
                        status='unused'
                    )
                    print(f"DEBUG: 找到用户优惠券 = {user_coupon}")

                    # 检查优惠券是否可用
                    coupon = user_coupon.coupon
                    now = timezone.now()
                    if now < coupon.start_date or now > coupon.end_date:
                        raise serializers.ValidationError("优惠券不在有效期内")

                    if total_amount < coupon.min_amount:
                        raise serializers.ValidationError(f"订单金额不足，最低需消费{coupon.min_amount}元")

                    # 计算优惠金额
                    if coupon.coupon_type == 'deduction':
                        discount_amount = float(coupon.amount)
                    elif coupon.coupon_type == 'discount':
                        discount_amount = total_amount * (1 - float(coupon.amount))

                    actual_amount = total_amount - discount_amount
                    if actual_amount < 0:
                        actual_amount = 0

                    used_coupon = user_coupon
                    print(f"DEBUG: 优惠券处理完成，discount_amount = {discount_amount}")

                except UserCoupon.DoesNotExist:
                    raise serializers.ValidationError("优惠券不存在或已使用")

            # 创建订单 - 这里最容易出现问题
            print("DEBUG: 开始创建订单对象")
            try:
                print(f"DEBUG: 准备传入MerchantOrder.create的参数:")
                print(f"  - merchant_id: {merchant_id}")
                print(f"  - user: {user}")
                print(f"  - validated_data: {validated_data}")
                print(f"  - total_amount: {total_amount}")
                print(f"  - actual_amount: {actual_amount}")
                print(f"  - discount_amount: {discount_amount}")
                print(f"  - used_coupon: {used_coupon}")

                order = MerchantOrder.objects.create(
                    merchant_id=merchant_id,
                    user=user,
                    **validated_data,
                    total_amount=total_amount,
                    actual_amount=actual_amount,
                    discount_amount=discount_amount,
                    used_coupon=used_coupon,
                    status='new',
                    pickup_code=f"{random.randint(100000, 999999)}" if validated_data.get('pickup_type') == 'pickup' else ''
                )
                print(f"DEBUG: 成功创建订单 = {order}")
            except Exception as e:
                print(f"DEBUG: 创建订单失败: {e}")
                print(f"DEBUG: 错误类型 = {type(e)}")
                import traceback
                print(f"DEBUG: 错误堆栈: {traceback.format_exc()}")
                raise

            # 创建订单项
            try:
                print(f"DEBUG: 开始创建订单项")
                for item_data in order_items_data:
                    item = MerchantOrderItem.objects.create(
                        order=order,
                        product_id=item_data['product_id'],
                        product_name=item_data['product_name'],
                        product_price=item_data['price'],
                        quantity=item_data['quantity'],
                        subtotal=item_data['price'] * item_data['quantity']
                    )
                    print(f"DEBUG: 创建订单项 = {item}")
            except Exception as e:
                print(f"DEBUG: 创建订单项失败: {e}")
                raise

            # 标记优惠券为已使用
            if used_coupon:
                try:
                    print(f"DEBUG: 开始标记优惠券为已使用")
                    from django.utils import timezone
                    used_coupon.status = 'used'
                    used_coupon.used_order = order
                    used_coupon.used_at = timezone.now()
                    used_coupon.save()

                    # 更新优惠券使用计数
                    coupon = used_coupon.coupon
                    coupon.used_count += 1
                    coupon.save()
                    print(f"DEBUG: 优惠券标记完成")
                except Exception as e:
                    print(f"DEBUG: 标记优惠券失败: {e}")
                    raise

            print("DEBUG: create方法成功完成")
            return order

        except Exception as e:
            print(f"DEBUG: create方法执行失败: {e}")
            print(f"DEBUG: 错误类型 = {type(e)}")
            import traceback
            print(f"DEBUG: 完整错误堆栈: {traceback.format_exc()}")
            raise