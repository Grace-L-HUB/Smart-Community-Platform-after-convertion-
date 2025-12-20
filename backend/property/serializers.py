from rest_framework import serializers
from .models import (
    HouseBindingApplication, HouseUserBinding, House, Building, Visitor,
    ParkingBindingApplication, ParkingUserBinding, ParkingSpace, Announcement,
    RepairOrder, RepairOrderImage, RepairEmployee
)
from django.utils import timezone


class HouseBindingApplicationSerializer(serializers.ModelSerializer):
    """房屋绑定申请序列化器"""
    
    class Meta:
        model = HouseBindingApplication
        fields = [
            'id', 'applicant_name', 'applicant_phone', 'id_card_number',
            'community_name', 'building_name', 'unit_name', 'room_number',
            'identity', 'status', 'created_at', 'audit_remark', 'reject_reason'
        ]
        read_only_fields = ['id', 'status', 'created_at', 'audit_remark', 'reject_reason']

    def validate_applicant_phone(self, value):
        """校验手机号格式"""
        import re
        if not re.match(r'^1[3-9]\d{9}$', value):
            raise serializers.ValidationError("手机号格式不正确")
        return value

    def validate_id_card_number(self, value):
        """校验身份证号格式"""
        import re
        if not re.match(r'(^\d{15}$)|(^\d{17}(\d|X|x)$)', value):
            raise serializers.ValidationError("身份证号格式不正确")
        return value


class HouseBindingApplicationListSerializer(serializers.ModelSerializer):
    """房屋绑定申请列表序列化器（用于管理员查看）"""
    user_info = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    identity_display = serializers.CharField(source='get_identity_display', read_only=True)
    
    class Meta:
        model = HouseBindingApplication
        fields = [
            'id', 'applicant_name', 'applicant_phone', 'id_card_number',
            'community_name', 'building_name', 'unit_name', 'room_number',
            'identity', 'identity_display', 'status', 'status_display', 
            'created_at', 'updated_at', 'audit_time', 'audit_remark', 
            'reject_reason', 'user_info'
        ]
    
    def get_user_info(self, obj):
        """获取申请用户信息"""
        return {
            'id': obj.user.id,
            'nickname': obj.user.nickname,
            'avatar_url': obj.user.avatar.url if obj.user.avatar else None
        }


class HouseUserBindingSerializer(serializers.ModelSerializer):
    """用户房屋绑定关系序列化器"""
    house_info = serializers.SerializerMethodField()
    applicant_info = serializers.SerializerMethodField()
    identity_display = serializers.CharField(source='get_identity_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = HouseUserBinding
        fields = [
            'id', 'identity', 'identity_display', 'status', 'status_display',
            'created_at', 'house_info', 'applicant_info'
        ]
    
    def get_house_info(self, obj):
        """获取房屋信息"""
        if obj.application:
            return {
                'community_name': obj.application.community_name,
                'building_name': obj.application.building_name,
                'unit_name': obj.application.unit_name,
                'room_number': obj.application.room_number,
                'full_address': f"{obj.application.building_name}{obj.application.unit_name}{obj.application.room_number}"
            }
        elif obj.house:
            return {
                'community_name': "阳光花园",  # 临时硬编码
                'building_name': obj.house.building.name,
                'unit_name': obj.house.unit,
                'room_number': obj.house.room_number,
                'full_address': f"{obj.house.building.name}{obj.house.unit}{obj.house.room_number}"
            }
        return None
    
    def get_applicant_info(self, obj):
        """获取申请人信息"""
        if obj.application:
            return {
                'name': obj.application.applicant_name,
                'phone': obj.application.applicant_phone,
                'id_card': obj.application.id_card_number
            }
        return {
            'name': 'N/A',
            'phone': 'N/A', 
            'id_card': 'N/A'
        }


class VisitorCreateSerializer(serializers.ModelSerializer):
    """访客邀请创建序列化器"""
    visit_time = serializers.DateField(help_text="访问日期，格式：YYYY-MM-DD")
    
    class Meta:
        model = Visitor
        fields = [
            'name', 'phone', 'car_number', 'visit_time', 'remark'
        ]
    
    def validate_phone(self, value):
        """校验手机号格式"""
        import re
        if not re.match(r'^1[3-9]\d{9}$', value):
            raise serializers.ValidationError("手机号格式不正确")
        return value
    
    def create(self, validated_data):
        """创建访客邀请"""
        # 将date转换为datetime（设置为中午12点）
        visit_date = validated_data['visit_time']
        if hasattr(visit_date, 'year'):  # 确保是date对象
            from datetime import datetime
            visit_datetime = timezone.make_aware(
                datetime.combine(visit_date, datetime.min.time().replace(hour=12))
            )
            validated_data['visit_time'] = visit_datetime
        
        return super().create(validated_data)
    
    def validate_visit_time(self, value):
        """校验访问日期"""
        from datetime import date
        
        # DateField会自动处理日期解析，value应该是date对象
        if isinstance(value, str):
            raise serializers.ValidationError("日期格式不正确，请使用 YYYY-MM-DD 格式")
        
        # 检查是否是今天或未来日期
        today = timezone.now().date()
        
        if value < today:
            raise serializers.ValidationError("访问日期必须是今天或未来日期")
        
        return value


class VisitorListSerializer(serializers.ModelSerializer):
    """访客列表序列化器"""
    status_text = serializers.SerializerMethodField()
    qr_code_expired = serializers.SerializerMethodField()
    visit_time = serializers.SerializerMethodField()
    
    class Meta:
        model = Visitor
        fields = [
            'id', 'name', 'phone', 'car_number', 'visit_time', 'remark',
            'status', 'status_text', 'created_at', 'qr_code_expired',
            'visit_actual_time'
        ]
    
    def get_visit_time(self, obj):
        """获取格式化的访问日期"""
        if obj.visit_time:
            return obj.visit_time.strftime('%Y-%m-%d')
        return None
    
    def get_status_text(self, obj):
        """获取状态文本"""
        status_map = {
            'pending': '待访问',
            'visited': '已访问', 
            'expired': '已过期',
            'cancelled': '已取消'
        }
        return status_map.get(obj.status, obj.status)
    
    def get_qr_code_expired(self, obj):
        """检查二维码是否过期"""
        return obj.is_qr_code_expired()


class VisitorDetailSerializer(serializers.ModelSerializer):
    """访客详情序列化器"""
    status_text = serializers.SerializerMethodField()
    qr_code_data = serializers.SerializerMethodField()
    qr_code_expired = serializers.SerializerMethodField()
    inviter_info = serializers.SerializerMethodField()
    visit_time = serializers.SerializerMethodField()
    
    class Meta:
        model = Visitor
        fields = [
            'id', 'name', 'phone', 'car_number', 'visit_time', 'remark',
            'status', 'status_text', 'created_at', 'updated_at',
            'qr_code_data', 'qr_code_expired', 'qr_code_expires_at',
            'visit_actual_time', 'inviter_info'
        ]
    
    def get_visit_time(self, obj):
        """获取格式化的访问日期"""
        if obj.visit_time:
            return obj.visit_time.strftime('%Y-%m-%d')
        return None
    
    def get_status_text(self, obj):
        """获取状态文本"""
        status_map = {
            'pending': '待访问',
            'visited': '已访问',
            'expired': '已过期', 
            'cancelled': '已取消'
        }
        return status_map.get(obj.status, obj.status)
    
    def get_qr_code_data(self, obj):
        """获取二维码数据"""
        return obj.get_qr_code_data()
    
    def get_qr_code_expired(self, obj):
        """检查二维码是否过期"""
        return obj.is_qr_code_expired()
    
    def get_inviter_info(self, obj):
        """获取邀请人信息"""
        return {
            'id': obj.inviter.id,
            'nickname': obj.inviter.nickname,
            'phone': obj.inviter.phone
        }


# ===== 车位绑定相关序列化器 =====

class ParkingBindingApplicationSerializer(serializers.ModelSerializer):
    """车位绑定申请序列化器"""
    
    class Meta:
        model = ParkingBindingApplication
        fields = [
            'id', 'owner_name', 'owner_phone', 'id_card',
            'community_name', 'parking_type', 'parking_area', 'parking_no',
            'car_no', 'car_brand', 'car_color', 'identity',
            'status', 'created_at', 'audit_remark', 'reject_reason'
        ]
        read_only_fields = ['id', 'status', 'created_at', 'audit_remark', 'reject_reason']

    def validate_owner_phone(self, value):
        """校验手机号格式"""
        import re
        if not re.match(r'^1[3-9]\d{9}$', value):
            raise serializers.ValidationError("手机号格式不正确")
        return value

    def validate_id_card(self, value):
        """校验身份证号格式"""
        import re
        if not re.match(r'(^\d{15}$)|(^\d{17}(\d|X|x)$)', value):
            raise serializers.ValidationError("身份证号格式不正确")
        return value

    def validate_car_no(self, value):
        """校验车牌号格式"""
        import re
        car_no_pattern = r'^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-HJ-NP-Z0-9]{4,5}[A-HJ-NP-Z0-9挂学警港澳]$'
        if not re.match(car_no_pattern, value):
            raise serializers.ValidationError("车牌号格式不正确")
        return value


class ParkingBindingApplicationListSerializer(serializers.ModelSerializer):
    """车位绑定申请列表序列化器（用于管理员查看）"""
    user_info = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    parking_type_display = serializers.CharField(source='get_parking_type_display', read_only=True)
    identity_display = serializers.CharField(source='get_identity_display', read_only=True)
    
    class Meta:
        model = ParkingBindingApplication
        fields = [
            'id', 'owner_name', 'owner_phone', 'id_card',
            'community_name', 'parking_type', 'parking_type_display', 
            'parking_area', 'parking_no', 'car_no', 'car_brand', 'car_color',
            'identity', 'identity_display', 'status', 'status_display', 
            'created_at', 'updated_at', 'audit_time', 'audit_remark', 'reject_reason', 'user_info'
        ]
    
    def get_user_info(self, obj):
        """获取申请用户信息"""
        return {
            'id': obj.user.id,
            'nickname': obj.user.nickname,
            'avatar_url': obj.user.avatar.url if obj.user.avatar else None
        }


class ParkingUserBindingSerializer(serializers.ModelSerializer):
    """用户车位绑定关系序列化器"""
    parking_info = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    identity_display = serializers.CharField(source='get_identity_display', read_only=True)
    
    class Meta:
        model = ParkingUserBinding
        fields = [
            'id', 'identity', 'identity_display', 'status', 'status_display', 'created_at', 'parking_info'
        ]
    
    def get_parking_info(self, obj):
        """获取车位信息"""
        if obj.application:
            return {
                'community_name': obj.application.community_name,
                'parking_type': obj.application.parking_type,
                'parking_type_display': obj.application.get_parking_type_display(),
                'parking_area': obj.application.parking_area,
                'parking_no': obj.application.parking_no,
                'car_no': obj.application.car_no,
                'car_brand': obj.application.car_brand,
                'car_color': obj.application.car_color,
                'owner_name': obj.application.owner_name,
                'full_address': f"{obj.application.parking_area}-{obj.application.parking_no}"
            }
        elif obj.parking_space:
            return {
                'community_name': "阳光花园",  # 临时硬编码
                'parking_area': obj.parking_space.area_name,
                'parking_no': obj.parking_space.space_number,
                'parking_type': obj.parking_space.parking_type,
                'parking_type_display': obj.parking_space.get_parking_type_display(),
                'full_address': f"{obj.parking_space.area_name}-{obj.parking_space.space_number}"
            }
        return None


# ===== 公告相关序列化器 =====

class AnnouncementCreateSerializer(serializers.ModelSerializer):
    """公告创建/更新序列化器"""
    target_buildings = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False,
        allow_empty=True,
        help_text="目标楼栋列表，当scope为'building'时必填"
    )
    
    class Meta:
        model = Announcement
        fields = [
            'title', 'content', 'category', 'scope', 'target_buildings'
        ]
    
    def validate(self, data):
        """验证数据"""
        scope = data.get('scope')
        target_buildings = data.get('target_buildings')
        
        # 如果选择指定楼栋，必须提供楼栋列表
        if scope == 'building' and (not target_buildings or len(target_buildings) == 0):
            raise serializers.ValidationError("指定楼栋发送时必须选择至少一个楼栋")
        
        # 如果是全员发送，清空楼栋列表
        if scope == 'all':
            data['target_buildings'] = None
            
        return data
    
    def validate_title(self, value):
        """验证标题"""
        if not value or len(value.strip()) == 0:
            raise serializers.ValidationError("标题不能为空")
        if len(value) > 200:
            raise serializers.ValidationError("标题长度不能超过200字符")
        return value.strip()
    
    def validate_content(self, value):
        """验证内容"""
        if not value or len(value.strip()) == 0:
            raise serializers.ValidationError("内容不能为空")
        return value


class AnnouncementListSerializer(serializers.ModelSerializer):
    """公告列表序列化器"""
    author = serializers.CharField(source='author_name', read_only=True)
    status_text = serializers.CharField(source='get_status_display', read_only=True)
    scope_text = serializers.CharField(source='get_scope_display', read_only=True)
    category_text = serializers.CharField(source='get_category_display', read_only=True)
    created_at = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S', read_only=True)
    published_at = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S', read_only=True)
    
    class Meta:
        model = Announcement
        fields = [
            'id', 'title', 'content', 'status', 'status_text', 
            'category', 'category_text', 'scope', 'scope_text', 'target_buildings',
            'author', 'created_at', 'published_at', 'read_count'
        ]


class AnnouncementDetailSerializer(serializers.ModelSerializer):
    """公告详情序列化器"""
    author = serializers.CharField(source='author_name', read_only=True)
    status_text = serializers.CharField(source='get_status_display', read_only=True)
    scope_text = serializers.CharField(source='get_scope_display', read_only=True)
    category_text = serializers.CharField(source='get_category_display', read_only=True)
    author_info = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S', read_only=True)
    updated_at = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S', read_only=True)
    published_at = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S', read_only=True)
    withdrawn_at = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S', read_only=True)
    
    class Meta:
        model = Announcement
        fields = [
            'id', 'title', 'content', 'status', 'status_text',
            'category', 'category_text', 'scope', 'scope_text', 'target_buildings',
            'author', 'author_info', 'created_at', 'updated_at',
            'published_at', 'withdrawn_at', 'read_count'
        ]
    
    def get_author_info(self, obj):
        """获取作者详细信息"""
        if obj.author:
            return {
                'id': obj.author.id,
                'name': obj.author_name,
                'nickname': getattr(obj.author, 'nickname', obj.author_name),
                'avatar': obj.author.avatar.url if hasattr(obj.author, 'avatar') and obj.author.avatar else None
            }
        else:
            return {
                'id': None,
                'name': obj.author_name,
                'nickname': obj.author_name,
                'avatar': None
            }


# ===== 报修工单相关序列化器 =====

class RepairOrderImageSerializer(serializers.ModelSerializer):
    """报修工单图片序列化器"""
    
    class Meta:
        model = RepairOrderImage
        fields = ['id', 'image', 'image_type', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']


class RepairOrderCreateSerializer(serializers.ModelSerializer):
    """创建报修工单序列化器"""
    images = RepairOrderImageSerializer(many=True, required=False)
    
    class Meta:
        model = RepairOrder
        fields = [
            'category', 'repair_type', 'priority', 'summary', 'description', 
            'location', 'reporter_name', 'reporter_phone', 'images'
        ]
    
    def validate_reporter_phone(self, value):
        """校验手机号格式"""
        import re
        if not re.match(r'^1[3-9]\d{9}$', value):
            raise serializers.ValidationError("手机号格式不正确")
        return value
    
    def create(self, validated_data):
        images_data = validated_data.pop('images', [])
        repair_order = RepairOrder.objects.create(**validated_data)
        
        # 创建图片记录
        for image_data in images_data:
            RepairOrderImage.objects.create(order=repair_order, **image_data)
        
        return repair_order


class RepairOrderListSerializer(serializers.ModelSerializer):
    """报修工单列表序列化器"""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    type_display = serializers.CharField(source='get_repair_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    
    class Meta:
        model = RepairOrder
        fields = [
            'id', 'order_no', 'category', 'category_display', 'repair_type', 'type_display',
            'priority', 'priority_display', 'summary', 'location', 'reporter_name', 
            'reporter_phone', 'status', 'status_display', 'assignee', 'created_at', 'updated_at'
        ]


class RepairOrderDetailSerializer(serializers.ModelSerializer):
    """报修工单详情序列化器"""
    images = RepairOrderImageSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    type_display = serializers.CharField(source='get_repair_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    
    class Meta:
        model = RepairOrder
        fields = [
            'id', 'order_no', 'category', 'category_display', 'repair_type', 'type_display',
            'priority', 'priority_display', 'summary', 'description', 'location',
            'reporter_name', 'reporter_phone', 'status', 'status_display', 'assignee',
            'assigned_at', 'result', 'cost', 'completed_at', 'created_at', 'updated_at',
            'is_rated', 'rating', 'rating_comment', 'rated_at', 'images'
        ]


class RepairOrderAssignSerializer(serializers.Serializer):
    """派单序列化器"""
    assignee = serializers.CharField(max_length=50, help_text="派单给的维修人员姓名")
    
    def validate_assignee(self, value):
        if not value.strip():
            raise serializers.ValidationError("派单人员不能为空")
        return value.strip()


class RepairOrderCompleteSerializer(serializers.Serializer):
    """完成工单序列化器"""
    result = serializers.CharField(help_text="处理结果")
    cost = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, help_text="维修费用")
    
    def validate_result(self, value):
        if not value.strip():
            raise serializers.ValidationError("处理结果不能为空")
        return value.strip()


class RepairOrderRatingSerializer(serializers.Serializer):
    """工单评价序列化器"""
    rating = serializers.IntegerField(min_value=1, max_value=5, help_text="评分(1-5)")
    comment = serializers.CharField(required=False, allow_blank=True, help_text="评价内容")


class RepairEmployeeSerializer(serializers.ModelSerializer):
    """维修人员序列化器"""
    
    class Meta:
        model = RepairEmployee
        fields = [
            'id', 'name', 'phone', 'speciality', 'is_active',
            'total_orders', 'completed_orders', 'average_rating'
        ]
        read_only_fields = ['total_orders', 'completed_orders', 'average_rating']