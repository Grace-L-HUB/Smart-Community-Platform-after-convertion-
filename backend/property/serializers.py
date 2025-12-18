from rest_framework import serializers
from .models import HouseBindingApplication, HouseUserBinding, House, Building, Visitor
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
    identity_display = serializers.CharField(source='get_identity_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = HouseUserBinding
        fields = [
            'id', 'identity', 'identity_display', 'status', 'status_display',
            'created_at', 'house_info'
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