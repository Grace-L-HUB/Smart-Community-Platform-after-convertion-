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
        # Don't log secrets; mask APP_ID for debugging
        masked_appid = (cls.APP_ID[:6] + '...') if cls.APP_ID else 'MISSING'
        logger.debug(f"WeChatService.get_session_info called - appid={masked_appid}, js_code_len={len(code) if code else 0}")

        try:
            response = requests.get(url, params={k: v for k, v in params.items() if k != 'secret'}, timeout=5)
            # Log full request URL without secret for debugging
            logger.debug(f"WeChat API request url: {response.url}")

            # Try to parse JSON; if fails, include raw text in logs
            try:
                data = response.json()
            except ValueError:
                logger.error(f"WeChat API returned non-json response: {response.text}")
                return False, "Invalid response from WeChat API", None

            # Log WeChat response for debugging (mask potentially large fields)
            if isinstance(data, dict):
                errcode = data.get('errcode')
                errmsg = data.get('errmsg')
                logger.debug(f"WeChat API response errcode={errcode}, errmsg={errmsg}")

                if errcode is not None and errcode != 0:
                    logger.error(f"WeChat API Error: {data}")
                    return False, data.get("errmsg", "WeChat API Error"), None

            return True, "Success", data

        except requests.RequestException as e:
            logger.error(f"Network error when calling WeChat API: {e}")
            return False, "Network error", None
