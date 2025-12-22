"""
初始化门禁日志测试数据的管理命令
使用方法: python manage.py init_access_logs
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import models
from datetime import datetime, timedelta
import random
from faker import Faker

from property.models import AccessLog
from users.models import User

fake = Faker('zh_CN')  # 使用中文生成器


class Command(BaseCommand):
    help = '初始化门禁日志测试数据'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='清除现有数据',
        )
        parser.add_argument(
            '--count',
            type=int,
            default=500,
            help='生成的门禁日志数量 (默认: 500)',
        )
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='生成过去多少天的数据 (默认: 30)',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('清除现有门禁日志数据...')
            AccessLog.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('数据清除完成'))

        count = options['count']
        days = options['days']

        self.stdout.write(f'开始生成 {count} 条门禁日志数据（过去 {days} 天）...')

        # 获取现有用户作为数据源
        users = User.objects.all()
        user_names = [user.real_name or user.nickname or f"用户{user.id}" for user in users]

        # 如果没有用户，使用一些默认姓名
        if not user_names:
            user_names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十']

        # 人员姓名池（包含业主、访客、配送员等）
        person_names = user_names + [
            '外卖员', '快递员', '访客A', '访客B', '访客C', '访客D', '访客E',
            '配送员小王', '配送员小李', '维修师傅', '保洁阿姨', '保安小张',
            '物业人员', '水电商', '装修师傅', '搬家工人', '燃气安检员'
        ]

        # 开门方式选项
        methods = [choice[0] for choice in AccessLog.METHOD_CHOICES]

        # 位置选项
        locations = [
            '1栋东门', '1栋西门', '2栋东门', '2栋西门', '3栋东门', '3栋西门',
            '南大门', '北大门', '东门', '西门', '地下车库入口', '小区后门',
            '会所入口', '花园小门', '儿童乐园门', '健身中心门', '游泳池入口'
        ]

        # 人员类型选项
        person_types = [choice[0] for choice in AccessLog._meta.get_field('person_type').choices]

        # 生成数据
        logs_to_create = []
        end_time = timezone.now()
        start_time = end_time - timedelta(days=days)

        for i in range(count):
            # 随机生成时间（在过去30天内，主要集中在早7-9点和晚6-8点）
            random_days_ago = random.randint(0, days)
            random_date = start_time + timedelta(days=random_days_ago)

            # 高峰时段权重
            hour_weights = {
                7: 15, 8: 20, 9: 15,  # 早高峰
                10: 5, 11: 8, 12: 10,  # 上午
                13: 8, 14: 5, 15: 5,   # 下午
                16: 8, 17: 15, 18: 20, 19: 15,  # 晚高峰
                20: 8, 21: 5, 22: 3,    # 夜间
                23: 2, 0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 2  # 深夜
            }

            # 根据权重选择小时
            hours = list(hour_weights.keys())
            weights = list(hour_weights.values())
            hour = random.choices(hours, weights=weights)[0]

            # 随机分钟和秒
            minute = random.randint(0, 59)
            second = random.randint(0, 59)

            timestamp = random_date.replace(hour=hour, minute=minute, second=second)

            # 随机选择人员（70%是小区居民，30%是其他人）
            if random.random() < 0.7:
                person_name = random.choice(user_names)
                person_type = 'resident'
            else:
                person_name = random.choice(person_names)
                person_type = random.choice(person_types)

            # 随机选择开门方式
            method = random.choice(methods)

            # 随机选择位置
            location = random.choice(locations)

            # 随机选择进出方向
            direction = random.choice(['in', 'out'])

            # 生成设备ID
            device_id = f"device_{random.randint(1, 20):02d}"

            # 大部分记录是成功的
            success = random.random() < 0.95  # 95%成功率

            access_log = AccessLog(
                person_name=person_name,
                method=method,
                direction=direction,
                location=location,
                person_type=person_type,
                timestamp=timestamp,
                device_id=device_id,
                success=success
            )
            logs_to_create.append(access_log)

        # 批量创建
        AccessLog.objects.bulk_create(logs_to_create)

        # 统计信息
        total_count = AccessLog.objects.count()
        today_count = AccessLog.objects.filter(
            timestamp__date=timezone.now().date()
        ).count()

        # 按开门方式统计
        method_stats = AccessLog.objects.values('method').annotate(
            count=models.Count('id')
        ).order_by('-count')

        self.stdout.write(f'\n=== 门禁日志统计 ===')
        self.stdout.write(f'  总记录数: {total_count}')
        self.stdout.write(f'  今日记录数: {today_count}')
        self.stdout.write(f'  本次生成: {count}')

        self.stdout.write(f'\n=== 按开门方式分布 ===')
        method_names = {
            'face': '人脸识别',
            'qrcode': '二维码',
            'card': '刷卡',
            'password': '密码'
        }
        for stat in method_stats:
            method_name = method_names.get(stat['method'], stat['method'])
            self.stdout.write(f'  {method_name}: {stat["count"]} 条')

        self.stdout.write(self.style.SUCCESS('\n门禁日志测试数据生成完成！'))