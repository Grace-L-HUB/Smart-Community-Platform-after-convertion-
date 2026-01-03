from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import uuid
import random

User = get_user_model()

class MerchantApplication(models.Model):
    """商户入驻申请"""
    
    STATUS_CHOICES = [
        ('pending', '待审核'),
        ('approved', '已通过'),
        ('rejected', '已拒绝'),
    ]
    
    CATEGORY_CHOICES = [
        ('convenience', '便利店'),
        ('catering', '餐饮'),
        ('beauty', '美容美发'),
        ('housekeeping', '家政服务'),
        ('repair', '维修服务'),
        ('bakery', '烘焙'),
        ('other', '其他'),
    ]
    
    # 申请人信息
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="申请人")
    
    # 商户基本信息
    shop_name = models.CharField(max_length=100, verbose_name="店铺名称")
    shop_category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, verbose_name="店铺分类")
    shop_phone = models.CharField(max_length=15, verbose_name="联系电话")
    shop_address = models.CharField(max_length=200, verbose_name="店铺地址")
    shop_description = models.TextField(max_length=500, verbose_name="店铺介绍")
    
    # 营业时间
    business_hours_start = models.TimeField(verbose_name="营业开始时间")
    business_hours_end = models.TimeField(verbose_name="营业结束时间")
    
    # 证照信息
    business_license = models.ImageField(upload_to='merchant/licenses/', verbose_name="营业执照")
    identity_card_front = models.ImageField(upload_to='merchant/identities/', verbose_name="身份证正面")
    identity_card_back = models.ImageField(upload_to='merchant/identities/', verbose_name="身份证背面")
    other_certificates = models.JSONField(default=list, blank=True, verbose_name="其他证件")  # 存储其他证件文件路径
    
    # 法人信息
    legal_name = models.CharField(max_length=50, verbose_name="法人姓名")
    legal_id_card = models.CharField(max_length=18, verbose_name="法人身份证号")
    legal_phone = models.CharField(max_length=15, verbose_name="法人手机号")
    
    # 审核信息
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name="审核状态")
    reviewer = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, 
        related_name='reviewed_merchant_applications', verbose_name="审核员"
    )
    review_comment = models.TextField(max_length=500, blank=True, verbose_name="审核意见")
    reviewed_at = models.DateTimeField(null=True, blank=True, verbose_name="审核时间")
    
    # 时间戳
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="申请时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")
    
    class Meta:
        verbose_name = "商户入驻申请"
        verbose_name_plural = "商户入驻申请"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.shop_name} - {self.get_status_display()}"
    
    def approve(self, reviewer, comment=""):
        """审核通过"""
        self.status = 'approved'
        self.reviewer = reviewer
        self.review_comment = comment
        self.reviewed_at = timezone.now()
        self.save()
        
        # 更新用户角色为商户
        self.user.role = 2  # 商户角色
        self.user.save()
    
    def reject(self, reviewer, comment):
        """审核拒绝"""
        self.status = 'rejected'
        self.reviewer = reviewer
        self.review_comment = comment
        self.reviewed_at = timezone.now()
        self.save()


class MerchantProfile(models.Model):
    """商户档案（审核通过后创建）"""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, verbose_name="关联用户")
    application = models.OneToOneField(MerchantApplication, on_delete=models.CASCADE, verbose_name="关联申请")
    
    # 店铺信息
    shop_name = models.CharField(max_length=100, verbose_name="店铺名称")
    shop_logo = models.ImageField(upload_to='merchant/logos/', null=True, blank=True, verbose_name="店铺Logo")
    shop_category = models.CharField(max_length=20, verbose_name="店铺分类")
    shop_phone = models.CharField(max_length=15, verbose_name="联系电话")
    shop_address = models.CharField(max_length=200, verbose_name="店铺地址")
    shop_description = models.TextField(max_length=500, verbose_name="店铺介绍")
    shop_announcement = models.TextField(max_length=200, blank=True, verbose_name="店铺公告")
    
    # 营业时间
    business_hours_start = models.TimeField(verbose_name="营业开始时间")
    business_hours_end = models.TimeField(verbose_name="营业结束时间")
    
    # 状态
    is_active = models.BooleanField(default=True, verbose_name="是否启用")
    
    # 统计信息
    total_orders = models.PositiveIntegerField(default=0, verbose_name="总订单数")
    total_revenue = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="总收入")
    
    # 时间戳
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")
    
    class Meta:
        verbose_name = "商户档案"
        verbose_name_plural = "商户档案"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.shop_name} ({self.user.username})"


class MerchantProduct(models.Model):
    """商品/服务模型"""
    
    STATUS_CHOICES = [
        ('online', '上架中'),
        ('offline', '已下架'),
    ]
    
    CATEGORY_CHOICES = [
        ('饮品', '饮品'),
        ('甜品', '甜品'),
        ('烘焙', '烘焙'),
        ('家政服务', '家政服务'),
        ('便民服务', '便民服务'),
        ('其他', '其他'),
    ]
    
    # 关联商户
    merchant = models.ForeignKey(MerchantProfile, on_delete=models.CASCADE, related_name='products', verbose_name="所属商户")
    
    # 基本信息
    name = models.CharField(max_length=100, verbose_name="商品名称")
    description = models.TextField(max_length=500, verbose_name="商品描述")
    image = models.ImageField(upload_to='merchant/products/', null=True, blank=True, verbose_name="商品图片")
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, verbose_name="商品分类")
    
    # 价格和库存
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="售价")
    original_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="原价")
    stock = models.PositiveIntegerField(default=0, verbose_name="库存")
    
    # 状态和统计
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='online', verbose_name="上架状态")
    sales_count = models.PositiveIntegerField(default=0, verbose_name="销售数量")
    
    # 服务时段（JSON字段，用于家政服务等）
    service_time_slots = models.JSONField(default=list, blank=True, verbose_name="服务时段")
    
    # 时间戳
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")
    
    class Meta:
        verbose_name = "商品/服务"
        verbose_name_plural = "商品/服务"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['merchant', 'status']),
            models.Index(fields=['category']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.merchant.shop_name})"
    
    def toggle_status(self):
        """切换上下架状态"""
        self.status = 'offline' if self.status == 'online' else 'online'
        self.save()


class MerchantCoupon(models.Model):
    """商户优惠券模型"""
    
    TYPE_CHOICES = [
        ('discount', '减价券'),
        ('deduction', '满减券'),
        ('gift', '赠品券'),
    ]
    
    STATUS_CHOICES = [
        ('active', '生效中'),
        ('inactive', '已停用'),
        ('expired', '已过期'),
    ]
    
    # 关联商户
    merchant = models.ForeignKey(MerchantProfile, on_delete=models.CASCADE, related_name='coupons', verbose_name="所属商户")
    
    # 基本信息
    name = models.CharField(max_length=100, verbose_name="优惠券名称")
    description = models.TextField(max_length=300, verbose_name="使用说明")
    coupon_type = models.CharField(max_length=20, choices=TYPE_CHOICES, verbose_name="券类型")
    
    # 优惠规则
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="优惠金额")
    min_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="最低消费金额")
    
    # 数量和使用限制
    total_count = models.PositiveIntegerField(verbose_name="发行数量")
    used_count = models.PositiveIntegerField(default=0, verbose_name="已使用数量")
    per_user_limit = models.PositiveIntegerField(default=1, verbose_name="每用户限领数量")
    
    # 时间设置
    start_date = models.DateTimeField(verbose_name="开始时间")
    end_date = models.DateTimeField(verbose_name="结束时间")
    
    # 状态
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active', verbose_name="状态")
    
    # 时间戳
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")
    
    class Meta:
        verbose_name = "商户优惠券"
        verbose_name_plural = "商户优惠券"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['merchant', 'status']),
            models.Index(fields=['start_date', 'end_date']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.merchant.shop_name}"
    
    @property
    def remaining_count(self):
        """剩余数量"""
        return max(0, self.total_count - self.used_count)
    
    @property
    def is_valid(self):
        """是否有效"""
        from django.utils import timezone
        now = timezone.now()
        return (
            self.status == 'active' and
            self.start_date <= now <= self.end_date and
            self.remaining_count > 0
        )


class UserCoupon(models.Model):
    """用户优惠券（领取记录）"""
    
    STATUS_CHOICES = [
        ('unused', '未使用'),
        ('used', '已使用'),
        ('expired', '已过期'),
    ]
    
    # 关联
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="用户")
    coupon = models.ForeignKey(MerchantCoupon, on_delete=models.CASCADE, verbose_name="优惠券")
    
    # 状态和码
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='unused', verbose_name="使用状态")
    verification_code = models.CharField(max_length=32, unique=True, verbose_name="核销码")
    
    # 使用信息
    used_at = models.DateTimeField(null=True, blank=True, verbose_name="使用时间")
    used_order = models.ForeignKey('MerchantOrder', on_delete=models.SET_NULL, null=True, blank=True, verbose_name="使用订单")
    
    # 时间戳
    received_at = models.DateTimeField(auto_now_add=True, verbose_name="领取时间")
    
    class Meta:
        verbose_name = "用户优惠券"
        verbose_name_plural = "用户优惠券"
        ordering = ['-received_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['verification_code']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.coupon.name}"
    
    def save(self, *args, **kwargs):
        if not self.verification_code:
            import uuid
            self.verification_code = uuid.uuid4().hex[:12].upper()
        super().save(*args, **kwargs)
    
    def use_coupon(self, order=None):
        """使用优惠券"""
        from django.utils import timezone
        self.status = 'used'
        self.used_at = timezone.now()
        if order:
            self.used_order = order
        self.save()


class MerchantOrder(models.Model):
    """商户订单模型"""
    
    STATUS_CHOICES = [
        ('new', '新订单'),
        ('accepted', '已接单'),
        ('preparing', '准备中'),
        ('ready', '待取餐'),
        ('completed', '已完成'),
        ('cancelled', '已取消'),
        ('refunded', '已退款'),
    ]
    
    PICKUP_TYPE_CHOICES = [
        ('pickup', '到店自取'),
        ('delivery', '外送'),
    ]
    
    # 关联信息
    merchant = models.ForeignKey(MerchantProfile, on_delete=models.CASCADE, related_name='orders', verbose_name="商户")
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="下单用户")
    
    # 订单基本信息
    order_no = models.CharField(max_length=32, unique=True, verbose_name="订单号")
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="订单总金额")
    actual_amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="实付金额")
    
    # 订单状态
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new', verbose_name="订单状态")
    pickup_type = models.CharField(max_length=20, choices=PICKUP_TYPE_CHOICES, default='pickup', verbose_name="取餐方式")
    
    # 联系信息
    contact_name = models.CharField(max_length=50, verbose_name="联系人")
    contact_phone = models.CharField(max_length=15, verbose_name="联系电话")
    address = models.CharField(max_length=200, blank=True, verbose_name="送餐地址")
    
    # 核销信息
    pickup_code = models.CharField(max_length=6, blank=True, verbose_name="取餐码")
    
    # 优惠信息
    used_coupon = models.ForeignKey(UserCoupon, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="使用的优惠券")
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="优惠金额")
    
    # 备注
    note = models.TextField(max_length=500, blank=True, verbose_name="订单备注")
    reject_reason = models.TextField(max_length=200, blank=True, verbose_name="拒单原因")
    
    # 时间戳
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="下单时间")
    accepted_at = models.DateTimeField(null=True, blank=True, verbose_name="接单时间")
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name="完成时间")
    
    class Meta:
        verbose_name = "商户订单"
        verbose_name_plural = "商户订单"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['merchant', 'status']),
            models.Index(fields=['user', 'status']),
            models.Index(fields=['pickup_code']),
            models.Index(fields=['order_no']),
        ]
    
    def __str__(self):
        return f"{self.order_no} - {self.merchant.shop_name}"
    
    def save(self, *args, **kwargs):
        import time
        if not self.order_no:
            timestamp = str(int(time.time()))[-8:]
            random_num = str(random.randint(100, 999))
            self.order_no = f"ORD{timestamp}{random_num}"

        if not self.pickup_code and self.status in ['accepted', 'preparing']:
            self.pickup_code = str(random.randint(100000, 999999))

        super().save(*args, **kwargs)
    
    def accept_order(self):
        """接单"""
        from django.utils import timezone
        self.status = 'accepted'
        self.accepted_at = timezone.now()
        self.save()
    
    def complete_order(self):
        """完成订单"""
        from django.utils import timezone
        self.status = 'completed'
        self.completed_at = timezone.now()
        self.save()


class MerchantOrderItem(models.Model):
    """订单商品明细"""
    
    # 关联
    order = models.ForeignKey(MerchantOrder, on_delete=models.CASCADE, related_name='items', verbose_name="订单")
    product = models.ForeignKey(MerchantProduct, on_delete=models.CASCADE, verbose_name="商品")
    
    # 商品信息快照（防止商品信息变化影响历史订单）
    product_name = models.CharField(max_length=100, verbose_name="商品名称")
    product_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="商品单价")
    quantity = models.PositiveIntegerField(verbose_name="购买数量")
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="小计金额")
    
    # 规格信息（JSON存储）
    specifications = models.JSONField(default=dict, blank=True, verbose_name="商品规格")
    
    class Meta:
        verbose_name = "订单商品"
        verbose_name_plural = "订单商品"
    
    def __str__(self):
        return f"{self.order.order_no} - {self.product_name}"

    def save(self, *args, **kwargs):
        # 自动计算小计
        self.subtotal = self.product_price * self.quantity
        super().save(*args, **kwargs)


class CartItem(models.Model):
    """购物车条目模型"""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cart_items', verbose_name="用户")
    merchant = models.ForeignKey(MerchantProfile, on_delete=models.CASCADE, related_name='cart_items', verbose_name="商户")
    product = models.ForeignKey(MerchantProduct, on_delete=models.CASCADE, verbose_name="商品")

    quantity = models.PositiveIntegerField(default=1, verbose_name="数量")

    # 商品信息快照
    product_name = models.CharField(max_length=100, verbose_name="商品名称")
    product_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="商品单价")
    product_image = models.CharField(max_length=500, blank=True, verbose_name="商品图片")

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="添加时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")

    class Meta:
        db_table = 'merchant_cart_item'
        verbose_name = "购物车条目"
        verbose_name_plural = "购物车管理"
        # 同一用户对同一商户的同一商品只能有一条记录
        unique_together = [['user', 'merchant', 'product']]
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.display_name} - {self.product_name}"