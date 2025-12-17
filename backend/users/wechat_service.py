import requests
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class WeChatService:
    APP_ID = settings.WECHAT_APP_ID
    APP_SECRET = settings.WECHAT_APP_SECRET
    
    @classmethod
    def get_session_info(cls, code):
        """
        Exchange code for session_key and openid
        """
        url = "https://api.weixin.qq.com/sns/jscode2session"
        params = {
            "appid": cls.APP_ID,
            "secret": cls.APP_SECRET,
            "js_code": code,
            "grant_type": "authorization_code"
        }
        
        try:
            response = requests.get(url, params=params, timeout=5)
            data = response.json()
            
            if "errcode" in data and data["errcode"] != 0:
                logger.error(f"WeChat API Error: {data}")
                return False, data.get("errmsg", "WeChat API Error"), None
            
            return True, "Success", data
            
        except requests.RequestException as e:
            logger.error(f"Network error when calling WeChat API: {e}")
            return False, "Network error", None
