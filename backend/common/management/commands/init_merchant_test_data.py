"""
初始化商户测试数据的管理命令
使用方法: python manage.py init_merchant_test_data --clear
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from django.contrib.auth import get_user_model
from datetime import datetime, timedelta
import random

from merchant.models import MerchantProfile, MerchantCoupon

User = get_user_model()


class Command(BaseCommand):
    help = '初始化商户测试数据'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='清除现有商户测试数据',
        )
        parser.add_argument(
            '--username',
            type=str,
            default='1111',
            help='商户用户名'
        )

    def handle(self, *args, **options):
        username = options['username']

        if options['clear']:
            self.stdout.write('清除现有商户测试数据...')
            # 清除商户相关的数据
            try:
                user = User.objects.get(username=username)
                merchant_profile = MerchantProfile.objects.get(user=user)

                # 清除优惠券
                MerchantCoupon.objects.filter(merchant=merchant_profile).delete()

                # 清除商品（这里需要导入MerchantProduct）
                try:
                    from merchant.models import MerchantProduct
                    MerchantProduct.objects.filter(merchant=merchant_profile).delete()
                except:
                    pass

                # 清除订单（这里需要导入MerchantOrder和UserCoupon）
                try:
                    from merchant.models import MerchantOrder, UserCoupon
                    UserCoupon.objects.filter(coupon__merchant=merchant_profile).delete()
                    MerchantOrder.objects.filter(merchant=merchant_profile).delete()
                except:
                    pass

                self.stdout.write(self.style.SUCCESS('数据清除完成'))
            except User.DoesNotExist:
                pass
            except MerchantProfile.DoesNotExist:
                pass

        self.stdout.write(f'开始为商户 {username} 创建测试数据...')

        try:
            # 获取商户用户和档案
            user = User.objects.get(username=username)
            merchant_profile = MerchantProfile.objects.get(user=user)

            self.stdout.write(f'找到商户: {merchant_profile.shop_name}')

            # 创建商品数据
            self.create_products(merchant_profile)

            # 创建优惠券数据（不创建用户优惠券）
            self.create_coupons(merchant_profile)

            self.stdout.write(self.style.SUCCESS('\n商户测试数据创建完成！'))

        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'用户 {username} 不存在'))
        except MerchantProfile.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'用户 {username} 没有商户档案'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'创建测试数据失败: {str(e)}'))

    def create_products(self, merchant_profile):
        """创建商品数据"""
        self.stdout.write('创建商品数据...')

        try:
            from merchant.models import MerchantProduct

            products_data = [
                {
                    'name': '招牌奶茶',
                    'description': '新鲜牛奶配制，口感香醇',
                    'category': '饮品',
                    'price': 15.00,
                    'original_price': 18.00,
                    'stock': 100,
                    'status': 'online'
                },
                {
                    'name': '水果捞',
                    'description': '多种新鲜水果搭配酸奶',
                    'category': '甜品',
                    'price': 25.00,
                    'original_price': 30.00,
                    'stock': 50,
                    'status': 'online'
                }
            ]

            for product_data in products_data:
                product, created = MerchantProduct.objects.get_or_create(
                    merchant=merchant_profile,
                    name=product_data['name'],
                    defaults={
                        'description': product_data['description'],
                        'category': product_data['category'],
                        'price': product_data['price'],
                        'original_price': product_data.get('original_price'),
                        'stock': product_data['stock'],
                        'status': product_data['status']
                    }
                )
                if created:
                    self.stdout.write(f'  创建商品: {product.name}')
                else:
                    # 更新现有商品
                    product.description = product_data['description']
                    product.category = product_data['category']
                    product.price = product_data['price']
                    product.original_price = product_data.get('original_price')
                    product.stock = product_data['stock']
                    product.status = product_data['status']
                    product.save()
                    self.stdout.write(f'  更新商品: {product.name}')

        except ImportError:
            self.stdout.write('  警告: MerchantProduct 模型不存在，跳过商品创建')

    def create_coupons(self, merchant_profile):
        """创建优惠券数据（只创建商户优惠券，不创建用户优惠券）"""
        self.stdout.write('创建优惠券数据...')

        # 创建商户优惠券 - 只创建一张20-10的优惠券
        coupon_data = {
            'name': '满20减10元',
            'description': '满20元可使用，限本店使用',
            'coupon_type': 'deduction',
            'amount': 10.00,
            'min_amount': 20.00,
            'total_count': 100,
            'per_user_limit': 1
        }

        coupon, created = MerchantCoupon.objects.get_or_create(
            merchant=merchant_profile,
            name=coupon_data['name'],
            defaults={
                'description': coupon_data['description'],
                'coupon_type': coupon_data['coupon_type'],
                'amount': coupon_data['amount'],
                'min_amount': coupon_data['min_amount'],
                'total_count': coupon_data['total_count'],
                'per_user_limit': coupon_data['per_user_limit'],
                'start_date': timezone.now(),
                'end_date': timezone.now() + timedelta(days=90)
            }
        )

        if created:
            self.stdout.write(f'  创建优惠券: {coupon.name}')
        else:
            # 更新现有优惠券
            coupon.description = coupon_data['description']
            coupon.coupon_type = coupon_data['coupon_type']
            coupon.amount = coupon_data['amount']
            coupon.min_amount = coupon_data['min_amount']
            coupon.total_count = coupon_data['total_count']
            coupon.per_user_limit = coupon_data['per_user_limit']
            coupon.start_date = timezone.now()
            coupon.end_date = timezone.now() + timedelta(days=90)
            coupon.save()
            self.stdout.write(f'  更新优惠券: {coupon.name}')

        self.stdout.write('  注意: 用户需要手动领取优惠券，不自动创建用户优惠券')