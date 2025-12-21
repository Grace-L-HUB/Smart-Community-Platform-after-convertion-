from rest_framework import authentication
from rest_framework import exceptions
from django.contrib.auth import get_user_model
import re

User = get_user_model()


class CustomTokenAuthentication(authentication.BaseAuthentication):
    """
    自定义Token认证类，支持微信和短信登录产生的token
    """
    
    def authenticate(self, request):
        """
        认证请求中的token
        """
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return None
            
        token = auth_header.split(' ')[1]
        
        return self.authenticate_token(token)
    
    def authenticate_token(self, token):
        """
        根据token格式验证并返回用户
        """
        # 微信token格式: wechat_token_{user_id}_xyz789
        wechat_pattern = r'^wechat_token_(\d+)_xyz789$'
        # 短信token格式: sms_token_{user_id}_abc123  
        sms_pattern = r'^sms_token_(\d+)_abc123$'
        # 商户token格式: merchant_token_{user_id}_verified
        merchant_pattern = r'^merchant_token_(\d+)_verified$'
        # Mock token格式（开发环境）: mock-token-{timestamp}
        mock_pattern = r'^mock-token-\d+$'
        
        user_id = None
        
        # 匹配微信token
        wechat_match = re.match(wechat_pattern, token)
        if wechat_match:
            user_id = wechat_match.group(1)
        else:
            # 匹配短信token
            sms_match = re.match(sms_pattern, token)
            if sms_match:
                user_id = sms_match.group(1)
            else:
                # 匹配商户token
                merchant_match = re.match(merchant_pattern, token)
                if merchant_match:
                    user_id = merchant_match.group(1)
                else:
                    # 匹配Mock token（开发环境）
                    mock_match = re.match(mock_pattern, token)
                    if mock_match:
                        # Mock token场景：根据用户角色返回对应的测试用户
                        # 这里可以根据需要创建或获取测试用户
                        return self.get_mock_user(token)
        
        if not user_id:
            raise exceptions.AuthenticationFailed('无效的token格式')
        
        try:
            user = User.objects.get(id=user_id, is_active=True)
        except User.DoesNotExist:
            raise exceptions.AuthenticationFailed('用户不存在或已被禁用')
        
        return (user, token)
    
    def get_mock_user(self, token):
        """
        获取或创建Mock测试用户（仅开发环境）
        """
        from django.conf import settings
        
        # 只在DEBUG模式下允许Mock认证
        if not getattr(settings, 'DEBUG', False):
            raise exceptions.AuthenticationFailed('Mock认证仅在开发环境可用')
        
        # 创建或获取物业管理员测试用户
        mock_admin_user, created = User.objects.get_or_create(
            username='property_admin',
            defaults={
                'phone': '13800000001',
                'nickname': '物业管理员',
                'role': 1,  # 物业人员
                'is_verified': True,
                'register_type': 3,  # 后台创建
                'is_active': True,
            }
        )
        
        return (mock_admin_user, token)
    
    def authenticate_header(self, request):
        """
        返回认证失败时的响应头
        """
        return 'Bearer'