from rest_framework import serializers
from .models import HouseBindingApplication, HouseUserBinding, House, Building


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