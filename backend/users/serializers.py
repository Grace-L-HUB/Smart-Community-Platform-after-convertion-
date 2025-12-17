from rest_framework import serializers
from django.contrib.auth import authenticate

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True) # 密码只进不出

    def validate(self, attrs):
        user = authenticate(**attrs) # Django 自带的验证账号密码方法
        if user and user.is_active:
            return {'user': user}
        raise serializers.ValidationError("账号或密码错误")