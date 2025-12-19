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
        
        if not user_id:
            raise exceptions.AuthenticationFailed('无效的token格式')
        
        try:
            user = User.objects.get(id=user_id, is_active=True)
        except User.DoesNotExist:
            raise exceptions.AuthenticationFailed('用户不存在或已被禁用')
        
        return (user, token)
    
    def authenticate_header(self, request):
        """
        返回认证失败时的响应头
        """
        return 'Bearer'