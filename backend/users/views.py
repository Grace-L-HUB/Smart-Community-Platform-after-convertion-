from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from .serializers import (
    LoginSerializer, SendSMSCodeSerializer, VerifyCodeSerializer, 
    SMSLoginSerializer, SMSRegisterSerializer, UserProfileSerializer, UserInfoSerializer
)
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
                nickname=nickname,
                avatar=avatar,
                register_type=1,  # 手机注册
                is_active=True
            )
            
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
                    "nickname": user.nickname,
                    "avatar": user.avatar,
                    "role": user.role,
                    "register_type": user.register_type
                }
            })
        
        return Response({
            "code": 400,
            "message": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


from .wechat_service import WeChatService
from .serializers import WeChatLoginSerializer, WeChatRegisterSerializer

class WeChatLoginView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = WeChatLoginSerializer(data=request.data)
        if serializer.is_valid():
            code = serializer.validated_data['code']
            
            # 1. 换取 openid
            success, message, data = WeChatService.get_session_info(code)
            if not success:
                return Response({"code": 400, "message": message}, status=status.HTTP_400_BAD_REQUEST)
            
            openid = data.get("openid")
            
            # 2. 检查用户是否存在
            try:
                user = User.objects.get(openid=openid)
                # 老用户，直接返回登录态
                # token = RefreshToken.for_user(user)
                return Response({
                    "code": 200,
                    "message": "登录成功",
                    "data": {
                        "token": f"wechat_token_{user.id}_xyz789",
                        "user_id": user.id,
                        "role": user.role,
                        "avatar": user.avatar,
                        "nickname": user.nickname,
                        "display_name": user.display_name,
                        "register_type": user.register_type
                    }
                })
            except User.DoesNotExist:
                # 新用户，返回标识通知前端跳转完善信息
                return Response({
                    "code": 200, 
                    "message": "用户未注册",
                    "data": {
                        "need_profile": True,
                        "openid": openid # 仅供调试或作为临时凭证(虽不安全但演示用)
                    }
                })
        
        return Response({"code": 400, "message": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class WeChatRegisterView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = WeChatRegisterSerializer(data=request.data)
        if serializer.is_valid():
            code = serializer.validated_data['code']
            nickname = serializer.validated_data['nickname']
            avatar = serializer.validated_data.get('avatar', '')
            
            # 1. 再次换取 openid (为了安全应由后端缓存session_key，但简化流程再次调用)
            success, message, data = WeChatService.get_session_info(code)
            if not success:
                # 如果code失效，前端可能需要重新wx.login，这里简化处理，假设code有效期足够或前端重新获取了code
                # 生产环境建议前端传 code 或者 后端缓存 session
                return Response({"code": 400, "message": message}, status=status.HTTP_400_BAD_REQUEST)
            
            openid = data.get("openid")
            
            # 2. 检查并创建
            if User.objects.filter(openid=openid).exists():
                return Response({"code": 400, "message": "该微信已注册"}, status=status.HTTP_400_BAD_REQUEST)
            
            user = User.objects.create_user(
                username=f"wx_{openid[:8]}", # 随机用户名
                openid=openid,
                nickname=nickname,
                avatar=avatar,
                register_type=2,  # 微信注册
                is_active=True
            )
            
            logger.info(f"新用户微信注册成功: {openid[:8]}***, 昵称: {nickname}")
            
            return Response({
                "code": 200,
                "message": "注册成功",
                "data": {
                    "token": f"wechat_token_{user.id}_xyz789",
                    "user_id": user.id,
                    "role": user.role,
                    "avatar": user.avatar,
                    "nickname": user.nickname,
                    "register_type": user.register_type
                }
            })

        return Response({"code": 400, "message": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(APIView):
    
    def get(self, request):
        # TODO: 后续添加JWT认证后，从token获取用户
        # user = request.user
        
        # 临时处理：从请求参数获取用户ID
        user_id = request.GET.get('user_id')
        if not user_id:
            return Response({
                "code": 400,
                "message": "缺少用户ID参数"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({
                "code": 404,
                "message": "用户不存在"
            }, status=status.HTTP_404_NOT_FOUND)
        
        serializer = UserInfoSerializer(user)
        return Response({
            "code": 200,
            "message": "获取成功",
            "data": serializer.data
        })
    
    def put(self, request):
        # TODO: 后续添加JWT认证后，从token获取用户
        # user = request.user
        
        # 临时处理：从请求参数获取用户ID
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({
                "code": 400,
                "message": "缺少用户ID参数"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({
                "code": 404,
                "message": "用户不存在"
            }, status=status.HTTP_404_NOT_FOUND)
        
        serializer = UserProfileSerializer(data=request.data)
        if serializer.is_valid():
            # 更新用户信息
            validated_data = serializer.validated_data
            for field, value in validated_data.items():
                if field != 'user_id' and hasattr(user, field):
                    setattr(user, field, value)
            
            user.save()
            logger.info(f"用户 {user.id} 更新个人信息")
            
            # 返回更新后的用户信息
            user_serializer = UserInfoSerializer(user)
            return Response({
                "code": 200,
                "message": "更新成功",
                "data": user_serializer.data
            })
        
        return Response({
            "code": 400,
            "message": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class UserStatsView(APIView):
    permission_classes = []
    
    def get(self, request):
        from .models import User
        
        stats = {
            "total_users": User.objects.count(),
            "phone_users": User.objects.filter(register_type=1).count(),
            "wechat_users": User.objects.filter(register_type=2).count(),
            "verified_users": User.objects.filter(is_verified=True).count(),
            "banned_users": User.objects.filter(is_banned=True).count(),
            "role_stats": {
                "residents": User.objects.filter(role=0).count(),
                "property_staff": User.objects.filter(role=1).count(),
                "merchants": User.objects.filter(role=2).count(),
                "admins": User.objects.filter(role=3).count(),
            }
        }
        
        return Response({
            "code": 200,
            "message": "获取成功",
            "data": stats
        })
