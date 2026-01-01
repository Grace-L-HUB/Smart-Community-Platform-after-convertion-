"""
property 模块模型测试
测试各个模型的属性和方法
"""
import pytest
from datetime import datetime, timedelta, date
from django.utils import timezone
from property.models import (
    Building, House, HouseBindingApplication, HouseUserBinding,
    ParkingSpace, Visitor, Announcement, RepairOrder,
    FeeStandard, Bill, AccessLog
)
from property.tests.fixtures import (
    BuildingFactory, HouseFactory, HouseBindingApplicationFactory, HouseUserBindingFactory,
    ParkingSpaceFactory, VisitorFactory, AnnouncementFactory,
    RepairOrderFactory, FeeStandardFactory, BillFactory, AccessLogFactory
)
from users.tests.fixtures import UserFactory


class TestBuildingModel:
    """Building 模型测试"""

    @pytest.mark.django_db
    def test_create_building(self):
        """测试创建楼栋"""
        building = BuildingFactory(name='1号楼')
        assert building.name == '1号楼'
        assert str(building) == '1号楼'


class TestHouseModel:
    """House 模型测试"""

    @pytest.mark.django_db
    def test_create_house(self):
        """测试创建房屋"""
        building = BuildingFactory()
        house = HouseFactory(
            building=building,
            unit='1单元',
            floor=10,
            room_number='101'
        )
        assert house.building == building
        assert house.unit == '1单元'
        assert str(house) == '1号楼-1单元-101'

    @pytest.mark.django_db
    def test_house_unique_constraint(self):
        """测试房屋唯一约束"""
        building = BuildingFactory()
        HouseFactory(
            building=building,
            unit='1单元',
            room_number='101'
        )

        # 重复创建应该违反唯一约束
        with pytest.raises(Exception):  # IntegrityError
            HouseFactory(
                building=building,
                unit='1单元',
                room_number='101'
            )


class TestHouseBindingApplication:
    """HouseBindingApplication 模型测试"""

    @pytest.mark.django_db
    def test_create_application(self):
        """测试创建绑定申请"""
        application = HouseBindingApplicationFactory(
            identity=1,  # 业主
            status=0  # 待审核
        )
        assert application.identity == 1
        assert application.status == 0
        assert application.get_identity_display() == '业主'
        assert application.get_status_display() == '待审核'

    @pytest.mark.django_db
    def test_application_str_representation(self):
        """测试申请的字符串表示"""
        application = HouseBindingApplicationFactory(
            applicant_name='张三',
            building_name='1号楼',
            unit_name='1单元',
            room_number='101'
        )
        str_repr = str(application)
        assert '张三' in str_repr
        assert '1号楼' in str_repr


class TestHouseUserBinding:
    """HouseUserBinding 模型测试"""

    @pytest.mark.django_db
    def test_create_user_binding(self):
        """测试创建用户房屋绑定"""
        binding = HouseUserBindingFactory(
            identity=1,
            status=1
        )
        assert binding.identity == 1
        assert binding.status == 1
        assert binding.get_identity_display() == '业主'
        assert binding.get_status_display() == '已绑定'


class TestParkingSpaceModel:
    """ParkingSpace 模型测试"""

    @pytest.mark.django_db
    def test_create_parking_space(self):
        """测试创建车位"""
        parking = ParkingSpaceFactory(
            area_name='A区地下停车场',
            space_number='A-001',
            parking_type='owned'
        )
        assert parking.area_name == 'A区地下停车场'
        assert parking.space_number == 'A-001'
        assert str(parking) == 'A区地下停车场-A-001'


class TestVisitorModel:
    """Visitor 模型测试"""

    @pytest.mark.django_db
    def test_create_visitor(self):
        """测试创建访客邀请"""
        visitor = VisitorFactory(
            name='李四',
            phone='13900139000',
            status='pending'
        )
        assert visitor.name == '李四'
        assert visitor.status == 'pending'
        assert visitor.qr_code_token is not None
        assert visitor.qr_code_expires_at is not None

    @pytest.mark.django_db
    def test_visitor_qr_code_expires(self):
        """测试二维码过期检查"""
        visitor = VisitorFactory(
            qr_code_expires_at=timezone.now() - timedelta(hours=1)
        )
        assert visitor.is_qr_code_expired() is True

        visitor.qr_code_expires_at = timezone.now() + timedelta(hours=1)
        visitor.save()
        assert visitor.is_qr_code_expired() is False

    @pytest.mark.django_db
    def test_visitor_qr_code_data(self):
        """测试获取二维码数据"""
        visitor = VisitorFactory()
        qr_data = visitor.get_qr_code_data()
        assert qr_data['type'] == 'v'
        assert 'id' in qr_data
        assert 'token' in qr_data

    @pytest.mark.django_db
    def test_visitor_qr_code_simple_string(self):
        """测试获取简化二维码字符串"""
        visitor = VisitorFactory()
        simple_string = visitor.get_qr_code_simple_string()
        assert simple_string.startswith('v|')
        assert str(visitor.id) in simple_string


class TestAnnouncementModel:
    """Announcement 模型测试"""

    @pytest.mark.django_db
    def test_create_announcement(self):
        """测试创建公告"""
        announcement = AnnouncementFactory(
            title='停水通知',
            status='draft',
            category='property_notice'
        )
        assert announcement.title == '停水通知'
        assert announcement.status == 'draft'
        assert announcement.published_at is None

    @pytest.mark.django_db
    def test_announcement_publish(self):
        """测试发布公告"""
        announcement = AnnouncementFactory(status='draft')
        assert announcement.published_at is None

        announcement.publish()
        assert announcement.status == 'published'
        assert announcement.published_at is not None

    @pytest.mark.django_db
    def test_announcement_withdraw(self):
        """测试撤回公告"""
        announcement = AnnouncementFactory(status='published')
        announcement.publish()  # 设置发布时间

        announcement.withdraw()
        assert announcement.status == 'withdrawn'
        assert announcement.withdrawn_at is not None


class TestRepairOrderModel:
    """RepairOrder 模型测试"""

    @pytest.mark.django_db
    def test_create_repair_order(self):
        """测试创建报修工单"""
        order = RepairOrderFactory(
            summary='水管漏水',
            status='pending',
            priority='medium'
        )
        assert order.summary == '水管漏水'
        assert order.status == 'pending'
        assert order.order_no is not None  # 自动生成工单号
        assert order.order_no.startswith('WO')

    @pytest.mark.django_db
    def test_repair_order_auto_generate_number(self):
        """测试工单号自动生成"""
        today = date.today()
        date_str = today.strftime('%Y%m%d')

        order1 = RepairOrderFactory()
        order2 = RepairOrderFactory()

        assert order1.order_no != order2.order_no
        assert date_str in order1.order_no
        assert date_str in order2.order_no

    @pytest.mark.django_db
    def test_repair_order_assign(self):
        """测试派单"""
        order = RepairOrderFactory(status='pending')
        staff = UserFactory(nickname='维修工张三')

        order.assign_to('维修工张三', staff)

        assert order.status == 'processing'
        assert order.assignee == '维修工张三'
        assert order.assigned_by == staff
        assert order.assigned_at is not None

    @pytest.mark.django_db
    def test_repair_order_complete(self):
        """测试完成工单"""
        order = RepairOrderFactory(status='processing')

        order.complete_order(result='已修复', cost=100)

        assert order.status == 'completed'
        assert order.result == '已修复'
        assert order.cost == 100
        assert order.completed_at is not None

    @pytest.mark.django_db
    def test_repair_order_reject(self):
        """测试驳回工单"""
        order = RepairOrderFactory(status='pending')

        order.reject_order()

        assert order.status == 'rejected'


class TestFeeStandardModel:
    """FeeStandard 模型测试"""

    @pytest.mark.django_db
    def test_create_fee_standard(self):
        """测试创建收费标准"""
        standard = FeeStandardFactory(
            name='物业费',
            fee_type='property',
            unit_price=2.5,
            billing_unit='per_sqm_month'
        )
        assert standard.name == '物业费'
        assert standard.fee_type == 'property'
        assert standard.unit_price == 2.5

    @pytest.mark.django_db
    def test_fee_standard_str_representation(self):
        """测试收费标准字符串表示"""
        standard = FeeStandardFactory(
            name='物业费',
            unit_price=2.5,
            billing_unit='per_sqm_month'
        )
        str_repr = str(standard)
        assert '物业费' in str_repr
        assert '2.5' in str_repr


class TestBillModel:
    """Bill 模型测试"""

    @pytest.mark.django_db
    def test_create_bill(self):
        """测试创建账单"""
        bill = BillFactory(
            fee_type='property',
            amount=500.00,
            status='unpaid'
        )
        assert bill.fee_type == 'property'
        assert bill.amount == 500.00
        assert bill.status == 'unpaid'
        assert bill.bill_no is not None
        assert bill.bill_no.startswith('BILL')

    @pytest.mark.django_db
    def test_bill_is_overdue(self):
        """测试检查账单是否逾期"""
        # 过期的账单
        overdue_bill = BillFactory(
            status='unpaid',
            due_date=date.today() - timedelta(days=1)
        )
        assert overdue_bill.is_overdue() is True

        # 未过期的账单
        bill = BillFactory(
            status='unpaid',
            due_date=date.today() + timedelta(days=30)
        )
        assert bill.is_overdue() is False

        # 已支付的账单不算逾期
        paid_bill = BillFactory(
            status='paid',
            due_date=date.today() - timedelta(days=1)
        )
        assert paid_bill.is_overdue() is False

    @pytest.mark.django_db
    def test_bill_mark_as_paid(self):
        """测试标记账单为已支付"""
        bill = BillFactory(status='unpaid')

        bill.mark_as_paid(
            payment_method='wechat',
            payment_reference='TXN123456'
        )

        assert bill.status == 'paid'
        assert bill.paid_amount == bill.amount
        assert bill.payment_method == 'wechat'
        assert bill.payment_reference == 'TXN123456'
        assert bill.paid_at is not None

    @pytest.mark.django_db
    def test_bill_get_period_display(self):
        """测试获取计费周期显示"""
        bill = BillFactory(
            billing_period_start=date(2024, 12, 1),
            billing_period_end=date(2024, 12, 31)
        )
        period = bill.get_period_display()
        assert '2024年12月' in period


class TestAccessLogModel:
    """AccessLog 模型测试"""

    @pytest.mark.django_db
    def test_create_access_log(self):
        """测试创建门禁日志"""
        log = AccessLogFactory(
            person_name='张三',
            method='face',
            direction='in',
            location='1栋东门'
        )
        assert log.person_name == '张三'
        assert log.method == 'face'
        assert log.direction == 'in'

    @pytest.mark.django_db
    def test_access_log_get_method_display_short(self):
        """测试获取开门方式简称"""
        log = AccessLogFactory(method='face')
        assert log.get_method_display_short() == '人脸'

        log.method = 'qrcode'
        log.save()
        assert log.get_method_display_short() == '二维码'

    @pytest.mark.django_db
    def test_access_log_get_direction_display_short(self):
        """测试获取进出方向简称"""
        log = AccessLogFactory(direction='in')
        assert log.get_direction_display_short() == '进入'

        log.direction = 'out'
        log.save()
        assert log.get_direction_display_short() == '离开'

    @pytest.mark.django_db
    def test_access_log_get_person_type_display_short(self):
        """测试获取人员类型简称"""
        log = AccessLogFactory(person_type='resident')
        assert log.get_person_type_display_short() == '业主'

        log.person_type = 'visitor'
        log.save()
        assert log.get_person_type_display_short() == '访客'
