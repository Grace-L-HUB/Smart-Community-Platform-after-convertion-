from django.db import models
from django.conf import settings # 引用 User 模型

# 1. 楼栋表
class Building(models.Model):
    name = models.CharField(max_length=50, verbose_name="楼栋名称") # 如 "1号楼"
    # 可以加一些描述、位置等
    
    def __str__(self):
        return self.name

# 2. 房屋表 (核心资产)
class House(models.Model):
    building = models.ForeignKey(Building, on_delete=models.CASCADE, verbose_name="所属楼栋")
    unit = models.CharField(max_length=10, verbose_name="单元号") # 如 "1单元"
    floor = models.IntegerField(verbose_name="楼层")
    room_number = models.CharField(max_length=10, verbose_name="门牌号") # 如 "101"
    area = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="面积")
    
    # 状态：自住、出租、空置
    status = models.SmallIntegerField(default=1, verbose_name="房屋状态") 

    class Meta:
        unique_together = ('building', 'unit', 'room_number') # 物理唯一性约束

    def __str__(self):
        return f"{self.building.name}-{self.unit}-{self.room_number}"

# 3. 房屋绑定申请表
class HouseBindingApplication(models.Model):
    IDENTITY_CHOICES = (
        (1, '业主'),
        (2, '家庭成员'),
        (3, '租客'),
    )
    STATUS_CHOICES = (
        (0, '待审核'),
        (1, '已通过'),
        (2, '已拒绝'),
    )

    # 申请人信息
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, verbose_name="申请用户")
    applicant_name = models.CharField(max_length=20, verbose_name="申请人姓名")
    applicant_phone = models.CharField(max_length=15, verbose_name="申请人手机号")
    id_card_number = models.CharField(max_length=18, verbose_name="身份证号")
    
    # 房屋信息 - 这里先用字符串存储，后续可以关联到House表
    community_name = models.CharField(max_length=100, default="阳光花园", verbose_name="社区名称")
    building_name = models.CharField(max_length=50, verbose_name="楼栋")
    unit_name = models.CharField(max_length=20, verbose_name="单元")
    room_number = models.CharField(max_length=20, verbose_name="房号")
    
    # 申请相关
    identity = models.SmallIntegerField(choices=IDENTITY_CHOICES, default=1, verbose_name="申请身份")
    status = models.SmallIntegerField(choices=STATUS_CHOICES, default=0, verbose_name="审核状态")
    
    # 时间戳
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="申请时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")
    audit_time = models.DateTimeField(null=True, blank=True, verbose_name="审核时间")
    auditor = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, blank=True, 
        related_name='audited_applications',
        verbose_name="审核人"
    )
    
    # 备注信息
    audit_remark = models.TextField(blank=True, verbose_name="审核备注")
    reject_reason = models.CharField(max_length=200, blank=True, verbose_name="拒绝原因")

    class Meta:
        verbose_name = "房屋绑定申请"
        verbose_name_plural = "房屋绑定申请"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.applicant_name} - {self.building_name}{self.unit_name}{self.room_number}"

# 4. 房屋-用户绑定关系表（审核通过后的正式绑定关系）
class HouseUserBinding(models.Model):
    IDENTITY_CHOICES = (
        (1, '业主'),
        (2, '家庭成员'),
        (3, '租客'),
    )
    STATUS_CHOICES = (
        (1, '已绑定'),
        (2, '已解绑'), # 软删除，保留历史记录
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='house_bindings')
    house = models.ForeignKey(House, on_delete=models.CASCADE, related_name='user_bindings', null=True, blank=True)
    application = models.OneToOneField(HouseBindingApplication, on_delete=models.CASCADE, verbose_name="关联申请")
    
    identity = models.SmallIntegerField(choices=IDENTITY_CHOICES, default=1, verbose_name="住户身份")
    status = models.SmallIntegerField(choices=STATUS_CHOICES, default=1, verbose_name="绑定状态")
    
    # 时间戳
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="绑定时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")

    class Meta:
        verbose_name = "住户绑定记录"
        verbose_name_plural = "住户绑定记录"
        ordering = ['-created_at']
