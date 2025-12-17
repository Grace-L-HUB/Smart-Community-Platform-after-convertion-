import requests
import random
import string
from django.core.cache import cache
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class SMSService:
    """短信验证服务"""
    
    # 短信验证码模板ID
    TEMPLATE_ID = "BYEgRjn7dXrw5x7o"
    
    # 短信验证API基础URL
    BASE_URL = "https://push.spug.cc/send"
    
    # 验证码有效期（秒）- 10分钟
    CODE_EXPIRE_TIME = 600
    
    @classmethod
    def generate_code(cls, length=6):
        # 生成6位数字验证码
        return ''.join(random.choices(string.digits, k=length))
    
    @classmethod
    def send_sms(cls, phone, code):
        try:
            url = f"{cls.BASE_URL}/{cls.TEMPLATE_ID}"
            params = {
                "code": code,
                "targets": phone
            }
            
            response = requests.get(url, params=params, timeout=30)
            response_data = response.json()
            
            # 根据返回的状态码判断是否成功
            if response_data.get('code') == 200 or response_data.get('code') == 204:
                logger.info(f"短信发送成功: {phone}, 验证码: {code}")
                return True, "短信发送成功", response_data
            else:
                logger.error(f"短信发送失败: {phone}, 响应: {response_data}")
                return False, response_data.get('msg', '短信发送失败'), response_data
                
        except requests.RequestException as e:
            logger.error(f"短信发送请求异常: {phone}, 错误: {str(e)}")
            return False, "网络请求异常", {}
        except Exception as e:
            logger.error(f"短信发送异常: {phone}, 错误: {str(e)}")
            return False, "系统异常", {}
    
    @classmethod
    def save_code_to_cache(cls, phone, code):
        cache_key = f"sms_code:{phone}"
        cache.set(cache_key, code, cls.CODE_EXPIRE_TIME)
        logger.info(f"验证码已缓存: {phone}")
    
    @classmethod
    def verify_code(cls, phone, code):
        cache_key = f"sms_code:{phone}"
        cached_code = cache.get(cache_key)
        
        if not cached_code:
            return False, "验证码已过期或不存在"
        
        if cached_code != code:
            return False, "验证码错误"
        
        # 验证成功后删除验证码
        cache.delete(cache_key)
        logger.info(f"验证码验证成功: {phone}")
        return True, "验证成功"
    
    @classmethod
    def send_verification_code(cls, phone):
        # 检查是否频繁发送（可选的限制机制）
        rate_limit_key = f"sms_rate_limit:{phone}"
        if cache.get(rate_limit_key):
            return False, "发送过于频繁，请稍后再试", None
        
        # 生成验证码
        code = cls.generate_code()
        
        # 发送短信
        success, message, response_data = cls.send_sms(phone, code)
        
        if success:
            # 保存验证码到缓存
            cls.save_code_to_cache(phone, code)
            
            # 设置发送频率限制（60秒内不能重复发送）
            cache.set(rate_limit_key, True, 60)
            
            return True, message, code
        else:
            return False, message, None