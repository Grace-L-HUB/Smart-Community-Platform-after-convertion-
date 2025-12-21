from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import uuid

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
