from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from faker import Faker
import random
from decimal import Decimal
from datetime import datetime, timedelta

from users.models import User
from property.models import (
    Building, House, HouseUserBinding,
    RepairOrder, RepairOrderImage, RepairEmployee,
    Announcement
)

fake = Faker('zh_CN')  # 使用中文生成器


class Command(BaseCommand):
    help = '初始化测试数据 - 生成员工、工单、公告等运营数据'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='清空现有数据后重新生成',
        )
        parser.add_argument(
            '--employees',
            type=int,
            default=10,
            help='生成的维修员工数量 (默认: 10)',
        )
        parser.add_argument(
            '--repair-orders',
            type=int,
            default=50,
            help='生成的报修工单数量 (默认: 50)',
        )
        parser.add_argument(
            '--announcements',
            type=int,
            default=20,
            help='生成的公告数量 (默认: 20)',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write(self.style.WARNING('正在清空运营数据...'))
            self._clear_data()
        
        self.stdout.write(self.style.SUCCESS('开始生成运营数据...'))
        
        with transaction.atomic():
            # 1. 生成维修员工数据
            employees = self._create_repair_employees(options['employees'])
            self.stdout.write(self.style.SUCCESS(f'✓ 生成了 {len(employees)} 个维修员工'))
            
            # 2. 生成报修工单数据
            repair_orders = self._create_repair_orders(options['repair_orders'], employees)
            self.stdout.write(self.style.SUCCESS(f'✓ 生成了 {len(repair_orders)} 个报修工单'))
            
            # 3. 生成公告数据
            announcements = self._create_announcements(options['announcements'])
            self.stdout.write(self.style.SUCCESS(f'✓ 生成了 {len(announcements)} 个公告'))
        
        self.stdout.write(
            self.style.SUCCESS('\n🎉 运营数据生成完成！\n')
        )
        self._print_summary()

    def _clear_data(self):
        """清空现有运营数据"""
        models_to_clear = [
            RepairOrderImage, RepairOrder, RepairEmployee, Announcement
        ]
        
        for model in models_to_clear:
            count = model.objects.count()
            if count > 0:
                model.objects.all().delete()
                self.stdout.write(f'  清空了 {model._meta.verbose_name}: {count} 条记录')

    def _create_repair_employees(self, count):
        """生成维修员工数据"""
        employees = []
        
        # 维修专业领域
        specialities = [
            '水电维修', '电气维修', '门窗维修', '空调维修', 
            '管道维修', '电梯维修', '消防设备维修', '园林绿化',
            '清洁保洁', '综合维修'
        ]
        
        # 常见姓氏
        surnames = ['张', '王', '李', '赵', '刘', '陈', '杨', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡', '郭', '何', '高', '林', '罗']
        
        for i in range(count):
            # 生成师傅名字
            surname = random.choice(surnames)
            name = f'{surname}师傅'
            if i < 3:
                name = f'{surname}师傅{i+1}'  # 前三个加编号避免重名
            
            # 随机选择专业
            speciality = random.choice(specialities)
            
            # 生成工作经验相关的统计数据
            total_orders = random.randint(20, 500)
            completed_orders = int(total_orders * random.uniform(0.85, 0.98))  # 85%-98%完成率
            average_rating = round(random.uniform(4.2, 5.0), 2)  # 4.2-5.0分
            
            employee = RepairEmployee.objects.create(
                name=name,
                phone=f'1{random.choice([3,5,7,8,9])}{random.randint(10000000, 99999999)}',
                speciality=speciality,
                is_active=True,
                total_orders=total_orders,
                completed_orders=completed_orders,
                average_rating=average_rating
            )
            employees.append(employee)
        
        return employees

    def _create_repair_orders(self, count, employees):
        """生成报修工单数据"""
        repair_orders = []
        
        # 获取现有用户和房屋数据
        users_with_houses = User.objects.filter(
            house_bindings__status=1
        ).distinct()
        
        if not users_with_houses.exists():
            self.stdout.write(
                self.style.WARNING('警告: 没有找到已绑定房屋的用户，请先运行 init_data_01')
            )
            return repair_orders
        
        # 报修类型和对应的问题描述
        repair_types = {
            'water': {
                'name': '水电',
                'problems': [
                    '水龙头漏水', '马桶堵塞', '水管爆裂', '热水器不工作', 
                    '下水道堵塞', '水压不足', '水表故障', '地漏反味'
                ]
            },
            'electric': {
                'name': '电气',
                'problems': [
                    '插座没电', '灯泡不亮', '开关失灵', '漏电跳闸',
                    '电线老化', '电表故障', '电路短路', '空气开关故障'
                ]
            },
            'door': {
                'name': '门窗',
                'problems': [
                    '门锁坏了', '窗户关不严', '门框变形', '玻璃破裂',
                    '门把手松动', '窗帘杆掉落', '纱窗破损', '门缝过大'
                ]
            },
            'public': {
                'name': '公区',
                'problems': [
                    '楼道灯不亮', '电梯故障', '楼梯扶手松动', '消防器材损坏',
                    '垃圾桶满溢', '绿化带杂草', '公共厕所堵塞', '监控摄像头故障'
                ]
            },
            'other': {
                'name': '其他',
                'problems': [
                    '空调不制冷', '暖气不热', '油烟机不工作', '洗衣机故障',
                    '冰箱异响', '燃气灶打不着火', '抽油烟机噪音大', '净水器漏水'
                ]
            }
        }
        
        # 工单状态分布 (模拟真实情况)
        status_weights = [
            ('pending', 0.15),     # 15% 待受理
            ('processing', 0.25),  # 25% 处理中  
            ('completed', 0.55),   # 55% 已完成
            ('rejected', 0.05)     # 5% 已驳回
        ]
        
        for i in range(count):
            # 随机选择用户和其房屋
            user = random.choice(users_with_houses)
            user_houses = user.house_bindings.filter(status=1)
            house_binding = random.choice(user_houses)
            house_info = house_binding.house
            
            # 生成报修位置
            location = f'{house_info.building.name}{house_info.unit}{house_info.room_number}'
            if random.choice([True, False]):
                # 50%几率添加具体房间
                rooms = ['客厅', '卧室', '厨房', '卫生间', '阳台', '书房']
                location += random.choice(rooms)
            
            # 随机选择报修类型和问题
            repair_type = random.choice(list(repair_types.keys()))
            type_info = repair_types[repair_type]
            problem = random.choice(type_info['problems'])
            
            # 生成报修时间 (过去30天内)
            created_time = timezone.now() - timedelta(
                days=random.randint(0, 30),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )
            
            # 根据权重随机选择状态
            status = random.choices(
                [s[0] for s in status_weights],
                weights=[s[1] for s in status_weights]
            )[0]
            
            # 创建工单
            order = RepairOrder.objects.create(
                category=random.choice(['public', 'household']),
                repair_type=repair_type,
                priority=random.choices(
                    ['low', 'medium', 'high'],
                    weights=[0.6, 0.3, 0.1]  # 60%一般, 30%紧急, 10%非常紧急
                )[0],
                summary=problem,
                description=self._generate_problem_description(problem),
                location=location,
                reporter=user,
                reporter_name=house_binding.application.applicant_name,
                reporter_phone=house_binding.application.applicant_phone,
                status=status,
                created_at=created_time,
                updated_at=created_time
            )
            
            # 根据状态设置额外信息
            if status in ['processing', 'completed']:
                # 已派单，选择维修员工
                employee = random.choice(employees)
                order.assignee = employee.name
                order.assigned_at = created_time + timedelta(
                    hours=random.randint(1, 24)
                )
                order.updated_at = order.assigned_at
                
                if status == 'completed':
                    # 已完成，设置完成信息
                    order.completed_at = order.assigned_at + timedelta(
                        hours=random.randint(1, 48)
                    )
                    order.result = self._generate_completion_result(problem)
                    order.cost = self._generate_repair_cost(repair_type)
                    order.updated_at = order.completed_at
                    
                    # 50%几率有用户评价
                    if random.choice([True, False]):
                        order.is_rated = True
                        order.rating = random.choices(
                            [5, 4, 3, 2, 1],
                            weights=[0.6, 0.25, 0.1, 0.04, 0.01]  # 大部分好评
                        )[0]
                        order.rating_comment = self._generate_rating_comment(order.rating)
                        order.rated_at = order.completed_at + timedelta(
                            hours=random.randint(1, 72)
                        )
            
            order.save()
            repair_orders.append(order)
            
            # 10%几率添加图片
            if random.random() < 0.1:
                self._add_repair_images(order)
        
        return repair_orders

    def _generate_problem_description(self, problem):
        """生成问题详细描述"""
        descriptions = {
            '水龙头漏水': [
                '厨房水龙头一直滴水，已经持续好几天了，水费都多了不少',
                '卫生间洗手盆的水龙头关不严，一直有水流出来',
                '阳台的水龙头接口处漏水，地面都湿了'
            ],
            '马桶堵塞': [
                '马桶堵了，用了疏通剂也没有效果，水都溢出来了',
                '厕所马桶冲不下去，水位很高，急需处理',
                '主卫马桶堵塞严重，已经无法正常使用'
            ],
            '插座没电': [
                '客厅的插座突然没电了，其他房间都正常',
                '卧室床头的插座不能用，手机都没法充电',
                '厨房插座跳闸后就没电了，冰箱都断电了'
            ],
            '门锁坏了': [
                '防盗门锁芯转不动了，钥匙都插不进去',
                '卧室门把手掉了，门关不上也打不开',
                '入户门锁机械故障，需要专业维修'
            ]
        }
        
        if problem in descriptions:
            return random.choice(descriptions[problem])
        else:
            return f'{problem}，请师傅尽快来看看，谢谢！'

    def _generate_completion_result(self, problem):
        """生成维修完成结果"""
        results = {
            '水龙头漏水': [
                '已更换水龙头密封圈，测试无漏水现象',
                '维修水龙头阀芯，现已正常使用',
                '更换整个水龙头，质保一年'
            ],
            '马桶堵塞': [
                '使用专业疏通工具清理，马桶已正常使用',
                '清理马桶内异物，建议住户注意使用',
                '疏通下水管道，马桶冲水正常'
            ],
            '插座没电': [
                '检查线路，已修复短路问题，插座恢复供电',
                '更换损坏的空气开关，电路正常',
                '重新连接电线，插座已可正常使用'
            ],
            '门锁坏了': [
                '更换门锁锁芯，配了新钥匙',
                '维修门把手机械结构，功能恢复正常',
                '调整门锁位置，开关顺畅'
            ]
        }
        
        if problem in results:
            return random.choice(results[problem])
        else:
            return f'已完成{problem}维修，经测试功能正常，请住户验收。'

    def _generate_repair_cost(self, repair_type):
        """生成维修费用"""
        cost_ranges = {
            'water': (20, 150),    # 水电维修 20-150元
            'electric': (30, 200), # 电气维修 30-200元
            'door': (50, 300),     # 门窗维修 50-300元
            'public': (0, 100),    # 公区维修 免费-100元
            'other': (40, 250)     # 其他维修 40-250元
        }
        
        min_cost, max_cost = cost_ranges.get(repair_type, (20, 100))
        return Decimal(str(random.randint(min_cost, max_cost)))

    def _generate_rating_comment(self, rating):
        """生成用户评价内容"""
        comments = {
            5: [
                '师傅很专业，维修及时，服务态度好！',
                '问题解决得很彻底，师傅人很nice，五星好评！',
                '响应速度快，维修质量高，非常满意！',
                '师傅技术过硬，人也很友善，点赞！'
            ],
            4: [
                '维修质量不错，师傅比较专业',
                '问题得到解决，整体满意',
                '服务及时，师傅态度好',
                '维修效果良好，值得推荐'
            ],
            3: [
                '基本解决了问题，还算满意',
                '师傅很努力，效果一般',
                '维修及时，质量还行'
            ],
            2: [
                '问题暂时解决了，但不够彻底',
                '师傅态度还行，技术一般'
            ],
            1: [
                '维修效果不理想，还需要再来',
                '问题没有彻底解决'
            ]
        }
        
        return random.choice(comments.get(rating, ['一般般']))

    def _add_repair_images(self, order):
        """为工单添加图片"""
        # 模拟图片URL
        image_urls = [
            '/uploads/repair/problem_001.jpg',
            '/uploads/repair/problem_002.jpg', 
            '/uploads/repair/problem_003.jpg',
            '/uploads/repair/after_repair_001.jpg',
            '/uploads/repair/after_repair_002.jpg'
        ]
        
        num_images = random.randint(1, 3)
        for i in range(num_images):
            RepairOrderImage.objects.create(
                order=order,
                image=random.choice(image_urls),
                image_type='image'
            )

    def _create_announcements(self, count):
        """生成公告数据"""
        announcements = []
        
        # 获取管理员用户作为公告发布者
        admin_users = User.objects.filter(role=3)
        if not admin_users.exists():
            self.stdout.write(
                self.style.WARNING('警告: 没有找到管理员用户，请先运行 init_data_01')
            )
            return announcements
        
        # 公告类型和标题模板
        announcement_templates = {
            'property_notice': {
                'titles': [
                    '关于{}期间停水通知',
                    '{}物业费缴费通知', 
                    '{}期间电梯维保通知',
                    '{}垃圾分类管理通知',
                    '关于加强{}安全管理的通知',
                    '{}消防设施检查通知'
                ],
                'contents': [
                    '尊敬的业主：\n\n根据市政管网维修需要，我小区将于{}进行停水作业。停水时间：上午9:00-下午17:00。请各位业主提前做好储水准备，由此给您带来的不便敬请谅解。\n\n如有疑问请联系物业服务中心：400-123-4567\n\n物业服务中心\n{}',
                    '各位业主：\n\n{}年度物业管理费开始缴费，请各位业主及时缴纳。缴费方式：\n1. 到物业服务中心现金缴费\n2. 微信小程序在线缴费\n3. 银行转账缴费\n\n逾期未缴费将产生滞纳金，请各位业主理解配合。\n\n物业服务中心\n{}'
                ]
            },
            'community_news': {
                'titles': [
                    '{}社区文艺演出活动圆满举办',
                    '我社区荣获"{}"称号',
                    '{}社区志愿者服务活动报道',
                    '{}业主子女考上重点大学喜报',
                    '社区{}活动精彩回顾'
                ],
                'contents': [
                    '{}，我社区在{}举办了精彩的文艺演出活动。本次活动得到了广大业主的热烈响应，现场气氛热烈，节目精彩纷呈。\n\n此次活动不仅丰富了业主的业余文化生活，也增进了邻里之间的友谊。希望今后有更多的业主参与到社区活动中来。',
                    '近日，我社区凭借优秀的管理水平和服务质量，荣获"{}"荣誉称号。这是对我们工作的肯定，也是对全体业主支持的感谢。\n\n我们将继续努力，为业主提供更优质的服务。'
                ]
            },
            'warm_tips': {
                'titles': [
                    '{}安全提示',
                    '{}温馨提醒',
                    '关于{}的友情提示',
                    '{}生活小贴士',
                    '{}注意事项提醒'
                ],
                'contents': [
                    '亲爱的业主们：\n\n{}即将到来，为了大家的安全，特别提醒：\n\n1. 注意用电安全，及时检查电器设备\n2. 外出时请锁好门窗，贵重物品妥善保管\n3. 遵守小区管理规定，配合安保工作\n\n祝大家生活愉快！\n\n物业服务中心',
                    '温馨提示：\n\n{}期间，请各位业主注意以下事项：\n\n• 保持楼道整洁，不要堆放杂物\n• 规范停车，不占用消防通道\n• 控制噪音，避免影响邻居休息\n• 爱护公共设施，共同维护社区环境\n\n感谢大家的理解与配合！'
                ]
            }
        }
        
        # 获取楼栋信息用于范围设置
        buildings = Building.objects.all()
        building_names = [b.name for b in buildings]
        
        for i in range(count):
            # 随机选择公告类型
            category = random.choice(list(announcement_templates.keys()))
            templates = announcement_templates[category]
            
            # 生成公告标题和内容
            title_template = random.choice(templates['titles'])
            content_template = random.choice(templates['contents'])
            
            # 填充模板变量
            time_words = ['春节', '国庆', '夏季', '冬季', '周末', '工作日']
            seasons = ['春季', '夏季', '秋季', '冬季']
            current_year = datetime.now().year
            
            title = title_template.format(random.choice(time_words + seasons))
            content = content_template.format(
                random.choice(time_words),
                datetime.now().strftime('%Y年%m月%d日'),
                current_year,
                datetime.now().strftime('%Y年%m月%d日')
            )
            
            # 生成发布时间 (过去60天内)
            created_time = timezone.now() - timedelta(
                days=random.randint(0, 60),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )
            
            # 随机选择发布状态和范围
            status = random.choices(
                ['published', 'draft', 'withdrawn'],
                weights=[0.8, 0.15, 0.05]  # 80%已发布, 15%草稿, 5%已撤回
            )[0]
            
            scope = random.choice(['all', 'building'])
            target_buildings = []
            if scope == 'building' and building_names:
                # 随机选择1-3个楼栋
                num_buildings = random.randint(1, min(3, len(building_names)))
                target_buildings = random.sample(building_names, num_buildings)
            
            # 选择发布者
            author = random.choice(admin_users)
            
            announcement = Announcement.objects.create(
                title=title,
                content=content,
                status=status,
                category=category,
                scope=scope,
                target_buildings=target_buildings,
                author=author,
                author_name=author.real_name or author.nickname or '系统管理员',
                created_at=created_time,
                updated_at=created_time,
                read_count=random.randint(0, 500) if status == 'published' else 0
            )
            
            # 设置发布时间
            if status == 'published':
                announcement.published_at = created_time + timedelta(
                    minutes=random.randint(1, 60)
                )
                announcement.save()
            elif status == 'withdrawn':
                announcement.published_at = created_time + timedelta(
                    hours=random.randint(1, 24)
                )
                announcement.withdrawn_at = announcement.published_at + timedelta(
                    days=random.randint(1, 30)
                )
                announcement.save()
            
            announcements.append(announcement)
        
        return announcements

    def _print_summary(self):
        """打印运营数据统计摘要"""
        summary = f"""
📊 运营数据统计摘要：
{'='*40}
👷 维修员工：{RepairEmployee.objects.count()}
   └─ 在职员工：{RepairEmployee.objects.filter(is_active=True).count()}

🔧 报修工单：{RepairOrder.objects.count()}
   ├─ 待受理：{RepairOrder.objects.filter(status='pending').count()}
   ├─ 处理中：{RepairOrder.objects.filter(status='processing').count()}
   ├─ 已完成：{RepairOrder.objects.filter(status='completed').count()}
   └─ 已驳回：{RepairOrder.objects.filter(status='rejected').count()}

📢 公告通知：{Announcement.objects.count()}
   ├─ 已发布：{Announcement.objects.filter(status='published').count()}
   ├─ 草稿：{Announcement.objects.filter(status='draft').count()}
   └─ 已撤回：{Announcement.objects.filter(status='withdrawn').count()}

📸 工单图片：{RepairOrderImage.objects.count()}

💡 提示：
   - 维修员工具有不同的专业技能和工作经验
   - 工单状态分布模拟真实使用情况
   - 公告内容丰富，涵盖各种社区通知
   - 可以在Web管理端查看和管理这些数据
        """
        self.stdout.write(self.style.SUCCESS(summary))
