from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from .serializers import (
    LoginSerializer, SendSMSCodeSerializer, VerifyCodeSerializer, 
    SMSLoginSerializer, SMSRegisterSerializer, UserProfileSerializer, 
    UserInfoSerializer, AvatarUploadSerializer, WeChatLoginSerializer, WeChatRegisterSerializer
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
                    "token": f"sms_token_{user.id}_abc123",
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
            avatar_url = serializer.validated_data.get('avatar_url', '')
            
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
                username=nickname,  # 使用昵称作为用户名
                phone=phone,
                nickname=nickname,
                register_type=1,  # 手机注册
                is_active=True
            )
            
            # 如果有头像URL，保存到avatar字段
            if avatar_url:
                # 从URL中提取文件路径并设置到ImageField
                from urllib.parse import urlparse
                parsed_url = urlparse(avatar_url)
                # 提取media路径部分
                avatar_path = parsed_url.path.replace('/media/', '')
                user.avatar = avatar_path
                user.save()
            
            logger.info(f"新用户注册成功: {phone}, 昵称: {nickname}")
            
            # 生成Token (后续配置JWT)
            # token = RefreshToken.for_user(user)
            
            # 获取头像URL字符串
            avatar_url = user.avatar.url if user.avatar else ''
            
            return Response({
                "code": 200,
                "message": "注册成功",
                "data": {
                    "token": f"sms_token_{user.id}_abc123",  # 模拟token
                    "user_id": user.id,
                    "phone": user.phone,
                    "nickname": user.nickname,
                    "avatar": avatar_url,
                    "role": user.role,
                    "register_type": user.register_type
                }
            })
        
        return Response({
            "code": 400,
            "message": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


from .wechat_service import WeChatService

class WeChatLoginView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = WeChatLoginSerializer(data=request.data)
        # Log incoming request for debugging (do not log secrets)
        received_code = request.data.get('code')
        logger.debug(f"WeChatLoginView POST received keys={list(request.data.keys())}, code_len={len(received_code) if received_code else 0}")
        if serializer.is_valid():
            code = serializer.validated_data['code']
            
            # 1. 换取 openid
            success, message, data = WeChatService.get_session_info(code)
            if not success:
                logger.error(f"WeChatLogin failed during session exchange: {message}")
                return Response({"code": 400, "message": message}, status=status.HTTP_400_BAD_REQUEST)
            
            openid = data.get("openid")
            
            # 2. 检查用户是否存在
            try:
                user = User.objects.get(openid=openid)
                # 老用户，直接返回登录态
                # token = RefreshToken.for_user(user)
                # 获取头像URL字符串
                avatar_url = user.avatar.url if user.avatar else ''
                
                return Response({
                    "code": 200,
                    "message": "登录成功",
                    "data": {
                        "token": f"wechat_token_{user.id}_xyz789",
                        "user_id": user.id,
                        "role": user.role,
                        "avatar": avatar_url,
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
        
        logger.debug(f"WeChatLogin serializer errors: {serializer.errors}")
        return Response({"code": 400, "message": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class WeChatRegisterView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = WeChatRegisterSerializer(data=request.data)
        if serializer.is_valid():
            code = serializer.validated_data['code']
            nickname = serializer.validated_data['nickname']
            avatar_url = serializer.validated_data.get('avatar_url', '')
            
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
                register_type=2,  # 微信注册
                is_active=True
            )
            
            # 如果有头像URL，保存到avatar字段
            if avatar_url:
                # 从URL中提取文件路径并设置到ImageField
                from urllib.parse import urlparse
                parsed_url = urlparse(avatar_url)
                # 提取media路径部分
                avatar_path = parsed_url.path.replace('/media/', '')
                user.avatar = avatar_path
                user.save()
            
            logger.info(f"新用户微信注册成功: {openid[:8]}***, 昵称: {nickname}")
            
            # 获取头像URL字符串
            avatar_url = user.avatar.url if user.avatar else ''
            
            return Response({
                "code": 200,
                "message": "注册成功",
                "data": {
                    "token": f"wechat_token_{user.id}_xyz789",
                    "user_id": user.id,
                    "role": user.role,
                    "avatar": avatar_url,
                    "nickname": user.nickname,
                    "register_type": user.register_type
                }
            })

        return Response({"code": 400, "message": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(APIView):

    def get(self, request):
       
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
        
        serializer = UserInfoSerializer(user, context={'request': request})
        return Response({
            "code": 200,
            "message": "获取成功",
            "data": serializer.data
        })
    
    def put(self, request):
       
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
                if field == 'avatar_url' and value:
                    # 处理头像URL，从URL中提取文件路径
                    from urllib.parse import urlparse
                    parsed_url = urlparse(value)
                    avatar_path = parsed_url.path.replace('/media/', '')
                    user.avatar = avatar_path
                elif field != 'user_id' and field != 'avatar_url' and hasattr(user, field):
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


class AvatarUploadView(APIView):
    permission_classes = []
    
    def post(self, request):
        serializer = AvatarUploadSerializer(data=request.data)
        if serializer.is_valid():
            avatar_file = serializer.validated_data['avatar']
            
            # 生成唯一的文件名
            import uuid
            import os
            from django.conf import settings
            
            # 获取文件扩展名
            file_ext = os.path.splitext(avatar_file.name)[1].lower()
            # 生成新文件名: uuid + 扩展名
            new_filename = f"{uuid.uuid4().hex}{file_ext}"
            
            # 创建User实例来保存头像（临时方案，不关联具体用户）
            temp_user = User()
            temp_user.avatar.save(new_filename, avatar_file, save=False)
            
            # 构建完整的URL
            avatar_url = request.build_absolute_uri(temp_user.avatar.url)
            
            logger.info(f"头像上传成功: {new_filename}, URL: {avatar_url}")
            
            return Response({
                "code": 200,
                "message": "头像上传成功",
                "data": {
                    "avatar_url": avatar_url,
                    "filename": new_filename
                }
            })
        
        return Response({
            "code": 400,
            "message": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


import jwt
import time
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

class IdentityCodeView(APIView):
    permission_classes = []  # 临时禁用权限，使用user_id参数

    def get(self, request):
       
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

        # 1. 检查用户是否绑定了房屋且审核通过（可选，看需求严格程度）
        # has_house = user.house_bindings.filter(status=1).exists()
        # if not has_house:
        #     return Response({"code": 403, "message": "未绑定房屋，无法生成通行码"}, status=403)

        # 2. 生成简短的身份令牌
        # 使用格式: 用户ID_过期时间戳_签名 (更短，适合二维码)
        expire_time = int(time.time()) + 60

        # 生成简短的数据字符串
        token_data = f"{user.id}_{expire_time}"

        # 使用简短的密钥生成签名
        import hashlib
        signature = hashlib.md5(f"{token_data}_access_control_{settings.SECRET_KEY[:16]}".encode()).hexdigest()[:8]

        # 最终令牌格式: 用户ID_过期时间_签名
        identity_token = f"{token_data}_{signature}"

        return Response({
            "code": 200,
            "data": {
                "token": identity_token,
                "valid_seconds": 60 # 告诉前端多少秒倒计时
            }
        })


# ===== 通知相关视图 =====

class NotificationListView(APIView):
    """通知列表接口"""
    permission_classes = []

    def get(self, request):
        from .models import Notification

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

        # 获取通知列表，按创建时间倒序
        notifications = user.received_notifications.all().order_by('-created_at')

        # 序列化数据
        notification_list = []
        for notification in notifications:
            notification_list.append({
                'id': notification.id,
                'title': notification.title,
                'content': notification.content,
                'notification_type': notification.notification_type,
                'is_read': notification.is_read,
                'created_at': notification.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'related_object_type': notification.related_object_type,
                'related_object_id': notification.related_object_id
            })

        # 统计未读数量
        unread_count = notifications.filter(is_read=False).count()

        return Response({
            "code": 200,
            "message": "获取成功",
            "data": {
                "list": notification_list,
                "total": len(notification_list),
                "unread_count": unread_count
            }
        })


class NotificationDetailView(APIView):
    """通知详情接口"""
    permission_classes = []

    def get(self, request, notification_id):
        from .models import Notification

        user_id = request.GET.get('user_id')
        if not user_id:
            return Response({
                "code": 400,
                "message": "缺少用户ID参数"
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            notification = Notification.objects.get(id=notification_id, recipient_id=user_id)
        except Notification.DoesNotExist:
            return Response({
                "code": 404,
                "message": "通知不存在"
            }, status=status.HTTP_404_NOT_FOUND)

        return Response({
            "code": 200,
            "message": "获取成功",
            "data": {
                'id': notification.id,
                'title': notification.title,
                'content': notification.content,
                'notification_type': notification.notification_type,
                'is_read': notification.is_read,
                'created_at': notification.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'related_object_type': notification.related_object_type,
                'related_object_id': notification.related_object_id
            }
        })


class NotificationMarkReadView(APIView):
    """标记通知为已读"""
    permission_classes = []

    def post(self, request, notification_id):
        from .models import Notification

        user_id = request.data.get('user_id')
        if not user_id:
            return Response({
                "code": 400,
                "message": "缺少用户ID参数"
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            notification = Notification.objects.get(id=notification_id, recipient_id=user_id)
        except Notification.DoesNotExist:
            return Response({
                "code": 404,
                "message": "通知不存在"
            }, status=status.HTTP_404_NOT_FOUND)

        # 标记为已读
        notification.mark_as_read()

        return Response({
            "code": 200,
            "message": "标记成功"
        })


class NotificationMarkAllReadView(APIView):
    """标记所有通知为已读"""
    permission_classes = []

    def post(self, request):
        from .models import Notification

        user_id = request.data.get('user_id')
        if not user_id:
            return Response({
                "code": 400,
                "message": "缺少用户ID参数"
            }, status=status.HTTP_400_BAD_REQUEST)

        # 批量标记为已读
        updated_count = Notification.objects.filter(
            recipient_id=user_id,
            is_read=False
        ).update(is_read=True)

        logger.info(f"用户 {user_id} 批量标记 {updated_count} 条通知为已读")

        return Response({
            "code": 200,
            "message": f"已标记{updated_count}条通知为已读",
            "data": {
                "updated_count": updated_count
            }
        })