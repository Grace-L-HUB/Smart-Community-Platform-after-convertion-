"""
全局测试配置文件
提供所有测试共享的 fixtures 和配置
"""
import pytest
import tempfile
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


@pytest.fixture
def api_client():
    """
    提供 DRF 的 APIClient 实例
    用于测试 API 接口
    """
    return APIClient()


@pytest.fixture
def authenticated_client(api_client):
    """
    提供已认证的 API 客户端

    使用方式:
        client = authenticated_client()  # 使用默认测试用户
        client = authenticated_client(user=custom_user)  # 使用指定用户
    """
    def _client(user=None):
        if user is None:
            # 创建默认测试用户
            user, created = User.objects.get_or_create(
                phone='13800138000',
                defaults={
                    'password': 'testpass123',
                    'nickname': '测试用户',
                    'role': 'resident'
                }
            )
        api_client.force_authenticate(user=user)
        return api_client
    return _client


@pytest.fixture
def admin_user(db):
    """
    创建管理员用户
    """
    return User.objects.create_user(
        phone='13900139000',
        password='admin123',
        nickname='管理员',
        role='admin'
    )


@pytest.fixture
def property_staff_user(db):
    """
    创建物业员工用户
    """
    return User.objects.create_user(
        phone='13800138001',
        password='staff123',
        nickname='物业员工',
        role='property_staff'
    )


@pytest.fixture
def merchant_user(db):
    """
    创建商户用户
    """
    return User.objects.create_user(
        phone='13800138002',
        password='merchant123',
        nickname='商户',
        role='merchant'
    )


@pytest.fixture
def resident_user(db):
    """
    创建普通居民用户
    """
    return User.objects.create_user(
        phone='13800138003',
        password='resident123',
        nickname='居民',
        role='resident'
    )


@pytest.fixture(autouse=True)
def media_storage(settings, tmp_path):
    """
    自动为所有测试配置临时的 media 文件存储
    避免测试文件污染实际的 media 目录
    """
    settings.MEDIA_ROOT = str(tmp_path / 'media')
    return settings.MEDIA_ROOT


@pytest.fixture
def mock_sms_service(monkeypatch):
    """
    Mock 短信服务，避免实际发送短信
    """
    # Mock SMSService.send_sms 类方法
    def mock_send(cls, phone, code):
        return True, "发送成功", {}
    monkeypatch.setattr('users.sms_service.SMSService.send_sms', mock_send)

    # Mock SMSService.send_verification_code 类方法
    def mock_send_verification_code(cls, phone):
        code = "123456"
        # 模拟保存到缓存
        from django.core.cache import cache
        cache.set(f"sms_code:{phone}", code, 600)
        return True, "发送成功", code
    monkeypatch.setattr('users.sms_service.SMSService.send_verification_code', mock_send_verification_code)

    return mock_send_verification_code


@pytest.fixture
def mock_wechat_service(monkeypatch):
    """
    Mock 微信服务，避免调用真实微信 API
    """
    # 导入原始模块
    import users.wechat_service as wechat_service_module

    class MockWeChatService:
        @classmethod
        def get_session_info(cls, code):
            return True, "Success", {
                'openid': 'test_openid_123',
                'session_key': 'test_session_key'
            }

    # 替换模块中的类
    monkeypatch.setattr(wechat_service_module, 'WeChatService', MockWeChatService)
    return MockWeChatService.get_session_info
