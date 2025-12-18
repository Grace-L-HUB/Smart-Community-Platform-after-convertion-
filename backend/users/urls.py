from django.urls import path
from .views import (
    LoginView, SendSMSCodeView, VerifyCodeView, SMSLoginView, SMSRegisterView, 
    WeChatLoginView, WeChatRegisterView, UserProfileView, UserStatsView, AvatarUploadView, IdentityCodeView
)

urlpatterns = [
    # 认证相关
    path('auth/login', LoginView.as_view(), name='login'),
    path('auth/send-sms-code', SendSMSCodeView.as_view(), name='send_sms_code'),
    path('auth/verify-code', VerifyCodeView.as_view(), name='verify_code'),
    path('auth/sms-login', SMSLoginView.as_view(), name='sms_login'),
    path('auth/sms-register', SMSRegisterView.as_view(), name='sms_register'),
    path('auth/wechat-login', WeChatLoginView.as_view(), name='wechat_login'),
    path('auth/wechat-register', WeChatRegisterView.as_view(), name='wechat_register'),
    
    # 用户信息管理
    path('profile', UserProfileView.as_view(), name='user_profile'),
    path('stats', UserStatsView.as_view(), name='user_stats'),
    
    # 文件上传
    path('upload/avatar', AvatarUploadView.as_view(), name='avatar_upload'),
    
    # 身份码
    path('user/identity-code', IdentityCodeView.as_view(), name='identity_code'),
]