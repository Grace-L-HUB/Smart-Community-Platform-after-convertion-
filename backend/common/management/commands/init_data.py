from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from faker import Faker
import random
from decimal import Decimal

from users.models import User
from property.models import (
    Building, House, ParkingSpace, 
    HouseBindingApplication, HouseUserBinding,
    ParkingBindingApplication, ParkingUserBinding
)

fake = Faker('zh_CN')  # 使用中文生成器


class Command(BaseCommand):
    help = '初始化测试数据 - 生成小区房产和车位数据'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='清空现有数据后重新生成',
        )
        parser.add_argument(
            '--buildings',
            type=int,
            default=4,
            help='生成的楼栋数量 (默认: 4)',
        )
        parser.add_argument(
            '--floors',
            type=int,
            default=18,
            help='每栋楼的层数 (默认: 18)',
        )
        parser.add_argument(
            '--units',
            type=int,
            default=2,
            help='每层的单元数 (默认: 2)',
        )
        parser.add_argument(
            '--rooms-per-floor',
            type=int,
            default=4,
            help='每层每单元的房间数 (默认: 4)',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write(self.style.WARNING('正在清空现有数据...'))
            self._clear_data()
        
        self.stdout.write(self.style.SUCCESS('开始生成测试数据...'))
        
        with transaction.atomic():
            # 1. 生成用户数据
            users = self._create_users(100)
            self.stdout.write(self.style.SUCCESS(f'✓ 生成了 {len(users)} 个用户'))
            
            # 2. 生成楼栋
            buildings = self._create_buildings(options['buildings'])
            self.stdout.write(self.style.SUCCESS(f'✓ 生成了 {len(buildings)} 栋楼'))
            
            # 3. 生成房屋
            houses = self._create_houses(
                buildings, 
                options['floors'], 
                options['units'],
                options['rooms_per_floor']
            )
            self.stdout.write(self.style.SUCCESS(f'✓ 生成了 {len(houses)} 套房屋'))
            
            # 4. 生成车位
            parking_spaces = self._create_parking_spaces()
            self.stdout.write(self.style.SUCCESS(f'✓ 生成了 {len(parking_spaces)} 个车位'))
            
            # 5. 生成房屋绑定关系（60%已绑定，40%空闲）
            house_bindings = self._create_house_bindings(houses, users, bind_ratio=0.6)
            self.stdout.write(self.style.SUCCESS(f'✓ 生成了 {len(house_bindings)} 个房屋绑定关系'))
            
            # 6. 生成车位绑定关系（70%已绑定，30%空闲）
            parking_bindings = self._create_parking_bindings(parking_spaces, users, bind_ratio=0.7)
            self.stdout.write(self.style.SUCCESS(f'✓ 生成了 {len(parking_bindings)} 个车位绑定关系'))
        
        self.stdout.write(
            self.style.SUCCESS('\n🎉 测试数据生成完成！\n')
        )
        self._print_summary()

    def _clear_data(self):
        """清空现有数据"""
        models_to_clear = [
            HouseUserBinding, ParkingUserBinding,
            HouseBindingApplication, ParkingBindingApplication,
            House, ParkingSpace, Building
        ]
        
        for model in models_to_clear:
            count = model.objects.count()
            if count > 0:
                model.objects.all().delete()
                self.stdout.write(f'  清空了 {model._meta.verbose_name}: {count} 条记录')

    def _create_users(self, count):
        """生成用户数据"""
        users = []
        
        # 生成一些管理员用户（如果不存在则创建）
        for i in range(3):
            username = f'admin{i+1}'
            phone = f'1380000{1000+i:04d}'
            
            # 检查管理员是否已存在
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'phone': phone,
                    'nickname': f'管理员{i+1}',
                    'real_name': fake.name(),
                    'role': 3,  # 管理员
                    'is_verified': True,
                }
            )
            
            # 如果已存在，设置密码（以防密码被修改过）
            if not created:
                user.set_password('123456')
                user.save()
            else:
                # 新创建的用户需要设置密码
                user.set_password('123456')
                user.save()
            
            users.append(user)
        
        # 生成普通居民
        for i in range(count - 3):
            # 随机选择注册方式
            register_type = random.choice([1, 2])  # 手机或微信注册
            
            user_data = {
                'username': fake.user_name() + str(i),
                'nickname': fake.name(),
                'real_name': fake.name(),
                'phone': fake.phone_number(),
                'gender': random.choice([0, 1, 2]),
                'birthday': fake.date_of_birth(minimum_age=20, maximum_age=80),
                'province': fake.province(),
                'city': fake.city(),
                'district': fake.district(),
                'address': fake.street_address(),
                'role': random.choice([0, 0, 0, 1]),  # 大部分是普通居民
                'register_type': register_type,
                'is_verified': random.choice([True, True, False]),  # 大部分已实名
                'password': '123456'
            }
            
            if register_type == 2:  # 微信注册
                user_data['openid'] = fake.uuid4()
                
            user = User.objects.create_user(**user_data)
            users.append(user)
            
        return users

    def _create_buildings(self, count):
        """生成楼栋数据"""
        buildings = []
        for i in range(1, count + 1):
            building = Building.objects.create(name=f'{i}栋')
            buildings.append(building)
        return buildings

    def _create_houses(self, buildings, floors, units, rooms_per_floor):
        """生成房屋数据"""
        houses = []
        
        # 房屋面积选择
        area_choices = [
            Decimal('89.5'), Decimal('105.2'), Decimal('125.8'), 
            Decimal('145.6'), Decimal('168.9'), Decimal('200.3')
        ]
        
        for building in buildings:
            for floor in range(1, floors + 1):
                for unit in range(1, units + 1):
                    for room in range(1, rooms_per_floor + 1):
                        # 房间号格式：楼层+房间号 (如：101, 102, 201, 202)
                        room_number = f'{floor:02d}{room:02d}'
                        
                        house = House.objects.create(
                            building=building,
                            unit=f'{unit}单元',
                            floor=floor,
                            room_number=room_number,
                            area=random.choice(area_choices),
                            status=random.choice([1, 2, 3])  # 随机状态
                        )
                        houses.append(house)
        
        return houses

    def _create_parking_spaces(self):
        """生成车位数据"""
        parking_spaces = []
        
        # 定义停车区域
        areas = [
            ('A区地下停车场', 50),
            ('B区地下停车场', 45),
            ('C区地面停车场', 30),
            ('D区地面停车场', 25)
        ]
        
        for area_name, space_count in areas:
            for i in range(1, space_count + 1):
                # 车位号格式：区域前缀-编号 (如：A-001, B-023)
                space_number = f'{area_name[0]}-{i:03d}'
                
                parking_space = ParkingSpace.objects.create(
                    area_name=area_name,
                    space_number=space_number,
                    parking_type=random.choice(['owned', 'rented']),
                    status=random.choice([1, 2, 3])  # 随机状态
                )
                parking_spaces.append(parking_space)
        
        return parking_spaces

    def _create_house_bindings(self, houses, users, bind_ratio=0.6):
        """生成房屋绑定关系"""
        bindings = []
        
        # 随机选择一部分房屋进行绑定
        houses_to_bind = random.sample(houses, int(len(houses) * bind_ratio))
        available_users = users.copy()
        
        for house in houses_to_bind:
            if not available_users:
                break
                
            user = random.choice(available_users)
            # 避免同一用户绑定多个房屋（模拟真实情况）
            if random.random() > 0.1:  # 90%概率移除用户，避免重复绑定
                available_users.remove(user)
            
            # 创建房屋绑定申请
            application = HouseBindingApplication.objects.create(
                user=user,
                applicant_name=user.real_name or fake.name(),
                applicant_phone=user.phone or fake.phone_number(),
                id_card_number=fake.ssn(),
                building_name=house.building.name,
                unit_name=house.unit,
                room_number=house.room_number,
                identity=random.choice([1, 2, 3]),  # 业主、家庭成员、租客
                status=1,  # 已通过
                audit_time=timezone.now(),
                auditor_id=users[0].id  # 使用第一个用户（管理员）作为审核员
            )
            
            # 创建正式绑定关系
            binding = HouseUserBinding.objects.create(
                user=user,
                house=house,
                application=application,
                identity=application.identity,
                status=1  # 已绑定
            )
            bindings.append(binding)
            
            # 更新房屋状态
            house.status = random.choice([1, 2])  # 自住或出租
            house.save()
        
        return bindings

    def _create_parking_bindings(self, parking_spaces, users, bind_ratio=0.7):
        """生成车位绑定关系"""
        bindings = []
        
        # 随机选择一部分车位进行绑定
        spaces_to_bind = random.sample(parking_spaces, int(len(parking_spaces) * bind_ratio))
        available_users = [u for u in users if u.role == 0]  # 只有普通居民可以绑定车位
        
        # 车品牌和颜色选择
        car_brands = [
            '大众', '丰田', '本田', '奔驰', '宝马', '奥迪', '福特', '现代',
            '起亚', '雪佛兰', '日产', '马自达', '别克', '吉利', '比亚迪', '长城'
        ]
        car_colors = ['白色', '黑色', '银色', '红色', '蓝色', '灰色', '金色', '绿色']
        
        for space in spaces_to_bind:
            if not available_users:
                break
                
            user = random.choice(available_users)
            
            # 生成车牌号（模拟格式：京A12345）
            provinces = ['京', '沪', '津', '渝', '冀', '豫', '云', '辽', '黑', '湘', '皖', '鲁', '新', '苏', '浙', '赣', '鄂', '桂', '甘', '晋', '蒙', '陕', '吉', '闽', '贵', '粤', '青', '藏', '川', '宁', '琼']
            letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
            numbers = ''.join([str(random.randint(0, 9)) for _ in range(5)])
            car_no = f'{random.choice(provinces)}{random.choice(letters)}{numbers}'
            
            # 创建车位绑定申请
            application = ParkingBindingApplication.objects.create(
                user=user,
                owner_name=user.real_name or fake.name(),
                owner_phone=user.phone or fake.phone_number(),
                id_card=fake.ssn(),
                parking_type=space.parking_type,
                parking_area=space.area_name,
                parking_no=space.space_number,
                car_no=car_no,
                car_brand=random.choice(car_brands),
                car_color=random.choice(car_colors),
                status=1,  # 已通过
                audit_time=timezone.now(),
                auditor_id=users[0].id  # 使用第一个用户（管理员）作为审核员
            )
            
            # 创建正式绑定关系
            binding = ParkingUserBinding.objects.create(
                user=user,
                parking_space=space,
                application=application,
                status=1  # 已绑定
            )
            bindings.append(binding)
            
            # 更新车位状态
            space.status = 1  # 已占用
            space.save()
            
            # 减少用户重复绑定的几率
            if random.random() > 0.2:  # 80%概率移除用户
                available_users.remove(user)
        
        return bindings

    def _print_summary(self):
        """打印数据统计摘要"""
        summary = f"""
📊 数据统计摘要：
{'='*40}
🏢 楼栋总数：{Building.objects.count()}
🏠 房屋总数：{House.objects.count()}
   ├─ 已绑定：{House.objects.filter(user_bindings__status=1).count()}
   └─ 空闲可用：{House.objects.exclude(user_bindings__status=1).count()}

🚗 车位总数：{ParkingSpace.objects.count()}
   ├─ 已绑定：{ParkingSpace.objects.filter(user_bindings__status=1).count()}
   └─ 空闲可用：{ParkingSpace.objects.exclude(user_bindings__status=1).count()}

👥 用户总数：{User.objects.count()}
   ├─ 管理员：{User.objects.filter(role=3).count()}
   ├─ 物业人员：{User.objects.filter(role=1).count()}
   └─ 普通居民：{User.objects.filter(role=0).count()}

🔗 绑定关系：
   ├─ 房屋绑定：{HouseUserBinding.objects.filter(status=1).count()}
   └─ 车位绑定：{ParkingUserBinding.objects.filter(status=1).count()}

💡 提示：
   - 可以使用空闲的房屋和车位来测试绑定申请功能
   - 管理员账号：admin1, admin2, admin3 (密码: 123456)
   - 所有用户默认密码：123456
        """
        self.stdout.write(self.style.SUCCESS(summary))