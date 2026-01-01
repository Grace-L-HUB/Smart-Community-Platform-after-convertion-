"""
merchant 模块模型测试
测试商户管理相关的模型
"""
import pytest
from datetime import datetime, timedelta
from django.utils import timezone
from merchant.models import (
    MerchantApplication, MerchantProfile, MerchantProduct,
    MerchantCoupon, UserCoupon, MerchantOrder, MerchantOrderItem
)
from merchant.tests.fixtures import (
    MerchantApplicationFactory, MerchantProfileFactory,
    MerchantProductFactory, MerchantCouponFactory,
    UserCouponFactory, MerchantOrderFactory, MerchantOrderItemFactory
)
from users.tests.fixtures import UserFactory


class TestMerchantApplication:
    """MerchantApplication 模型测试"""

    @pytest.mark.django_db
    def test_create_application(self):
        """测试创建商户申请"""
        application = MerchantApplicationFactory(
            shop_name='测试便利店',
            shop_category='convenience',
            status='pending'
        )
        assert application.shop_name == '测试便利店'
        assert application.status == 'pending'
        assert application.get_status_display() == '待审核'

    @pytest.mark.django_db
    def test_approve_application(self):
        """测试审核通过商户申请"""
        application = MerchantApplicationFactory(status='pending')
        reviewer = UserFactory(role=3)  # 管理员
        applicant_role = application.user.role

        application.approve(reviewer, "审核通过")

        assert application.status == 'approved'
        assert application.reviewer == reviewer
        assert application.reviewed_at is not None

        # 用户角色应更新为商户
        application.user.refresh_from_db()
        assert application.user.role == 2

    @pytest.mark.django_db
    def test_reject_application(self):
        """测试拒绝商户申请"""
        application = MerchantApplicationFactory(status='pending')
        reviewer = UserFactory(role=3)

        application.reject(reviewer, "资料不完整")

        assert application.status == 'rejected'
        assert application.review_comment == "资料不完整"

    @pytest.mark.django_db
    def test_application_str_representation(self):
        """测试申请的字符串表示"""
        application = MerchantApplicationFactory(
            shop_name='测试店铺',
            status='pending'
        )
        str_repr = str(application)
        assert '测试店铺' in str_repr
        assert '待审核' in str_repr


class TestMerchantProfile:
    """MerchantProfile 模型测试"""

    @pytest.mark.django_db
    def test_create_profile(self):
        """测试创建商户档案"""
        profile = MerchantProfileFactory(
            shop_name='测试便利店',
            is_active=True
        )
        assert profile.shop_name == '测试便利店'
        assert profile.is_active is True
        assert profile.total_orders == 0
        assert profile.total_revenue == 0

    @pytest.mark.django_db
    def test_profile_str_representation(self):
        """测试档案的字符串表示"""
        profile = MerchantProfileFactory(
            shop_name='测试店铺',
            user__username='test_user'
        )
        str_repr = str(profile)
        assert '测试店铺' in str_repr
        assert 'test_user' in str_repr


class TestMerchantProduct:
    """MerchantProduct 模型测试"""

    @pytest.mark.django_db
    def test_create_product(self):
        """测试创建商品"""
        product = MerchantProductFactory(
            name='珍珠奶茶',
            price=15.00,
            stock=50,
            status='online'
        )
        assert product.name == '珍珠奶茶'
        assert product.price == 15.00
        assert product.stock == 50
        assert product.status == 'online'

    @pytest.mark.django_db
    def test_product_toggle_status(self):
        """测试商品上下架切换"""
        product = MerchantProductFactory(status='online')
        assert product.status == 'online'

        product.toggle_status()
        assert product.status == 'offline'

        product.toggle_status()
        assert product.status == 'online'

    @pytest.mark.django_db
    def test_product_str_representation(self):
        """测试商品的字符串表示"""
        merchant = MerchantProfileFactory(shop_name='测试便利店')
        product = MerchantProductFactory(
            name='珍珠奶茶',
            merchant=merchant
        )
        str_repr = str(product)
        assert '珍珠奶茶' in str_repr
        assert '测试便利店' in str_repr


class TestMerchantCoupon:
    """MerchantCoupon 模型测试"""

    @pytest.mark.django_db
    def test_create_coupon(self):
        """测试创建优惠券"""
        coupon = MerchantCouponFactory(
            name='满50减10',
            coupon_type='deduction',
            amount=10.00,
            min_amount=50.00,
            total_count=100
        )
        assert coupon.name == '满50减10'
        assert coupon.amount == 10.00
        assert coupon.total_count == 100

    @pytest.mark.django_db
    def test_coupon_remaining_count(self):
        """测试优惠券剩余数量"""
        coupon = MerchantCouponFactory(total_count=100, used_count=30)
        assert coupon.remaining_count == 70

        coupon.used_count = 100
        coupon.save()
        assert coupon.remaining_count == 0

    @pytest.mark.django_db
    def test_coupon_is_valid(self):
        """测试优惠券是否有效"""
        # 有效的优惠券
        valid_coupon = MerchantCouponFactory(
            status='active',
            total_count=100,
            used_count=50,
            start_date=timezone.now() - timedelta(days=1),
            end_date=timezone.now() + timedelta(days=30)
        )
        assert valid_coupon.is_valid is True

        # 状态不活跃
        inactive_coupon = MerchantCouponFactory(status='inactive')
        assert inactive_coupon.is_valid is False

        # 已过期
        expired_coupon = MerchantCouponFactory(
            status='active',
            end_date=timezone.now() - timedelta(days=1)
        )
        assert expired_coupon.is_valid is False

        # 已领完
        out_of_stock_coupon = MerchantCouponFactory(
            status='active',
            total_count=100,
            used_count=100
        )
        assert out_of_stock_coupon.is_valid is False

    @pytest.mark.django_db
    def test_coupon_str_representation(self):
        """测试优惠券字符串表示"""
        merchant = MerchantProfileFactory(shop_name='测试便利店')
        coupon = MerchantCouponFactory(
            name='满减券',
            merchant=merchant
        )
        str_repr = str(coupon)
        assert '满减券' in str_repr
        assert '测试便利店' in str_repr


class TestUserCoupon:
    """UserCoupon 模型测试"""

    @pytest.mark.django_db
    def test_create_user_coupon(self):
        """测试创建用户优惠券"""
        user_coupon = UserCouponFactory(status='unused')
        assert user_coupon.status == 'unused'
        assert user_coupon.verification_code is not None
        assert len(user_coupon.verification_code) == 12

    @pytest.mark.django_db
    def test_user_coupon_use(self):
        """测试使用优惠券"""
        user_coupon = UserCouponFactory(status='unused')
        order = MerchantOrderFactory()

        user_coupon.use_coupon(order)

        assert user_coupon.status == 'used'
        assert user_coupon.used_at is not None
        assert user_coupon.used_order == order

    @pytest.mark.django_db
    def test_user_coupon_unique_constraint(self):
        """测试用户唯一约束"""
        user = UserFactory()
        coupon = MerchantCouponFactory()

        UserCouponFactory(user=user, coupon=coupon)

        # 重复领取应该违反唯一约束
        with pytest.raises(Exception):  # IntegrityError
            UserCouponFactory(user=user, coupon=coupon)


class TestMerchantOrder:
    """MerchantOrder 模型测试"""

    @pytest.mark.django_db
    def test_create_order(self):
        """测试创建订单"""
        order = MerchantOrderFactory(
            total_amount=100.00,
            actual_amount=90.00,
            status='new'
        )
        assert order.total_amount == 100.00
        assert order.actual_amount == 90.00
        assert order.order_no is not None
        assert order.order_no.startswith('ORD')

    @pytest.mark.django_db
    def test_order_accept(self):
        """测试接单"""
        order = MerchantOrderFactory(status='new')

        order.accept_order()

        assert order.status == 'accepted'
        assert order.accepted_at is not None
        assert order.pickup_code is not None
        assert len(order.pickup_code) == 6

    @pytest.mark.django_db
    def test_order_complete(self):
        """测试完成订单"""
        order = MerchantOrderFactory(status='accepted')

        order.complete_order()

        assert order.status == 'completed'
        assert order.completed_at is not None

    @pytest.mark.django_db
    def test_order_pickup_code_generation(self):
        """测试取餐码生成"""
        order = MerchantOrderFactory(status='new')

        # 接单后应生成取餐码
        order.accept_order()
        assert order.pickup_code is not None
        assert order.pickup_code.isdigit()
        assert len(order.pickup_code) == 6

    @pytest.mark.django_db
    def test_order_str_representation(self):
        """测试订单字符串表示"""
        merchant = MerchantProfileFactory(shop_name='测试便利店')
        order = MerchantOrderFactory(merchant=merchant)
        str_repr = str(order)
        assert order.order_no in str_repr
        assert '测试便利店' in str_repr


class TestMerchantOrderItem:
    """MerchantOrderItem 模型测试"""

    @pytest.mark.django_db
    def test_create_order_item(self):
        """测试创建订单商品"""
        item = MerchantOrderItemFactory(
            product_name='珍珠奶茶',
            product_price=15.00,
            quantity=2
        )
        # 小计自动计算
        assert item.product_name == '珍珠奶茶'
        assert item.product_price == 15.00
        assert item.quantity == 2

    @pytest.mark.django_db
    def test_order_item_subtotal_calculation(self):
        """测试订单商品小计计算"""
        item = MerchantOrderItemFactory(
            product_price=15.00,
            quantity=3
        )
        assert item.subtotal == 45.00

    @pytest.mark.django_db
    def test_order_item_str_representation(self):
        """测试订单商品字符串表示"""
        order = MerchantOrderFactory(order_no='ORD123456')
        item = MerchantOrderItemFactory(
            order=order,
            product_name='珍珠奶茶'
        )
        str_repr = str(item)
        assert 'ORD123456' in str_repr
        assert '珍珠奶茶' in str_repr
