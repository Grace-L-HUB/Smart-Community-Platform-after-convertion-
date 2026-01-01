"""
users 模块视图测试
测试各个 API 接口的功能
"""
import pytest
from rest_framework import status
from django.contrib.auth import get_user_model
from django.core.cache import cache
from users.models import Notification
from users.tests.fixtures import UserFactory, NotificationFactory

User = get_user_model()


class TestLoginView:
    """登录视图测试"""

    @pytest.mark.django_db
    def test_login_with_password_success(self, api_client):
        """测试密码登录成功"""
        # 创建测试用户 - username 和 phone 一致
        user = UserFactory(username='13800138000', phone='13800138000', password='testpass123')

        response = api_client.post('/api/auth/login', {
            'username': '13800138000',
            'password': 'testpass123'
        })

        assert response.status_code == status.HTTP_200_OK
        assert response.data['code'] == 200

    @pytest.mark.django_db
    def test_login_with_wrong_password(self, api_client):
        """测试密码错误登录失败"""
        UserFactory(username='13800138000', phone='13800138000', password='testpass123')

        response = api_client.post('/api/auth/login', {
            'username': '13800138000',
            'password': 'wrongpassword'
        })

        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestSMSCodeView:
    """短信验证码视图测试"""

    @pytest.mark.django_db
    def test_send_sms_code_success(self, api_client):
        """测试发送验证码成功"""
        response = api_client.post('/api/auth/send-sms-code', {
            'phone': '13800138000'
        })

        assert response.status_code == status.HTTP_200_OK
        assert response.data['code'] == 200

    @pytest.mark.django_db
    def test_verify_sms_code_success(self, api_client):
        """测试验证码验证成功"""
        phone = '13800138000'
        # 直接设置验证码到缓存
        cache.set(f"sms_code:{phone}", "123456", 600)

        response = api_client.post('/api/auth/verify-code', {
            'phone': phone,
            'code': "123456"
        })

        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_verify_sms_code_wrong_code(self, api_client):
        """测试验证码错误"""
        response = api_client.post('/api/auth/verify-code', {
            'phone': '13800138000',
            'code': '000000'  # 错误的验证码
        })

        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestSMSLoginView:
    """短信登录视图测试"""

    @pytest.mark.django_db
    def test_sms_login_success(self, api_client):
        """测试短信登录成功"""
        phone = '13800138000'
        # 创建用户
        user = UserFactory(phone=phone)
        # 设置验证码到缓存
        cache.set(f"sms_code:{phone}", "123456", 600)

        response = api_client.post('/api/auth/sms-login', {
            'phone': phone,
            'code': "123456"
        })

        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_sms_login_user_not_exists(self, api_client):
        """测试短信登录用户不存在"""
        phone = '13800138000'
        cache.set(f"sms_code:{phone}", "123456", 600)

        response = api_client.post('/api/auth/sms-login', {
            'phone': phone,
            'code': "123456"
        })

        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestSMSRegisterView:
    """短信注册视图测试"""

    @pytest.mark.django_db
    def test_sms_register_success(self, api_client):
        """测试短信注册成功"""
        phone = '13800138000'
        cache.set(f"sms_code:{phone}", "123456", 600)

        response = api_client.post('/api/auth/sms-register', {
            'phone': phone,
            'code': "123456",
            'nickname': 'newuser'
        })

        assert response.status_code == status.HTTP_200_OK


class TestUserStatsView:
    """用户统计视图测试"""

    @pytest.mark.django_db
    def test_get_user_stats(self, api_client):
        """测试获取用户统计"""
        UserFactory.create_batch(5, role=0)

        response = api_client.get('/api/stats')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['data']['total_users'] == 5


class TestIdentityCodeView:
    """身份码视图测试"""

    @pytest.mark.django_db
    def test_get_identity_code(self, api_client):
        """测试获取身份通行码"""
        user = UserFactory()

        response = api_client.get(f'/api/user/identity-code?user_id={user.id}')

        assert response.status_code == status.HTTP_200_OK
