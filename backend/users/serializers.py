from rest_framework import serializers
from django.contrib.auth import authenticate
import re

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
    avatar = serializers.URLField(required=False, help_text="头像URL")
    
    def validate_phone(self, value):
        if not re.match(r'^1[3-9]\d{9}$', value):
            raise serializers.ValidationError("手机号格式不正确")
        return value
    
    def validate_nickname(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("昵称不能为空")
        return value.strip()