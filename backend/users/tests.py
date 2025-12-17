import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch

User = get_user_model()

# ---------------------------------------------------------
# 场景一：落库测试 (DB Test)
# @pytest.mark.django_db 标记告诉 pytest 需要建立测试数据库，用完自动回滚
# ---------------------------------------------------------

@pytest.mark.django_db
def test_login_success():
    """
    测试正常登录流程：
    1. 创建一个测试用户存入 DB
    2. 发送登录请求
    3. 验证返回 200 和 Token
    """
    # 1. 准备数据
    username = "testuser"
    password = "testpassword123"
    User.objects.create_user(username=username, password=password)

    # 2. 发起请求
    client = APIClient()
    url = "/api/auth/login"  # 确保你的路由配置正确
    data = {
        "username": username,
        "password": password
    }
    response = client.post(url, data)

    # 3. 断言验证
    assert response.status_code == status.HTTP_200_OK
    assert "token" in response.data["data"]
    assert response.data["message"] == "登录成功"

@pytest.mark.django_db
def test_login_fail_wrong_password():
    """测试密码错误的情况"""
    User.objects.create_user(username="testuser", password="rightpassword")
    
    client = APIClient()
    response = client.post("/api/auth/login", {
        "username": "testuser",
        "password": "wrongpassword"
    })
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST

# ---------------------------------------------------------
# 场景二：Mock 测试 (不依赖外部接口)
# 假设你有一个微信登录接口，需要调用微信服务器，测试时不能真的调
# ---------------------------------------------------------

# @pytest.mark.django_db
# def test_wechat_login_mock():
#     """
#     模拟微信登录，Mock 掉去微信服务器验证的那一步
#     """
#     # 假设你的 view 里面调用了一个叫 verify_wechat_code 的函数
#     # 我们用 patch 把它替换掉，强制它返回我们要的结果
    
#     # 这里的路径 'users.views.verify_wechat_code' 需要替换成你真实的函数路径
#     # 如果你的逻辑都在 View 里，可能需要 Mock requests.get
#     with patch('users.views.verify_wechat_code') as mock_verify:
#         # 设定 Mock 的返回值（假装微信返回了 openid）
#         mock_verify.return_value = {"openid": "fake_openid_123"}
        
#         client = APIClient()
#         response = client.post("/api/auth/wechat-login", {"code": "any_code"})
        
#         # 验证接口逻辑是否处理了 Mock 的返回值
#         # (这里假设你的接口还未实现，实现了就可以取消注释)
#         # assert response.status_code == 200
#         # assert response.data['openid'] == "fake_openid_123"