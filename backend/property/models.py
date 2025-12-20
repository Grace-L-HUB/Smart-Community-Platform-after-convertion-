from django.db import models
from django.conf import settings # 引用 User 模型
from django.utils import timezone
import uuid

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


# 5. 访客邀请表
class Visitor(models.Model):
    STATUS_CHOICES = (
        ('pending', '待访问'),
        ('visited', '已访问'),
        ('expired', '已过期'),
        ('cancelled', '已取消'),
    )

    # 基本信息
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, verbose_name="访客姓名")
    phone = models.CharField(max_length=15, verbose_name="访客手机号")
    car_number = models.CharField(max_length=20, blank=True, verbose_name="车牌号")
    
    # 访问信息
    visit_time = models.DateTimeField(verbose_name="访问时间")
    remark = models.TextField(blank=True, verbose_name="备注")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name="状态")
    
    # 邀请人信息
    inviter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, verbose_name="邀请人")
    
    # 二维码相关
    qr_code_token = models.CharField(max_length=100, unique=True, verbose_name="二维码令牌")
    qr_code_expires_at = models.DateTimeField(verbose_name="二维码过期时间")
    
    # 时间戳
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")
    
    # 访问记录
    visit_actual_time = models.DateTimeField(null=True, blank=True, verbose_name="实际访问时间")

    class Meta:
        verbose_name = "访客邀请"
        verbose_name_plural = "访客邀请"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.inviter.nickname}"

    def save(self, *args, **kwargs):
        # 生成二维码令牌
        if not self.qr_code_token:
            self.qr_code_token = str(uuid.uuid4())
        
        # 设置二维码过期时间（访问日期当天的23:59:59）
        if not self.qr_code_expires_at:
            # 如果 visit_time 是日期，设置为当天的最后一秒
            if self.visit_time:
                expire_date = self.visit_time.date()
                self.qr_code_expires_at = timezone.make_aware(
                    timezone.datetime.combine(expire_date, timezone.datetime.max.time()).replace(microsecond=0)
                )
            else:
                # 如果没有访问时间，默认1天后过期
                self.qr_code_expires_at = timezone.now() + timezone.timedelta(days=1)
        
        super().save(*args, **kwargs)
    
    def is_qr_code_expired(self):
        """检查二维码是否过期"""
        return timezone.now() > self.qr_code_expires_at
    
    def get_qr_code_data(self):
        """获取二维码数据（简化版，减少数据量）"""
        return {
            'type': 'v',  # visitor的缩写
            'id': str(self.id),
            'token': self.qr_code_token
        }
    
    def get_qr_code_simple_string(self):
        """获取更简洁的二维码字符串"""
        # 格式: v|visitor_id|token
        return f"v|{str(self.id)}|{self.qr_code_token}"


# 6. 车位表 (核心资产)
class ParkingSpace(models.Model):
    PARKING_TYPE_CHOICES = (
        ('owned', '自有车位'),
        ('rented', '租赁车位'),
    )
    
    area_name = models.CharField(max_length=50, verbose_name="停车区域") # 如 "A区地下停车场"
    space_number = models.CharField(max_length=20, verbose_name="车位号") # 如 "A-001"
    parking_type = models.CharField(max_length=10, choices=PARKING_TYPE_CHOICES, default='owned', verbose_name="车位类型")
    
    # 状态：空闲、已占用、维修中
    status = models.SmallIntegerField(default=1, verbose_name="车位状态")

    class Meta:
        unique_together = ('area_name', 'space_number') # 物理唯一性约束
        verbose_name = "车位"
        verbose_name_plural = "车位"

    def __str__(self):
        return f"{self.area_name}-{self.space_number}"


# 7. 车位绑定申请表
class ParkingBindingApplication(models.Model):
    PARKING_TYPE_CHOICES = (
        ('owned', '自有车位'),
        ('rented', '租赁车位'),
    )
    STATUS_CHOICES = (
        (0, '待审核'),
        (1, '已通过'),
        (2, '已拒绝'),
    )

    # 申请人信息
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, verbose_name="申请用户")
    owner_name = models.CharField(max_length=20, verbose_name="车主姓名")
    owner_phone = models.CharField(max_length=15, verbose_name="车主手机号")
    id_card = models.CharField(max_length=18, verbose_name="身份证号")
    
    # 车位信息
    community_name = models.CharField(max_length=100, default="阳光花园", verbose_name="社区名称")
    parking_type = models.CharField(max_length=10, choices=PARKING_TYPE_CHOICES, default='owned', verbose_name="车位类型")
    parking_area = models.CharField(max_length=50, verbose_name="停车区域")
    parking_no = models.CharField(max_length=20, verbose_name="车位号")
    
    # 车辆信息
    car_no = models.CharField(max_length=20, verbose_name="车牌号")
    car_brand = models.CharField(max_length=50, blank=True, verbose_name="车辆品牌")
    car_color = models.CharField(max_length=20, blank=True, verbose_name="车辆颜色")
    
    # 申请相关
    identity = models.SmallIntegerField(choices=[(1, '业主'), (3, '租客')], default=1, verbose_name="申请身份")
    status = models.SmallIntegerField(choices=STATUS_CHOICES, default=0, verbose_name="审核状态")
    
    # 时间戳
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="申请时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")
    audit_time = models.DateTimeField(null=True, blank=True, verbose_name="审核时间")
    auditor = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, blank=True, 
        related_name='audited_parking_applications',
        verbose_name="审核人"
    )
    
    # 备注信息
    audit_remark = models.TextField(blank=True, verbose_name="审核备注")
    reject_reason = models.CharField(max_length=200, blank=True, verbose_name="拒绝原因")

    class Meta:
        verbose_name = "车位绑定申请"
        verbose_name_plural = "车位绑定申请"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.owner_name} - {self.parking_area}{self.parking_no} ({self.car_no})"


# 8. 车位-用户绑定关系表（审核通过后的正式绑定关系）
class ParkingUserBinding(models.Model):
    STATUS_CHOICES = (
        (1, '已绑定'),
        (2, '已解绑'), # 软删除，保留历史记录
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='parking_bindings')
    parking_space = models.ForeignKey(ParkingSpace, on_delete=models.CASCADE, related_name='user_bindings', null=True, blank=True)
    application = models.OneToOneField(ParkingBindingApplication, on_delete=models.CASCADE, verbose_name="关联申请")
    
    identity = models.SmallIntegerField(choices=[(1, '业主'), (3, '租客')], default=1, verbose_name="绑定身份")
    status = models.SmallIntegerField(choices=STATUS_CHOICES, default=1, verbose_name="绑定状态")
    
    # 时间戳
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="绑定时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")

    class Meta:
        verbose_name = "车位绑定记录"
        verbose_name_plural = "车位绑定记录"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.application.owner_name} - {self.application.parking_area}{self.application.parking_no}"


# ===== 公告管理模型 =====

class Announcement(models.Model):
    """公告模型"""
    STATUS_CHOICES = (
        ('draft', '草稿'),
        ('published', '已发布'),
        ('withdrawn', '已撤回'),
    )
    
    SCOPE_CHOICES = (
        ('all', '全员'),
        ('building', '指定楼栋'),
    )
    
    CATEGORY_CHOICES = (
        ('property_notice', '物业通知'),
        ('community_news', '社区新闻'),
        ('warm_tips', '温馨提示'),
    )
    
    # 基本信息
    title = models.CharField(max_length=200, verbose_name="公告标题")
    content = models.TextField(verbose_name="公告内容")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', verbose_name="状态")
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='property_notice', verbose_name="公告分类")
    
    # 发送范围
    scope = models.CharField(max_length=20, choices=SCOPE_CHOICES, default='all', verbose_name="发送范围")
    target_buildings = models.JSONField(blank=True, null=True, verbose_name="目标楼栋")  # 存储楼栋列表
    
    # 作者信息
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='announcements',
        null=True, 
        blank=True,
        verbose_name="作者"
    )
    author_name = models.CharField(max_length=50, verbose_name="作者姓名")  # 冗余字段，方便显示
    
    # 时间信息
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")
    published_at = models.DateTimeField(null=True, blank=True, verbose_name="发布时间")
    withdrawn_at = models.DateTimeField(null=True, blank=True, verbose_name="撤回时间")
    
    # 统计信息
    read_count = models.IntegerField(default=0, verbose_name="阅读次数")

    class Meta:
        verbose_name = "公告"
        verbose_name_plural = "公告"
        ordering = ['-created_at']

    def __str__(self):
        author_display = self.author_name if self.author_name else (self.author.nickname if self.author else '系统')
        return f"{self.title} - {self.get_status_display()} - {author_display}"
    
    def publish(self):
        """发布公告"""
        if self.status == 'draft':
            self.status = 'published'
            self.published_at = timezone.now()
            self.save()
    
    def withdraw(self):
        """撤回公告"""
        if self.status == 'published':
            self.status = 'withdrawn'
            self.withdrawn_at = timezone.now()
            self.save()


# ===== 报修工单管理模型 =====

class RepairOrder(models.Model):
    """报修工单模型"""
    STATUS_CHOICES = (
        ('pending', '待受理'),
        ('processing', '处理中'),
        ('completed', '已完成'),
        ('rejected', '已驳回'),
    )
    
    TYPE_CHOICES = (
        ('water', '水电'),
        ('electric', '电气'),
        ('door', '门窗'),
        ('public', '公区'),
        ('other', '其他'),
    )
    
    PRIORITY_CHOICES = (
        ('low', '一般'),
        ('medium', '紧急'),
        ('high', '非常紧急'),
    )
    
    REPAIR_CATEGORY_CHOICES = (
        ('public', '公共区域'),
        ('household', '入户维修'),
    )
    
    # 基本信息
    order_no = models.CharField(max_length=20, unique=True, verbose_name="工单号")
    category = models.CharField(max_length=20, choices=REPAIR_CATEGORY_CHOICES, default='household', verbose_name="报修类别")
    repair_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='other', verbose_name="报修类型")
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='low', verbose_name="紧急程度")
    
    # 报修内容
    summary = models.CharField(max_length=200, verbose_name="问题摘要")
    description = models.TextField(verbose_name="详细描述")
    location = models.CharField(max_length=200, verbose_name="报修位置")
    
    # 报修人信息
    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='repair_orders',
        verbose_name="报修人"
    )
    reporter_name = models.CharField(max_length=50, verbose_name="报修人姓名")
    reporter_phone = models.CharField(max_length=15, verbose_name="联系电话")
    
    # 工单状态
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name="工单状态")
    
    # 处理信息
    assignee = models.CharField(max_length=50, blank=True, verbose_name="派单给")
    assigned_at = models.DateTimeField(null=True, blank=True, verbose_name="派单时间")
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='assigned_repair_orders',
        verbose_name="派单人"
    )
    
    # 完成信息
    result = models.TextField(blank=True, verbose_name="处理结果")
    cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="维修费用")
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name="完成时间")
    
    # 时间戳
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="提交时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")
    
    # 评价相关
    is_rated = models.BooleanField(default=False, verbose_name="是否已评价")
    rating = models.IntegerField(null=True, blank=True, verbose_name="评分")
    rating_comment = models.TextField(blank=True, verbose_name="评价内容")
    rated_at = models.DateTimeField(null=True, blank=True, verbose_name="评价时间")
    
    class Meta:
        verbose_name = "报修工单"
        verbose_name_plural = "报修工单"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.order_no} - {self.summary}"
    
    def save(self, *args, **kwargs):
        # 自动生成工单号
        if not self.order_no:
            import datetime
            today = datetime.date.today()
            date_str = today.strftime('%Y%m%d')
            # 获取当天最后一个工单号
            last_order = RepairOrder.objects.filter(
                order_no__startswith=f'WO{date_str}'
            ).order_by('-order_no').first()
            
            if last_order:
                # 提取序号并+1
                last_seq = int(last_order.order_no[-3:])
                new_seq = last_seq + 1
            else:
                new_seq = 1
            
            self.order_no = f'WO{date_str}{new_seq:03d}'
        
        super().save(*args, **kwargs)
    
    def assign_to(self, assignee_name, assigned_by_user):
        """派单"""
        self.assignee = assignee_name
        self.assigned_by = assigned_by_user
        self.assigned_at = timezone.now()
        self.status = 'processing'
        self.save()
    
    def complete_order(self, result, cost=None):
        """完成工单"""
        self.result = result
        if cost is not None:
            self.cost = cost
        self.status = 'completed'
        self.completed_at = timezone.now()
        self.save()
    
    def reject_order(self):
        """驳回工单"""
        self.status = 'rejected'
        self.save()


class RepairOrderImage(models.Model):
    """报修工单图片模型"""
    order = models.ForeignKey(RepairOrder, on_delete=models.CASCADE, related_name='images', verbose_name="关联工单")
    image = models.CharField(max_length=500, verbose_name="图片URL")  # 存储图片URL
    image_type = models.CharField(max_length=10, choices=(('image', '图片'), ('video', '视频')), default='image', verbose_name="文件类型")
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name="上传时间")
    
    class Meta:
        verbose_name = "报修工单图片"
        verbose_name_plural = "报修工单图片"
        ordering = ['uploaded_at']
    
    def __str__(self):
        return f"{self.order.order_no} - 图片{self.id}"


class RepairEmployee(models.Model):
    """维修人员模型"""
    name = models.CharField(max_length=50, verbose_name="姓名")
    phone = models.CharField(max_length=15, verbose_name="联系电话")
    speciality = models.CharField(max_length=100, verbose_name="专业领域")  # 如"水电维修"、"门窗维修"等
    is_active = models.BooleanField(default=True, verbose_name="是否在职")
    
    # 统计信息
    total_orders = models.IntegerField(default=0, verbose_name="总工单数")
    completed_orders = models.IntegerField(default=0, verbose_name="已完成工单数")
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0, verbose_name="平均评分")
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")
    
    class Meta:
        verbose_name = "维修人员"
        verbose_name_plural = "维修人员"
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} - {self.speciality}"