"""
Users module model tests
Tests User and Notification model properties and methods
"""
import pytest
from datetime import date, datetime
from django.utils import timezone
from users.models import User, Notification
from users.tests.fixtures import UserFactory, NotificationFactory


class TestUserModel:
    """User model tests"""

    @pytest.mark.django_db
    def test_create_user_with_phone(self):
        """Test creating user with phone number"""
        user = User.objects.create_user(
            username='testuser',
            phone='13800138000',
            password='testpass123'
        )
        assert user.phone == '13800138000'
        assert user.check_password('testpass123')
        assert user.register_type == 1  # Default phone registration

    @pytest.mark.django_db
    def test_user_display_name_priority(self):
        """Test display_name property priority"""
        # Only nickname
        user1 = UserFactory(nickname='xiaoming')
        assert user1.display_name == 'xiaoming'

        # Nickname has priority over real name
        user2 = UserFactory(nickname='xiaoming', real_name='realname')
        assert user2.display_name == 'xiaoming'

        # Real name has priority over username (nickname must be empty)
        user3 = UserFactory(nickname='', real_name='realname', username='user_realname')
        assert user3.display_name == 'realname'

        # Username has priority over phone (nickname and real_name empty)
        user4 = UserFactory(nickname='', real_name='', username='user_phone', phone='13900000001')
        assert user4.display_name == 'user_phone'

        # Phone as fallback (all others empty)
        user5 = UserFactory(nickname='', real_name='', username='', phone='13900000002')
        assert user5.display_name == '13900000002'

    @pytest.mark.django_db
    def test_is_phone_user_property(self):
        """Test is_phone_user property"""
        phone_user = UserFactory(register_type=1, phone='13800138000')
        assert phone_user.is_phone_user is True

        wechat_user = UserFactory(register_type=2, openid='wx_test')
        assert wechat_user.is_phone_user is False

    @pytest.mark.django_db
    def test_is_wechat_user_property(self):
        """Test is_wechat_user property"""
        wechat_user = UserFactory(register_type=2, openid='wx_test')
        assert wechat_user.is_wechat_user is True

        phone_user = UserFactory(register_type=1, phone='13800138000')
        assert phone_user.is_wechat_user is False

    @pytest.mark.django_db
    def test_age_calculation(self):
        """Test age calculation"""
        # Create a 20 year old user
        today = timezone.now().date()
        birth_date = date(today.year - 20, today.month, today.day)
        user = UserFactory(birthday=birth_date)
        assert user.age == 20

        # No birthday set returns None
        user_no_birthday = UserFactory(birthday=None)
        assert user_no_birthday.age is None

    @pytest.mark.django_db
    def test_get_full_address(self):
        """Test getting full address"""
        user = UserFactory(
            province='Beijing',
            city='Beijing',
            district='Chaoyang',
            address='street-123'
        )
        full_address = user.get_full_address()
        assert 'Beijing' in full_address
        assert 'Chaoyang' in full_address
        assert 'street-123' in full_address

    @pytest.mark.django_db
    def test_can_access_admin(self):
        """Test admin access permission"""
        # Admin can access
        admin = UserFactory(role=3, is_banned=False)
        assert admin.can_access_admin() is True

        # Property staff can access
        staff = UserFactory(role=1, is_banned=False)
        assert staff.can_access_admin() is True

        # Regular resident cannot access
        resident = UserFactory(role=0, is_banned=False)
        assert resident.can_access_admin() is False

        # Banned user cannot access
        banned_admin = UserFactory(role=3, is_banned=True)
        assert banned_admin.can_access_admin() is False


class TestNotificationModel:
    """Notification model tests"""

    @pytest.mark.django_db
    def test_create_notification(self):
        """Test creating notification"""
        user = UserFactory()
        notification = NotificationFactory(
            recipient=user,
            title='test-notification',
            content='this is a test notification',
            notification_type='system_notice'
        )
        assert notification.recipient == user
        assert notification.title == 'test-notification'
        assert notification.is_read is False

    @pytest.mark.django_db
    def test_mark_as_read(self):
        """Test mark as read"""
        notification = NotificationFactory(is_read=False)
        assert notification.is_read is False
        assert notification.read_at is None

        notification.mark_as_read()
        assert notification.is_read is True
        assert notification.read_at is not None

    @pytest.mark.django_db
    def test_mark_as_read_idempotent(self):
        """Test repeated mark as read does not override read_at"""
        notification = NotificationFactory(is_read=False)

        notification.mark_as_read()
        first_read_at = notification.read_at

        notification.mark_as_read()
        assert notification.read_at == first_read_at

    @pytest.mark.django_db
    def test_notification_str_representation(self):
        """Test notification string representation"""
        user = UserFactory(nickname='xiaoming')
        notification = NotificationFactory(
            recipient=user,
            title='payment-reminder'
        )
        str_repr = str(notification)
        assert 'payment-reminder' in str_repr
        assert 'xiaoming' in str_repr
