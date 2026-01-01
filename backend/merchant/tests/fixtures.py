"""
merchant 模块测试数据工厂
使用 factory-boy 生成测试数据
"""
import factory
from factory import fuzzy
from datetime import datetime, time, timedelta
from django.utils import timezone
from merchant.models import (
    MerchantApplication, MerchantProfile, MerchantProduct,
    MerchantCoupon, UserCoupon, MerchantOrder, MerchantOrderItem
)
from users.tests.fixtures import UserFactory


class MerchantApplicationFactory(factory.django.DjangoModelFactory):
    """商户申请数据工厂"""
    class Meta:
        model = MerchantApplication

    user = factory.SubFactory(UserFactory)
    shop_name = factory.Faker('company', locale='zh_CN')
    shop_category = fuzzy.FuzzyChoice(['convenience', 'catering', 'beauty', 'housekeeping', 'other'])
    shop_phone = factory.Sequence(lambda n: f'138{n:08d}')
    shop_address = factory.Faker('address', locale='zh_CN')
    shop_description = factory.Faker('text', locale='zh_CN')
    business_hours_start = time(8, 0)
    business_hours_end = time(22, 0)
    legal_name = factory.Faker('name', locale='zh_CN')
    legal_id_card = factory.Sequence(lambda n: f'11010119900101{n:04d}')
    legal_phone = factory.Sequence(lambda n: f'139{n:08d}')
    status = 'pending'


class MerchantProfileFactory(factory.django.DjangoModelFactory):
    """商户档案数据工厂"""
    class Meta:
        model = MerchantProfile

    user = factory.SubFactory(UserFactory)
    application = factory.SubFactory(MerchantApplicationFactory)
    shop_name = factory.Faker('company', locale='zh_CN')
    shop_category = fuzzy.FuzzyChoice(['convenience', 'catering', 'beauty', 'housekeeping'])
    shop_phone = factory.Sequence(lambda n: f'138{n:08d}')
    shop_address = factory.Faker('address', locale='zh_CN')
    shop_description = factory.Faker('text', locale='zh_CN')
    business_hours_start = time(8, 0)
    business_hours_end = time(22, 0)
    is_active = True


class MerchantProductFactory(factory.django.DjangoModelFactory):
    """商品数据工厂"""
    class Meta:
        model = MerchantProduct

    merchant = factory.SubFactory(MerchantProfileFactory)
    name = factory.Faker('sentence', locale='zh_CN')
    description = factory.Faker('text', locale='zh_CN')
    category = fuzzy.FuzzyChoice(['饮品', '甜品', '烘焙', '家政服务', '便民服务'])
    price = fuzzy.FuzzyFloat(10.0, 100.0)
    original_price = fuzzy.FuzzyFloat(15.0, 150.0)
    stock = fuzzy.FuzzyInteger(10, 100)
    status = 'online'


class MerchantCouponFactory(factory.django.DjangoModelFactory):
    """优惠券数据工厂"""
    class Meta:
        model = MerchantCoupon

    merchant = factory.SubFactory(MerchantProfileFactory)
    name = factory.Faker('sentence', locale='zh_CN')
    description = factory.Faker('text', locale='zh_CN')
    coupon_type = fuzzy.FuzzyChoice(['discount', 'deduction', 'gift'])
    amount = fuzzy.FuzzyFloat(5.0, 50.0)
    min_amount = fuzzy.FuzzyFloat(0.0, 100.0)
    total_count = fuzzy.FuzzyInteger(50, 500)
    used_count = 0
    per_user_limit = 1
    start_date = factory.LazyFunction(lambda: timezone.now())
    end_date = factory.LazyFunction(lambda: timezone.now() + timedelta(days=30))
    status = 'active'


class UserCouponFactory(factory.django.DjangoModelFactory):
    """用户优惠券数据工厂"""
    class Meta:
        model = UserCoupon

    user = factory.SubFactory(UserFactory)
    coupon = factory.SubFactory(MerchantCouponFactory)
    status = 'unused'


class MerchantOrderFactory(factory.django.DjangoModelFactory):
    """商户订单数据工厂"""
    class Meta:
        model = MerchantOrder

    merchant = factory.SubFactory(MerchantProfileFactory)
    user = factory.SubFactory(UserFactory)
    total_amount = fuzzy.FuzzyFloat(50.0, 500.0)
    actual_amount = fuzzy.FuzzyFloat(40.0, 450.0)
    status = 'new'
    pickup_type = fuzzy.FuzzyChoice(['pickup', 'delivery'])
    contact_name = factory.Faker('name', locale='zh_CN')
    contact_phone = factory.Sequence(lambda n: f'137{n:08d}')
    address = factory.Faker('address', locale='zh_CN')


class MerchantOrderItemFactory(factory.django.DjangoModelFactory):
    """订单商品明细数据工厂"""
    class Meta:
        model = MerchantOrderItem

    order = factory.SubFactory(MerchantOrderFactory)
    product = factory.SubFactory(MerchantProductFactory)
    product_name = factory.Faker('sentence', locale='zh_CN')
    product_price = fuzzy.FuzzyFloat(10.0, 100.0)
    quantity = fuzzy.FuzzyInteger(1, 5)
    specifications = {}
