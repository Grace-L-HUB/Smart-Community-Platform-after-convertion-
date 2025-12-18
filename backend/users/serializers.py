from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
import re

User = get_user_model()


class AvatarUploadSerializer(serializers.Serializer):
    """头像上传序列化器"""
    avatar = serializers.ImageField(help_text="头像文件")
    
    def validate_avatar(self, value):
        # 限制文件大小为5MB
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("头像文件大小不能超过5MB")
        
        # 限制文件类型
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        if value.content_type not in allowed_types:
            raise serializers.ValidationError("头像文件格式不支持，请上传jpg、png、gif或webp格式的图片")
        
        return value


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True) # 密码只进不出

    def validate(self, attrs):
        user = authenticate(**attrs) # Django 自带的验证账号密码方法
        if user and user.is_active:
            return {'user': user}
        raise serializers.ValidationError("账号或密码错误")

class SendSMSCodeSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=11, help_text="手机号")
    
    def validate_phone(self, value):
        if not re.match(r'^1[3-9]\d{9}$', value):
            raise serializers.ValidationError("手机号格式不正确")
        return value


class VerifyCodeSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=11, help_text="手机号")
    code = serializers.CharField(max_length=6, min_length=6, help_text="验证码")
    
    def validate_phone(self, value):
        if not re.match(r'^1[3-9]\d{9}$', value):
            raise serializers.ValidationError("手机号格式不正确")
        return value


class SMSLoginSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=11, help_text="手机号")
    code = serializers.CharField(max_length=6, min_length=6, help_text="验证码")
    
    def validate_phone(self, value):
        if not re.match(r'^1[3-9]\d{9}$', value):
            raise serializers.ValidationError("手机号格式不正确")
        return value


class SMSRegisterSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=11, help_text="手机号")
    code = serializers.CharField(max_length=6, min_length=6, help_text="验证码")
    nickname = serializers.CharField(max_length=50, help_text="昵称")
    avatar_url = serializers.URLField(max_length=500, required=False, allow_blank=True, help_text="头像URL（通过头像上传接口获取）")
    
    def validate_phone(self, value):
        if not re.match(r'^1[3-9]\d{9}$', value):
            raise serializers.ValidationError("手机号格式不正确")
        return value
    
    def validate_nickname(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("昵称不能为空")

class WeChatLoginSerializer(serializers.Serializer):
    code = serializers.CharField(required=True, help_text="微信临时登录凭证code")

class WeChatRegisterSerializer(serializers.Serializer):
    code = serializers.CharField(required=True, help_text="微信临时登录凭证code")
    nickname = serializers.CharField(required=True, max_length=50)
    avatar_url = serializers.URLField(max_length=500, required=False, allow_blank=True, help_text="头像URL（通过头像上传接口获取）")


class UserProfileSerializer(serializers.Serializer):
    nickname = serializers.CharField(max_length=50, required=False, help_text="昵称")
    avatar_url = serializers.URLField(max_length=500, required=False, allow_blank=True, help_text="头像URL（通过头像上传接口获取）")
    gender = serializers.ChoiceField(choices=[0, 1, 2], required=False, help_text="性别：0-未知，1-男，2-女")
    birthday = serializers.DateField(required=False, help_text="生日")
    real_name = serializers.CharField(max_length=20, required=False, help_text="真实姓名")
    email = serializers.EmailField(required=False, allow_blank=True, help_text="邮箱地址")
    province = serializers.CharField(max_length=50, required=False, help_text="省份")
    city = serializers.CharField(max_length=50, required=False, help_text="城市")
    district = serializers.CharField(max_length=50, required=False, help_text="区县")
    address = serializers.CharField(max_length=200, required=False, help_text="详细地址")

    def validate_nickname(self, value):
        if value and not value.strip():
            raise serializers.ValidationError("昵称不能为空")
        return value.strip() if value else value

    def validate_real_name(self, value):
        if value and not value.strip():
            raise serializers.ValidationError("真实姓名不能为空")
        return value.strip() if value else value


class UserInfoSerializer(serializers.ModelSerializer):
    """用户信息展示序列化器"""
    display_name = serializers.CharField(read_only=True)
    age = serializers.IntegerField(read_only=True)
    full_address = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'nickname', 'display_name', 'avatar', 'avatar_url', 'phone', 'email',
            'gender', 'birthday', 'age', 'real_name', 'province', 'city', 'district', 
            'address', 'full_address', 'role', 'register_type', 'is_verified', 
            'created_at', 'updated_at', 'last_login'
        ]
        read_only_fields = ['id', 'username', 'phone', 'role', 'register_type', 'created_at', 'updated_at']
    
    def get_full_address(self, obj):
        return obj.get_full_address()
    
    def get_avatar_url(self, obj):
        """获取头像的完整URL"""
        if obj.avatar and hasattr(obj.avatar, 'url'):
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            else:
                # 如果没有request上下文，返回相对URL
                return obj.avatar.url
        return None