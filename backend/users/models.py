from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

# Create your models here.
class User(AbstractUser):
    # 基本信息
    phone = models.CharField(max_length=15, unique=True, null=True, blank=True, verbose_name="手机号")
    openid = models.CharField(max_length=64, unique=True, null=True, blank=True, verbose_name="微信OpenID")
    nickname = models.CharField(max_length=50, null=True, blank=True, verbose_name="昵称")
    avatar = models.CharField(max_length=500, null=True, blank=True, verbose_name="头像")
    
    # 个人信息
    GENDER_CHOICES = [
        (0, '未知'),
        (1, '男'),
        (2, '女')
    ]
    gender = models.SmallIntegerField(choices=GENDER_CHOICES, default=0, verbose_name="性别")
    birthday = models.DateField(null=True, blank=True, verbose_name="生日")
    real_name = models.CharField(max_length=20, null=True, blank=True, verbose_name="真实姓名")
    
    # 地址信息
    province = models.CharField(max_length=50, null=True, blank=True, verbose_name="省份")
    city = models.CharField(max_length=50, null=True, blank=True, verbose_name="城市")
    district = models.CharField(max_length=50, null=True, blank=True, verbose_name="区县")
    address = models.CharField(max_length=200, null=True, blank=True, verbose_name="详细地址")
    
    # 身份和权限
    ROLE_CHOICES = [
        (0, '普通居民'),
        (1, '物业人员'),
        (2, '商户'),
        (3, '管理员')
    ]
    role = models.SmallIntegerField(choices=ROLE_CHOICES, default=0, verbose_name="角色")
    
    # 注册方式
    REGISTER_TYPE_CHOICES = [
        (1, '手机注册'),
        (2, '微信注册'),
        (3, '后台创建')
    ]
    register_type = models.SmallIntegerField(choices=REGISTER_TYPE_CHOICES, default=1, verbose_name="注册方式")
    
    # 状态管理
    is_verified = models.BooleanField(default=False, verbose_name="是否实名认证")
    is_banned = models.BooleanField(default=False, verbose_name="是否被禁用")
    ban_reason = models.CharField(max_length=200, null=True, blank=True, verbose_name="禁用原因")
    
    # 时间戳
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")
    last_login_ip = models.GenericIPAddressField(null=True, blank=True, verbose_name="最后登录IP")

    class Meta:
        db_table = 'sys_user' # 自定义表名
        ordering = ['-created_at']
        verbose_name = "用户"
        verbose_name_plural = "用户管理"

    def __str__(self):
        return self.nickname or self.username or self.phone or f"用户{self.id}"
    
    @property
    def display_name(self):
        """显示名称（优先级：昵称 > 真实姓名 > 用户名 > 手机号）"""
        return self.nickname or self.real_name or self.username or self.phone
    
    @property
    def is_phone_user(self):
        """是否为手机注册用户"""
        return self.register_type == 1 and bool(self.phone)
    
    @property
    def is_wechat_user(self):
        """是否为微信注册用户"""
        return self.register_type == 2 and bool(self.openid)
    
    @property
    def age(self):
        """计算年龄"""
        if self.birthday:
            today = timezone.now().date()
            return today.year - self.birthday.year - ((today.month, today.day) < (self.birthday.month, self.birthday.day))
        return None
    
    def get_full_address(self):
        """获取完整地址"""
        parts = [self.province, self.city, self.district, self.address]
        return ''.join(filter(None, parts))
    
    def can_access_admin(self):
        """是否可以访问后台管理"""
        return self.role >= 1 and not self.is_banned
