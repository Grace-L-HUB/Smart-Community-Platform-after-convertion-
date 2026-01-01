"""
property 模块测试数据工厂
使用 factory-boy 生成测试数据
"""
import factory
from factory import fuzzy
from datetime import datetime, timedelta, date
from property.models import (
    Building, House, HouseBindingApplication, HouseUserBinding,
    ParkingSpace, ParkingBindingApplication, ParkingUserBinding,
    Visitor, Announcement, RepairOrder, RepairOrderImage, RepairEmployee,
    FeeStandard, Bill, AccessLog
)
from users.tests.fixtures import UserFactory


class BuildingFactory(factory.django.DjangoModelFactory):
    """楼栋数据工厂"""
    class Meta:
        model = Building

    name = factory.Sequence(lambda n: f"{n}号楼")


class HouseFactory(factory.django.DjangoModelFactory):
    """房屋数据工厂"""
    class Meta:
        model = House

    building = factory.SubFactory(BuildingFactory)
    unit = fuzzy.FuzzyChoice(['1单元', '2单元', '3单元', '4单元'])
    floor = fuzzy.FuzzyInteger(1, 30)
    room_number = factory.Sequence(lambda n: f"{n:03d}")
    area = fuzzy.FuzzyFloat(50.0, 200.0)
    status = 1  # 默认自住


class HouseBindingApplicationFactory(factory.django.DjangoModelFactory):
    """房屋绑定申请数据工厂"""
    class Meta:
        model = HouseBindingApplication

    user = factory.SubFactory(UserFactory)
    applicant_name = factory.Faker('name', locale='zh_CN')
    applicant_phone = factory.Sequence(lambda n: f'138{n:08d}')
    id_card_number = factory.Sequence(lambda n: f'11010119900101{n:04d}')
    community_name = '阳光花园'
    building_name = factory.Sequence(lambda n: f"{n}号楼")
    unit_name = fuzzy.FuzzyChoice(['1单元', '2单元'])
    room_number = factory.Sequence(lambda n: f"10{n:02d}")
    identity = fuzzy.FuzzyChoice([1, 2, 3])  # 业主/家庭成员/租客
    status = 0  # 待审核


class HouseUserBindingFactory(factory.django.DjangoModelFactory):
    """房屋用户绑定关系工厂"""
    class Meta:
        model = HouseUserBinding

    user = factory.SubFactory(UserFactory)
    house = factory.SubFactory(HouseFactory)
    application = factory.SubFactory(HouseBindingApplicationFactory)
    identity = 1  # 业主
    status = 1  # 已绑定


class ParkingSpaceFactory(factory.django.DjangoModelFactory):
    """车位数据工厂"""
    class Meta:
        model = ParkingSpace

    area_name = fuzzy.FuzzyChoice(['A区地下停车场', 'B区地面停车场'])
    space_number = factory.Sequence(lambda n: f"A-{n:03d}")
    parking_type = fuzzy.FuzzyChoice(['owned', 'rented'])
    status = 1  # 空闲


class ParkingBindingApplicationFactory(factory.django.DjangoModelFactory):
    """车位绑定申请数据工厂"""
    class Meta:
        model = ParkingBindingApplication

    user = factory.SubFactory(UserFactory)
    owner_name = factory.Faker('name', locale='zh_CN')
    owner_phone = factory.Sequence(lambda n: f'139{n:08d}')
    id_card = factory.Sequence(lambda n: f'11010119900101{n:04d}')
    community_name = '阳光花园'
    parking_type = fuzzy.FuzzyChoice(['owned', 'rented'])
    parking_area = fuzzy.FuzzyChoice(['A区地下停车场', 'B区地面停车场'])
    parking_no = factory.Sequence(lambda n: f"A-{n:03d}")
    car_no = factory.Sequence(lambda n: f"京A{n:05d}")
    car_brand = factory.Faker('word')
    car_color = fuzzy.FuzzyChoice(['白色', '黑色', '红色', '蓝色'])
    identity = 1
    status = 0  # 待审核


class ParkingUserBindingFactory(factory.django.DjangoModelFactory):
    """车位用户绑定关系工厂"""
    class Meta:
        model = ParkingUserBinding

    user = factory.SubFactory(UserFactory)
    parking_space = factory.SubFactory(ParkingSpaceFactory)
    application = factory.SubFactory(ParkingBindingApplicationFactory)
    identity = 1
    status = 1  # 已绑定


class VisitorFactory(factory.django.DjangoModelFactory):
    """访客数据工厂"""
    class Meta:
        model = Visitor

    name = factory.Faker('name', locale='zh_CN')
    phone = factory.Sequence(lambda n: f'138{n:08d}')
    car_number = factory.Sequence(lambda n: f"京B{n:05d}")
    visit_time = factory.LazyFunction(lambda: datetime.now() + timedelta(days=1))
    remark = factory.Faker('text', locale='zh_CN')
    status = 'pending'
    inviter = factory.SubFactory(UserFactory)


class AnnouncementFactory(factory.django.DjangoModelFactory):
    """公告数据工厂"""
    class Meta:
        model = Announcement

    title = factory.Faker('sentence', locale='zh_CN')
    content = factory.Faker('text', locale='zh_CN')
    status = 'draft'
    category = fuzzy.FuzzyChoice(['property_notice', 'community_news', 'warm_tips'])
    scope = 'all'
    target_buildings = None
    author = factory.SubFactory(UserFactory)
    author_name = factory.Faker('name', locale='zh_CN')


class RepairOrderFactory(factory.django.DjangoModelFactory):
    """报修工单数据工厂"""
    class Meta:
        model = RepairOrder

    category = fuzzy.FuzzyChoice(['public', 'household'])
    repair_type = fuzzy.FuzzyChoice(['water', 'electric', 'door', 'public', 'other'])
    priority = fuzzy.FuzzyChoice(['low', 'medium', 'high'])
    summary = factory.Faker('sentence', locale='zh_CN')
    description = factory.Faker('text', locale='zh_CN')
    location = factory.Faker('address', locale='zh_CN')
    reporter = factory.SubFactory(UserFactory)
    reporter_name = factory.Faker('name', locale='zh_CN')
    reporter_phone = factory.Sequence(lambda n: f'137{n:08d}')
    status = 'pending'


class RepairOrderImageFactory(factory.django.DjangoModelFactory):
    """报修工单图片工厂"""
    class Meta:
        model = RepairOrderImage

    order = factory.SubFactory(RepairOrderFactory)
    image = factory.Faker('url')
    image_type = 'image'


class RepairEmployeeFactory(factory.django.DjangoModelFactory):
    """维修人员工厂"""
    class Meta:
        model = RepairEmployee

    name = factory.Faker('name', locale='zh_CN')
    phone = factory.Sequence(lambda n: f'136{n:08d}')
    speciality = fuzzy.FuzzyChoice(['水电维修', '门窗维修', '管道维修', '家电维修'])
    is_active = True


class FeeStandardFactory(factory.django.DjangoModelFactory):
    """收费标准工厂"""
    class Meta:
        model = FeeStandard

    name = factory.Faker('sentence', locale='zh_CN')
    fee_type = fuzzy.FuzzyChoice(['property', 'parking', 'water', 'electric', 'gas'])
    unit_price = fuzzy.FuzzyFloat(1.0, 10.0)
    billing_unit = fuzzy.FuzzyChoice(['per_sqm_month', 'per_month', 'per_unit'])
    is_active = True
    description = factory.Faker('text', locale='zh_CN')


class BillFactory(factory.django.DjangoModelFactory):
    """账单工厂"""
    class Meta:
        model = Bill

    title = factory.Faker('sentence', locale='zh_CN')
    fee_type = fuzzy.FuzzyChoice(['property', 'parking', 'water', 'electric'])
    house = factory.SubFactory(HouseFactory)
    user = factory.SubFactory(UserFactory)
    fee_standard = factory.SubFactory(FeeStandardFactory)
    billing_period_start = factory.LazyFunction(lambda: date.today().replace(day=1))
    billing_period_end = factory.LazyFunction(
        lambda: date(date.today().year, date.today().month + 1, 1) - timedelta(days=1)
        if date.today().month < 12 else date(date.today().year + 1, 1, 1) - timedelta(days=1)
    )
    unit_price = fuzzy.FuzzyFloat(1.0, 10.0)
    quantity = fuzzy.FuzzyFloat(50.0, 200.0)
    amount = fuzzy.FuzzyFloat(100.0, 2000.0)
    status = 'unpaid'
    due_date = factory.LazyFunction(lambda: date.today() + timedelta(days=30))


class AccessLogFactory(factory.django.DjangoModelFactory):
    """门禁日志工厂"""
    class Meta:
        model = AccessLog

    person_name = factory.Faker('name', locale='zh_CN')
    method = fuzzy.FuzzyChoice(['face', 'qrcode', 'card', 'password'])
    direction = fuzzy.FuzzyChoice(['in', 'out'])
    location = fuzzy.FuzzyChoice(['1栋东门', '南大门', '地下车库入口'])
    user = factory.SubFactory(UserFactory)
    person_type = fuzzy.FuzzyChoice(['resident', 'visitor', 'delivery', 'staff'])
    success = True
