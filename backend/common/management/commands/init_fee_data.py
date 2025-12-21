"""
初始化缴费系统测试数据的管理命令
使用方法: python manage.py init_fee_data
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, timedelta
from decimal import Decimal
import random

from property.models import Building, House, FeeStandard, Bill
from users.models import User, Notification
from property.models import HouseUserBinding, HouseBindingApplication


class Command(BaseCommand):
    help = '初始化缴费系统测试数据'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='清除现有数据',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('清除现有数据...')
            Bill.objects.all().delete()
            FeeStandard.objects.all().delete()
            Notification.objects.filter(notification_type='bill_reminder').delete()
            self.stdout.write(self.style.SUCCESS('数据清除完成'))

        self.stdout.write('开始创建缴费系统测试数据...')
        
        # 1. 创建收费标准
        self.create_fee_standards()
        
        # 2. 创建测试用户和房屋绑定（如果不存在）
        self.create_test_users_and_houses()
        
        # 3. 创建测试账单
        self.create_test_bills()
        
        self.stdout.write(self.style.SUCCESS('缴费系统测试数据创建完成！'))

    def create_fee_standards(self):
        """创建收费标准"""
        self.stdout.write('创建收费标准...')
        
        standards = [
            {
                'name': '住宅物业管理费',
                'fee_type': 'property',
                'unit_price': Decimal('2.50'),
                'billing_unit': 'per_sqm_month',
                'description': '住宅物业管理费，按建筑面积计费'
            },
            {
                'name': '车位管理费',
                'fee_type': 'parking',
                'unit_price': Decimal('100.00'),
                'billing_unit': 'per_month',
                'description': '车位管理费，按月计费'
            },
            {
                'name': '生活用水费',
                'fee_type': 'water',
                'unit_price': Decimal('4.50'),
                'billing_unit': 'per_unit',
                'description': '生活用水费，按用量计费'
            },
            {
                'name': '居民用电费',
                'fee_type': 'electric',
                'unit_price': Decimal('0.56'),
                'billing_unit': 'per_degree',
                'description': '居民用电费，按度数计费'
            },
            {
                'name': '天然气费',
                'fee_type': 'gas',
                'unit_price': Decimal('2.80'),
                'billing_unit': 'per_unit',
                'description': '天然气费，按用量计费'
            }
        ]
        
        for std_data in standards:
            fee_standard, created = FeeStandard.objects.get_or_create(
                name=std_data['name'],
                fee_type=std_data['fee_type'],
                defaults=std_data
            )
            if created:
                self.stdout.write(f'  ✓ 创建收费标准: {fee_standard.name} - {fee_standard.unit_price}元')
            else:
                self.stdout.write(f'  - 收费标准已存在: {fee_standard.name}')

    def create_test_users_and_houses(self):
        """创建测试用户和房屋绑定"""
        self.stdout.write('检查测试用户和房屋绑定...')
        
        # 确保有楼栋和房屋数据
        buildings = Building.objects.all()
        if not buildings.exists():
            self.stdout.write('  警告：没有发现楼栋数据，请先运行 init_data_01.py 或 init_data_02.py')
            return
        
        # 检查是否已有房屋绑定数据
        bindings = HouseUserBinding.objects.filter(status=1, identity=1)
        if bindings.exists():
            self.stdout.write(f'  已存在 {bindings.count()} 个房屋绑定关系')
            return
        
        # 获取现有用户
        users = User.objects.filter(role=0)  # 普通居民
        houses = House.objects.all()
        
        if not users.exists() or not houses.exists():
            self.stdout.write('  警告：没有发现用户或房屋数据，请先运行基础数据初始化命令')
            return
        
        # 为前几个用户创建房屋绑定
        users_list = list(users[:5])  # 取前5个用户
        houses_list = list(houses[:5])  # 取前5套房屋
        
        for user, house in zip(users_list, houses_list):
            # 创建房屋绑定申请
            application, app_created = HouseBindingApplication.objects.get_or_create(
                user=user,
                building_name=house.building.name,
                unit_name=house.unit,
                room_number=house.room_number,
                defaults={
                    'applicant_name': user.real_name or user.username,
                    'applicant_phone': user.phone or f'138{user.id:08d}',
                    'id_card_number': f'11010119900101{user.id:04d}',
                    'identity': 1,  # 业主
                    'status': 1,  # 已通过
                    'audit_time': timezone.now()
                }
            )
            
            # 创建正式绑定关系
            if app_created:
                binding, binding_created = HouseUserBinding.objects.get_or_create(
                    user=user,
                    house=house,
                    application=application,
                    defaults={
                        'identity': 1,  # 业主
                        'status': 1  # 已绑定
                    }
                )
                
                if binding_created:
                    # 更新房屋状态
                    house.status = 1  # 自住
                    house.save()
                    
                    self.stdout.write(f'  ✓ 创建房屋绑定: {user.real_name or user.username} - {house}')

    def create_test_bills(self):
        """创建测试账单"""
        self.stdout.write('创建测试账单...')
        
        # 获取收费标准
        try:
            property_standard = FeeStandard.objects.get(fee_type='property')
            parking_standard = FeeStandard.objects.get(fee_type='parking')
        except FeeStandard.DoesNotExist:
            self.stdout.write('  错误：未找到收费标准，请先创建收费标准')
            return
        
        # 获取所有已绑定的房屋
        bindings = HouseUserBinding.objects.filter(status=1, identity=1).select_related('house', 'user')
        
        if not bindings.exists():
            self.stdout.write('  警告：没有房屋绑定数据，无法创建账单')
            return
        
        # 为每个房屋创建不同月份的账单
        current_date = date.today()
        months_data = [
            (2024, 11, 'paid'),     # 上个月已缴费
            (2024, 12, 'paid'),     # 上个月已缴费 
            (2025, 1, 'unpaid'),    # 当月未缴费
            (2025, 2, 'unpaid'),    # 下个月未缴费
        ]
        
        created_count = 0
        
        for binding in bindings:
            house = binding.house
            user = binding.user
            
            for year, month, status in months_data:
                # 计算计费周期
                billing_start = date(year, month, 1)
                if month == 12:
                    billing_end = date(year + 1, 1, 1) - timedelta(days=1)
                    due_date = date(year + 1, 1, 15)
                else:
                    billing_end = date(year, month + 1, 1) - timedelta(days=1)
                    due_date = date(year, month + 1, 15)
                
                # 创建物业费账单
                property_amount = house.area * property_standard.unit_price
                bill_data = {
                    'title': f'{year}年{month}月物业管理费',
                    'fee_type': 'property',
                    'house': house,
                    'user': user,
                    'fee_standard': property_standard,
                    'billing_period_start': billing_start,
                    'billing_period_end': billing_end,
                    'unit_price': property_standard.unit_price,
                    'quantity': house.area,
                    'amount': property_amount,
                    'status': status,
                    'due_date': due_date,
                    'description': f'房屋地址：{house}，计费面积：{house.area}平米'
                }
                
                # 如果是已支付状态，添加支付信息
                if status == 'paid':
                    payment_method = random.choice(['wechat', 'alipay'])
                    bill_data.update({
                        'paid_amount': property_amount,
                        'payment_method': payment_method,
                        'paid_at': timezone.now() - timedelta(days=random.randint(1, 28)),
                        'payment_reference': f'{payment_method.upper()}{year}{month:02d}{random.randint(100000, 999999)}'
                    })
                
                bill, created = Bill.objects.get_or_create(
                    house=house,
                    fee_type='property',
                    billing_period_start=billing_start,
                    billing_period_end=billing_end,
                    defaults=bill_data
                )
                
                if created:
                    created_count += 1
                    self.stdout.write(f'  ✓ 创建物业费账单: {bill.title} - {house} - {status}')
                
                # 50%概率创建停车费账单
                if random.choice([True, False]):
                    parking_bill_data = {
                        'title': f'{year}年{month}月车位管理费',
                        'fee_type': 'parking',
                        'house': house,
                        'user': user,
                        'fee_standard': parking_standard,
                        'billing_period_start': billing_start,
                        'billing_period_end': billing_end,
                        'unit_price': parking_standard.unit_price,
                        'quantity': Decimal('1'),
                        'amount': parking_standard.unit_price,
                        'status': random.choice(['paid', 'unpaid', 'unpaid']),  # 更大概率未支付
                        'due_date': due_date,
                        'description': f'房屋地址：{house}，车位管理费'
                    }
                    
                    if parking_bill_data['status'] == 'paid':
                        payment_method = random.choice(['wechat', 'alipay'])
                        parking_bill_data.update({
                            'paid_amount': parking_standard.unit_price,
                            'payment_method': payment_method,
                            'paid_at': timezone.now() - timedelta(days=random.randint(1, 28)),
                            'payment_reference': f'{payment_method.upper()}{year}{month:02d}{random.randint(100000, 999999)}'
                        })
                    
                    parking_bill, p_created = Bill.objects.get_or_create(
                        house=house,
                        fee_type='parking',
                        billing_period_start=billing_start,
                        billing_period_end=billing_end,
                        defaults=parking_bill_data
                    )
                    
                    if p_created:
                        created_count += 1
                        self.stdout.write(f'  ✓ 创建停车费账单: {parking_bill.title} - {house} - {parking_bill_data["status"]}')

        # 创建一些逾期账单（将due_date设置为过去）
        unpaid_bills = Bill.objects.filter(status='unpaid')[:3]
        overdue_count = 0
        for bill in unpaid_bills:
            old_due_date = bill.due_date
            bill.due_date = current_date - timedelta(days=random.randint(5, 30))
            bill.save()
            overdue_count += 1
            self.stdout.write(f'  ✓ 设置逾期账单: {bill.title} (原到期日: {old_due_date} -> 新到期日: {bill.due_date})')

        # 统计信息
        total_bills = Bill.objects.count()
        paid_bills = Bill.objects.filter(status='paid').count()
        unpaid_bills = Bill.objects.filter(status='unpaid').count()
        
        self.stdout.write(f'\n📊 账单统计:')
        self.stdout.write(f'  总账单数: {total_bills}')
        self.stdout.write(f'  已支付: {paid_bills}')
        self.stdout.write(f'  未支付: {unpaid_bills}')
        self.stdout.write(f'  逾期账单: {overdue_count}')
        self.stdout.write(f'  本次创建: {created_count}')

        # 创建一些催缴通知示例
        self.create_sample_notifications()

    def create_sample_notifications(self):
        """创建催缴通知示例"""
        self.stdout.write('创建催缴通知示例...')
        
        # 获取一些未支付的账单
        unpaid_bills = Bill.objects.filter(status='unpaid')[:2]
        
        notifications_created = 0
        for bill in unpaid_bills:
            house_info = f"{bill.house}" if bill.house else "您的房屋"
            content = f"尊敬的业主，{house_info}的{bill.get_fee_type_display()}（{bill.get_period_display()}）尚未缴费，" \
                     f"金额￥{bill.amount}，请于{bill.due_date}前完成缴费。"
            
            notification, created = Notification.objects.get_or_create(
                recipient=bill.user,
                related_object_type='bill',
                related_object_id=bill.id,
                defaults={
                    'title': '缴费催收通知',
                    'content': content,
                    'notification_type': 'bill_reminder'
                }
            )
            
            if created:
                notifications_created += 1
                self.stdout.write(f'  ✓ 创建催缴通知: {bill.user.real_name or bill.user.username} - {bill.title}')
        
        self.stdout.write(f'  共创建 {notifications_created} 条催缴通知')
