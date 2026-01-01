"""
users 模块测试数据工厂
使用 factory-boy 生成测试数据
"""
import factory
from factory import fuzzy
from users.models import User, Notification


class UserFactory(factory.django.DjangoModelFactory):
    """
    用户数据工厂
    """
    class Meta:
        model = User

    username = factory.Sequence(lambda n: f'user{n:05d}')
    phone = factory.Sequence(lambda n: f'138{n:08d}')
    nickname = factory.Faker('first_name')  # Use English names
    avatar = None
    role = 0  # Default resident (0-3)

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        """重写创建方法，正确设置密码"""
        password = kwargs.pop('password', 'testpass123')
        user = model_class(**kwargs)
        user.set_password(password)
        user.save()
        return user


class ResidentFactory(UserFactory):
    """
    普通居民工厂
    """
    class Meta:
        model = User

    role = 0  # 普通居民


class PropertyStaffFactory(UserFactory):
    """
    物业员工工厂
    """
    class Meta:
        model = User

    role = 1  # 物业人员


class MerchantFactory(UserFactory):
    """
    商户工厂
    """
    class Meta:
        model = User

    role = 2  # 商户


class AdminFactory(UserFactory):
    """
    管理员工厂
    """
    class Meta:
        model = User

    role = 3  # 管理员


class NotificationFactory(factory.django.DjangoModelFactory):
    """
    通知数据工厂
    """
    class Meta:
        model = Notification

    recipient = factory.SubFactory(UserFactory)
    title = factory.Faker('sentence')  # English content
    content = factory.Faker('text')  # English content
    is_read = False
    notification_type = fuzzy.FuzzyChoice(['bill_reminder', 'system_notice', 'activity_notice', 'maintenance_notice', 'other'])
