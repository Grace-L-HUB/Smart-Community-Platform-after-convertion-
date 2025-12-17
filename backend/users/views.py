from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from .serializers import LoginSerializer, SendSMSCodeSerializer, VerifyCodeSerializer, SMSLoginSerializer, SMSRegisterSerializer
from .sms_service import SMSService
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

# Create your views here.

class LoginView(APIView):
    # 这是一个不需要登录就能访问的接口
    permission_classes = [] 

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            # 这里生成 Token (后续我们要配置 JWT)
            # token = RefreshToken.for_user(user)
            return Response({
                "code": 200,
                "message": "登录成功",
                "data": {
                    "token": "模拟的token_abc123", 
                    "user_id": user.id,
                    "role": user.role
                }
            })
        return Response({
            "code": 400,
            "message": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class SendSMSCodeView(APIView):
    permission_classes = []
    
    def post(self, request):
        serializer = SendSMSCodeSerializer(data=request.data)
        if serializer.is_valid():
            phone = serializer.validated_data['phone']
            
            # 检查用户是否存在
            user_exists = User.objects.filter(phone=phone).exists()
            
            # 发送验证码
            success, message, code = SMSService.send_verification_code(phone)
            
            if success:
                return Response({
                    "code": 200,
                    "message": "验证码发送成功",
                    "data": {
                        "phone": phone,
                        "code": code,  # 开发环境下返回验证码，生产环境去掉
                        "expire_time": SMSService.CODE_EXPIRE_TIME,
                        "user_exists": user_exists  # 告知前端用户是否存在
                    }
                })
            else:
                return Response({
                    "code": 400,
                    "message": message
                }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            "code": 400,
            "message": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class VerifyCodeView(APIView):
    permission_classes = []
    
    def post(self, request):
        serializer = VerifyCodeSerializer(data=request.data)
        if serializer.is_valid():
            phone = serializer.validated_data['phone']
            code = serializer.validated_data['code']
            
            # 验证验证码
            success, message = SMSService.verify_code(phone, code)
            
            if success:
                return Response({
                    "code": 200,
                    "message": "验证成功",
                    "data": {
                        "phone": phone,
                        "verified": True
                    }
                })
            else:
                return Response({
                    "code": 400,
                    "message": message
                }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            "code": 400,
            "message": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class SMSLoginView(APIView):
    permission_classes = []
    
    def post(self, request):
        serializer = SMSLoginSerializer(data=request.data)
        if serializer.is_valid():
            phone = serializer.validated_data['phone']
            code = serializer.validated_data['code']
            
            # 验证验证码
            success, message = SMSService.verify_code(phone, code)
            
            if not success:
                return Response({
                    "code": 400,
                    "message": message
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 验证码正确，查找用户（不再自动创建）
            try:
                user = User.objects.get(phone=phone)
            except User.DoesNotExist:
                return Response({
                    "code": 400,
                    "message": "用户不存在，请先完成注册"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 生成Token (后续配置JWT)
            # token = RefreshToken.for_user(user)
            
            return Response({
                "code": 200,
                "message": "登录成功",
                "data": {
                    "token": f"sms_token_{user.id}_abc123",  # 模拟token
                    "user_id": user.id,
                    "phone": user.phone,
                    "role": user.role
                }
            })
        
        return Response({
            "code": 400,
            "message": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class SMSRegisterView(APIView):
    permission_classes = []
    
    def post(self, request):
        serializer = SMSRegisterSerializer(data=request.data)
        if serializer.is_valid():
            phone = serializer.validated_data['phone']
            code = serializer.validated_data['code']
            nickname = serializer.validated_data['nickname']
            avatar = serializer.validated_data.get('avatar', '')
            
            # 验证验证码
            success, message = SMSService.verify_code(phone, code)
            
            if not success:
                return Response({
                    "code": 400,
                    "message": message
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 检查用户是否已存在
            if User.objects.filter(phone=phone).exists():
                return Response({
                    "code": 400,
                    "message": "该手机号已注册"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 创建新用户
            user = User.objects.create_user(
                username=phone,  # 使用手机号作为用户名
                phone=phone,
                is_active=True
            )
            
            # 更新用户信息
            if nickname:
                user.first_name = nickname
            if avatar:
                user.avatar = avatar
            user.save()
            
            logger.info(f"新用户注册成功: {phone}, 昵称: {nickname}")
            
            # 生成Token (后续配置JWT)
            # token = RefreshToken.for_user(user)
            
            return Response({
                "code": 200,
                "message": "注册成功",
                "data": {
                    "token": f"sms_token_{user.id}_abc123",  # 模拟token
                    "user_id": user.id,
                    "phone": user.phone,
                    "nickname": user.first_name,
                    "avatar": user.avatar,
                    "role": user.role
                }
            })
        
        return Response({
            "code": 400,
            "message": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
