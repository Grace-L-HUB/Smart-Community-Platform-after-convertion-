from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import transaction, models
from datetime import timedelta
from .models import (
    MerchantApplication, MerchantProfile, MerchantProduct,
    MerchantOrder, MerchantOrderItem, MerchantCoupon, UserCoupon
)
from .serializers import (
    MerchantApplicationSerializer, MerchantApplicationCreateSerializer,
    MerchantApplicationReviewSerializer, MerchantProfileSerializer,
    MerchantProfileUpdateSerializer, MerchantProductSerializer,
    MerchantProductCreateUpdateSerializer, MerchantOrderSerializer,
    MerchantCouponSerializer, UserCouponSerializer, CouponReceiveSerializer,
    CouponVerifySerializer, OrderStatusUpdateSerializer, PickupCodeVerifySerializer,
    OrderCreateSerializer, LogoUploadSerializer
)
import logging
from django.contrib.auth.hashers import make_password

logger = logging.getLogger(__name__)
User = get_user_model()


class MerchantApplicationView(APIView):
    """商户申请接口"""
    
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get(self, request):
        """获取当前用户的申请记录"""
        try:
            applications = MerchantApplication.objects.filter(user=request.user)
            serializer = MerchantApplicationSerializer(applications, many=True)
            
            return Response({
                'success': True,
                'data': serializer.data
            })
        except Exception as e:
            logger.error(f"获取商户申请失败: {str(e)}")
            return Response({
                'success': False,
                'message': '获取申请记录失败'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request):
        """提交商户申请"""
        try:
            serializer = MerchantApplicationCreateSerializer(
                data=request.data, 
                context={'request': request}
            )
            
            if serializer.is_valid():
                application = serializer.save()
                
                return Response({
                    'success': True,
                    'message': '申请提交成功，请等待审核',
                    'data': MerchantApplicationSerializer(application).data
                }, status=status.HTTP_201_CREATED)
            
            return Response({
                'success': False,
                'message': '数据验证失败',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"提交商户申请失败: {str(e)}")
            return Response({
                'success': False,
                'message': '提交申请失败，请重试'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MerchantApplicationListView(APIView):
    """商户申请列表（物业端）"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """获取所有申请列表"""
        try:
            # 检查权限：只有物业人员或管理员可以查看
            if request.user.role not in [1, 3]:  # 物业人员或管理员
                return Response({
                    'success': False,
                    'message': '权限不足'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # 获取查询参数
            status_filter = request.GET.get('status', '')
            page = int(request.GET.get('page', 1))
            page_size = int(request.GET.get('page_size', 10))
            
            # 构建查询
            queryset = MerchantApplication.objects.all()
            if status_filter:
                queryset = queryset.filter(status=status_filter)
            
            # 分页
            start = (page - 1) * page_size
            end = start + page_size
            applications = queryset[start:end]
            total = queryset.count()
            
            serializer = MerchantApplicationSerializer(applications, many=True)
            
            return Response({
                'success': True,
                'data': {
                    'items': serializer.data,
                    'total': total,
                    'page': page,
                    'page_size': page_size,
                    'total_pages': (total + page_size - 1) // page_size
                }
            })
            
        except Exception as e:
            logger.error(f"获取商户申请列表失败: {str(e)}")
            return Response({
                'success': False,
                'message': '获取申请列表失败'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MerchantApplicationReviewView(APIView):
    """商户申请审核接口"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, application_id):
        """审核商户申请"""
        try:
            # 检查权限：只有物业人员或管理员可以审核
            if request.user.role not in [1, 3]:  # 物业人员或管理员
                return Response({
                    'success': False,
                    'message': '权限不足'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # 获取申请记录
            try:
                application = MerchantApplication.objects.get(id=application_id)
            except MerchantApplication.DoesNotExist:
                return Response({
                    'success': False,
                    'message': '申请记录不存在'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # 检查申请状态
            if application.status != 'pending':
                return Response({
                    'success': False,
                    'message': '该申请已被处理'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 验证审核数据
            serializer = MerchantApplicationReviewSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    'success': False,
                    'message': '数据验证失败',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            review_status = serializer.validated_data['status']
            review_comment = serializer.validated_data.get('review_comment', '')
            
            with transaction.atomic():
                if review_status == 'approved':
                    # 审核通过
                    application.approve(request.user, review_comment)
                    
                    # 创建商户档案
                    merchant_profile = MerchantProfile.objects.create(
                        user=application.user,
                        application=application,
                        shop_name=application.shop_name,
                        shop_category=application.shop_category,
                        shop_phone=application.shop_phone,
                        shop_address=application.shop_address,
                        shop_description=application.shop_description,
                        business_hours_start=application.business_hours_start,
                        business_hours_end=application.business_hours_end,
                    )
                    
                    message = f'商户 {application.shop_name} 审核通过'
                    
                else:
                    # 审核拒绝
                    application.reject(request.user, review_comment)
                    message = f'商户 {application.shop_name} 审核被拒绝'
            
            return Response({
                'success': True,
                'message': message,
                'data': MerchantApplicationSerializer(application).data
            })
            
        except Exception as e:
            logger.error(f"审核商户申请失败: {str(e)}")
            return Response({
                'success': False,
                'message': '审核失败，请重试'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MerchantProfileView(APIView):
    """商户档案接口"""
    
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get(self, request):
        """获取当前商户的档案信息"""
        try:
            # 检查用户是否为商户
            if request.user.role != 2:  # 商户角色
                return Response({
                    'success': False,
                    'message': '权限不足'
                }, status=status.HTTP_403_FORBIDDEN)
            
            try:
                profile = MerchantProfile.objects.get(user=request.user)
                serializer = MerchantProfileSerializer(profile)
                
                return Response({
                    'success': True,
                    'data': serializer.data
                })
                
            except MerchantProfile.DoesNotExist:
                return Response({
                    'success': False,
                    'message': '商户档案不存在，请先完成入驻申请'
                }, status=status.HTTP_404_NOT_FOUND)
                
        except Exception as e:
            logger.error(f"获取商户档案失败: {str(e)}")
            return Response({
                'success': False,
                'message': '获取档案信息失败'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def put(self, request):
        """更新商户档案信息"""
        try:
            # 检查用户是否为商户
            if request.user.role != 2:  # 商户角色
                return Response({
                    'success': False,
                    'message': '权限不足'
                }, status=status.HTTP_403_FORBIDDEN)

            try:
                profile = MerchantProfile.objects.get(user=request.user)
            except MerchantProfile.DoesNotExist:
                return Response({
                    'success': False,
                    'message': '商户档案不存在'
                }, status=status.HTTP_404_NOT_FOUND)

            # 使用序列化器验证数据
            serializer = MerchantProfileUpdateSerializer(
                profile,
                data=request.data,
                partial=True
            )

            if serializer.is_valid():
                validated_data = serializer.validated_data

                # 手动处理 shop_logo_url 字段（类似用户头像的处理方式）
                shop_logo_url = request.data.get('shop_logo_url')
                if shop_logo_url:
                    from urllib.parse import urlparse
                    parsed_url = urlparse(shop_logo_url)
                    # 去掉开头的 /media/
                    logo_path = parsed_url.path
                    if logo_path.startswith('/media/'):
                        logo_path = logo_path[7:]  # 去掉 '/media/'
                    logger.info(f"原始URL: {shop_logo_url}")
                    logger.info(f"解析后的路径: {logo_path}")
                    profile.shop_logo = logo_path
                    # 先单独保存 shop_logo 字段
                    profile.save(update_fields=['shop_logo'])
                    logger.info(f"设置 shop_logo = {profile.shop_logo}")

                # 手动更新其他字段
                for field, value in validated_data.items():
                    if field != 'shop_logo' and hasattr(profile, field):
                        setattr(profile, field, value)

                profile.save()

                # 重新从数据库读取确认
                profile.refresh_from_db()
                logger.info(f"最终 shop_logo = {profile.shop_logo}")

                return Response({
                    'success': True,
                    'message': '档案信息更新成功',
                    'data': MerchantProfileSerializer(profile).data
                })

            return Response({
                'success': False,
                'message': '数据验证失败',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"更新商户档案失败: {str(e)}")
            return Response({
                'success': False,
                'message': '更新档案信息失败'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MerchantRegisterView(APIView):
    """商户注册接口（创建账号并提交申请）"""
    
    permission_classes = []  # 注册接口不需要认证
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        """注册新商户账号并提交申请"""
        try:
            # 获取用户注册信息
            username = request.data.get('username')
            password = request.data.get('password')
            phone = request.data.get('phone')
            
            if not all([username, password, phone]):
                return Response({
                    'success': False,
                    'message': '用户名、密码和手机号为必填项'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 检查用户名是否已存在
            if User.objects.filter(username=username).exists():
                return Response({
                    'success': False,
                    'message': '用户名已存在'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 检查手机号是否已存在
            if User.objects.filter(phone=phone).exists():
                return Response({
                    'success': False,
                    'message': '手机号已被注册'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 预先验证所有数据（在事务外部）
            application_data = {
                'shop_name': request.data.get('shop_name'),
                'shop_category': request.data.get('shop_category'),
                'shop_phone': request.data.get('shop_phone'),
                'shop_address': request.data.get('shop_address'),
                'shop_description': request.data.get('shop_description'),
                'business_hours_start': request.data.get('business_hours_start'),
                'business_hours_end': request.data.get('business_hours_end'),
                'legal_name': request.data.get('legal_name'),
                'legal_id_card': request.data.get('legal_id_card'),
                'legal_phone': request.data.get('legal_phone'),
                'business_license': request.FILES.get('business_license'),
                'identity_card_front': request.FILES.get('identity_card_front'),
                'identity_card_back': request.FILES.get('identity_card_back'),
            }
            
            # 验证必填字段
            required_fields = [
                'shop_name', 'shop_category', 'shop_phone', 'shop_address',
                'shop_description', 'business_hours_start', 'business_hours_end',
                'legal_name', 'legal_id_card', 'legal_phone'
            ]
            
            for field in required_fields:
                if not application_data[field]:
                    return Response({
                        'success': False,
                        'message': f'{field} 为必填项'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # 验证必需文件
            required_files = ['business_license', 'identity_card_front', 'identity_card_back']
            for file_field in required_files:
                if not application_data[file_field]:
                    return Response({
                        'success': False,
                        'message': f'{file_field} 为必传文件'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # 所有验证通过后，开始事务
            with transaction.atomic():
                # 创建用户账号
                user = User.objects.create(
                    username=username,
                    phone=phone,
                    password=make_password(password),
                    role=0,  # 初始为普通用户，审核通过后改为商户
                    register_type=1,  # 手机注册
                    is_verified=True,
                )
                
                # 添加用户到申请数据
                application_data['user'] = user
                
                # 创建商户申请
                application = MerchantApplication.objects.create(**application_data)
                
                return Response({
                    'success': True,
                    'message': '注册成功，申请已提交，请等待审核',
                    'data': {
                        'user_id': user.id,
                        'application_id': application.id,
                        'application': MerchantApplicationSerializer(application).data
                    }
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            logger.error(f"商户注册失败: {str(e)}")
            return Response({
                'success': False,
                'message': '注册失败，请重试'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MerchantLoginView(APIView):
    """商户登录接口"""
    
    permission_classes = []  # 登录接口不需要认证
    
    def post(self, request):
        """商户登录验证"""
        try:
            username = request.data.get('username')
            password = request.data.get('password')
            
            if not username or not password:
                return Response({
                    'success': False,
                    'message': '用户名和密码不能为空'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 验证用户名和密码
            try:
                user = User.objects.get(username=username, is_active=True)
            except User.DoesNotExist:
                return Response({
                    'success': False,
                    'message': '用户名或密码错误'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 检查密码
            from django.contrib.auth.hashers import check_password
            if not check_password(password, user.password):
                return Response({
                    'success': False,
                    'message': '用户名或密码错误'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 检查用户是否为商户
            if user.role != 2:  # 商户角色
                logger.info(f"用户 {username} 登录失败：不是商户账号，当前角色为 {user.role}")
                return Response({
                    'success': False,
                    'message': '该账号不是商户账号'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # 检查商户是否已审核通过
            try:
                merchant_profile = MerchantProfile.objects.get(user=user)
                if not merchant_profile.is_active:
                    return Response({
                        'success': False,
                        'message': '商户账号已被停用'
                    }, status=status.HTTP_403_FORBIDDEN)
            except MerchantProfile.DoesNotExist:
                # 检查是否有审核通过的申请
                approved_application = MerchantApplication.objects.filter(
                    user=user,
                    status='approved'
                ).first()
                
                if not approved_application:
                    return Response({
                        'success': False,
                        'message': '您的商户申请尚未审核通过，请等待审核或重新申请'
                    }, status=status.HTTP_403_FORBIDDEN)
                
                # 如果有审核通过的申请但没有档案，创建档案
                merchant_profile = MerchantProfile.objects.create(
                    user=user,
                    application=approved_application,
                    shop_name=approved_application.shop_name,
                    shop_category=approved_application.shop_category,
                    shop_phone=approved_application.shop_phone,
                    shop_address=approved_application.shop_address,
                    shop_description=approved_application.shop_description,
                    business_hours_start=approved_application.business_hours_start,
                    business_hours_end=approved_application.business_hours_end,
                )
            
            # 生成token
            token = f"merchant_token_{user.id}_verified"

            # 构建头像完整URL
            avatar_url = None
            if merchant_profile.shop_logo:
                avatar_url = request.build_absolute_uri(merchant_profile.shop_logo.url)

            # 返回用户信息
            return Response({
                'success': True,
                'message': '登录成功',
                'data': {
                    'token': token,
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'name': merchant_profile.shop_name,
                        'role': 'merchant',
                        'avatar': avatar_url,
                        'phone': user.phone,
                        'shop_name': merchant_profile.shop_name,
                    }
                }
            })
            
        except Exception as e:
            logger.error(f"商户登录失败: {str(e)}")
            return Response({
                'success': False,
                'message': '登录失败，请重试'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MerchantProductListView(APIView):
    """商品列表接口"""
    
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get(self, request):
        """获取商户的商品列表"""
        try:
            # 检查用户是否为商户
            if request.user.role != 2:
                return Response({
                    'success': False,
                    'message': '权限不足'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # 获取商户档案
            try:
                merchant_profile = MerchantProfile.objects.get(user=request.user)
            except MerchantProfile.DoesNotExist:
                return Response({
                    'success': False,
                    'message': '商户档案不存在'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # 获取查询参数
            category = request.GET.get('category', '')
            product_status = request.GET.get('status', '')
            keyword = request.GET.get('keyword', '')
            
            # 构建查询
            queryset = MerchantProduct.objects.filter(merchant=merchant_profile)
            
            if category:
                queryset = queryset.filter(category=category)
            if product_status:
                queryset = queryset.filter(status=product_status)
            if keyword:
                queryset = queryset.filter(name__icontains=keyword)
            
            products = queryset.order_by('-created_at')
            serializer = MerchantProductSerializer(
                products, 
                many=True,
                context={'request': request}
            )
            
            return Response({
                'success': True,
                'data': serializer.data
            })
            
        except Exception as e:
            logger.error(f"获取商品列表失败: {str(e)}")
            return Response({
                'success': False,
                'message': '获取商品列表失败'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request):
        """创建新商品"""
        try:
            # 检查用户是否为商户
            if request.user.role != 2:
                return Response({
                    'success': False,
                    'message': '权限不足'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # 获取商户档案
            try:
                merchant_profile = MerchantProfile.objects.get(user=request.user)
            except MerchantProfile.DoesNotExist:
                return Response({
                    'success': False,
                    'message': '商户档案不存在'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # 验证数据
            serializer = MerchantProductCreateUpdateSerializer(
                data=request.data,
                context={'request': request}
            )
            
            if serializer.is_valid():
                product = serializer.save(merchant=merchant_profile)
                
                return Response({
                    'success': True,
                    'message': '商品创建成功',
                    'data': MerchantProductSerializer(product, context={'request': request}).data
                }, status=status.HTTP_201_CREATED)
            
            return Response({
                'success': False,
                'message': '数据验证失败',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"创建商品失败: {str(e)}")
            return Response({
                'success': False,
                'message': '创建商品失败，请重试'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MerchantProductDetailView(APIView):
    """商品详情接口"""
    
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_object(self, request, product_id):
        """获取商品对象"""
        try:
            merchant_profile = MerchantProfile.objects.get(user=request.user)
            return MerchantProduct.objects.get(id=product_id, merchant=merchant_profile)
        except (MerchantProfile.DoesNotExist, MerchantProduct.DoesNotExist):
            return None
    
    def get(self, request, product_id):
        """获取商品详情"""
        try:
            # 检查用户是否为商户
            if request.user.role != 2:
                return Response({
                    'success': False,
                    'message': '权限不足'
                }, status=status.HTTP_403_FORBIDDEN)
            
            product = self.get_object(request, product_id)
            if not product:
                return Response({
                    'success': False,
                    'message': '商品不存在'
                }, status=status.HTTP_404_NOT_FOUND)
            
            serializer = MerchantProductSerializer(product, context={'request': request})
            return Response({
                'success': True,
                'data': serializer.data
            })
            
        except Exception as e:
            logger.error(f"获取商品详情失败: {str(e)}")
            return Response({
                'success': False,
                'message': '获取商品详情失败'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def put(self, request, product_id):
        """更新商品信息"""
        try:
            # 检查用户是否为商户
            if request.user.role != 2:
                return Response({
                    'success': False,
                    'message': '权限不足'
                }, status=status.HTTP_403_FORBIDDEN)
            
            product = self.get_object(request, product_id)
            if not product:
                return Response({
                    'success': False,
                    'message': '商品不存在'
                }, status=status.HTTP_404_NOT_FOUND)
            
            serializer = MerchantProductCreateUpdateSerializer(
                product, 
                data=request.data, 
                partial=True,
                context={'request': request}
            )
            
            if serializer.is_valid():
                product = serializer.save()
                
                return Response({
                    'success': True,
                    'message': '商品更新成功',
                    'data': MerchantProductSerializer(product, context={'request': request}).data
                })
            
            return Response({
                'success': False,
                'message': '数据验证失败',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"更新商品失败: {str(e)}")
            return Response({
                'success': False,
                'message': '更新商品失败，请重试'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def delete(self, request, product_id):
        """删除商品"""
        try:
            # 检查用户是否为商户
            if request.user.role != 2:
                return Response({
                    'success': False,
                    'message': '权限不足'
                }, status=status.HTTP_403_FORBIDDEN)
            
            product = self.get_object(request, product_id)
            if not product:
                return Response({
                    'success': False,
                    'message': '商品不存在'
                }, status=status.HTTP_404_NOT_FOUND)
            
            product_name = product.name
            product.delete()
            
            return Response({
                'success': True,
                'message': f'商品 "{product_name}" 已删除'
            })
            
        except Exception as e:
            logger.error(f"删除商品失败: {str(e)}")
            return Response({
                'success': False,
                'message': '删除商品失败，请重试'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MerchantProductStatusView(APIView):
    """商品上下架接口"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, product_id):
        """切换商品上下架状态"""
        try:
            # 检查用户是否为商户
            if request.user.role != 2:
                return Response({
                    'success': False,
                    'message': '权限不足'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # 获取商品
            try:
                merchant_profile = MerchantProfile.objects.get(user=request.user)
                product = MerchantProduct.objects.get(id=product_id, merchant=merchant_profile)
            except (MerchantProfile.DoesNotExist, MerchantProduct.DoesNotExist):
                return Response({
                    'success': False,
                    'message': '商品不存在'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # 切换状态
            old_status = product.status
            product.toggle_status()
            
            status_text = '上架' if product.status == 'online' else '下架'
            
            return Response({
                'success': True,
                'message': f'商品已{status_text}',
                'data': {
                    'id': product.id,
                    'status': product.status,
                    'status_display': product.get_status_display()
                }
            })
            
        except Exception as e:
            logger.error(f"切换商品状态失败: {str(e)}")
            return Response({
                'success': False,
                'message': '操作失败，请重试'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PublicMerchantListView(APIView):
    """公开的商户列表接口（供小程序使用）"""
    
    permission_classes = []  # 不需要登录
    
    def get(self, request):
        """获取所有启用的商户列表"""
        try:
            # 获取查询参数
            category = request.GET.get('category', '')
            
            # 构建查询 - 只返回启用的商户
            queryset = MerchantProfile.objects.filter(is_active=True)
            
            if category:
                queryset = queryset.filter(shop_category=category)
            
            merchants = queryset.order_by('-created_at')
            serializer = MerchantProfileSerializer(merchants, many=True, context={'request': request})
            
            return Response({
                'success': True,
                'data': serializer.data
            })
            
        except Exception as e:
            logger.error(f"获取公开商户列表失败: {str(e)}")
            return Response({
                'success': False,
                'message': '获取商户列表失败'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PublicMerchantDetailView(APIView):
    """公开的商户详情接口（供小程序使用）"""
    
    permission_classes = []  # 不需要登录
    
    def get(self, request, merchant_id):
        """获取商户详情"""
        try:
            try:
                merchant = MerchantProfile.objects.get(id=merchant_id, is_active=True)
            except MerchantProfile.DoesNotExist:
                return Response({
                    'success': False,
                    'message': '商户不存在或已停用'
                }, status=status.HTTP_404_NOT_FOUND)
            
            serializer = MerchantProfileSerializer(merchant, context={'request': request})
            return Response({
                'success': True,
                'data': serializer.data
            })
            
        except Exception as e:
            logger.error(f"获取公开商户详情失败: {str(e)}")
            return Response({
                'success': False,
                'message': '获取商户详情失败'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PublicProductListView(APIView):
    """公开的商品列表接口（供小程序使用）"""
    
    permission_classes = []  # 不需要登录
    
    def get(self, request, merchant_id):
        """获取指定商户的商品列表"""
        try:
            # 验证商户是否存在且启用
            try:
                merchant = MerchantProfile.objects.get(id=merchant_id, is_active=True)
            except MerchantProfile.DoesNotExist:
                return Response({
                    'success': False,
                    'message': '商户不存在或已停用'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # 获取查询参数
            category = request.GET.get('category', '')
            status_filter = request.GET.get('status', 'online')  # 默认只显示上架商品
            
            # 构建查询
            queryset = MerchantProduct.objects.filter(merchant=merchant)
            
            if category:
                queryset = queryset.filter(category=category)
            if status_filter:
                queryset = queryset.filter(status=status_filter)
            
            products = queryset.order_by('-created_at')
            serializer = MerchantProductSerializer(
                products, 
                many=True,
                context={'request': request}
            )
            
            return Response({
                'success': True,
                'data': serializer.data
            })
            
        except Exception as e:
            logger.error(f"获取公开商品列表失败: {str(e)}")
            return Response({
                'success': False,
                'message': '获取商品列表失败'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PublicProductDetailView(APIView):
    """公开的商品详情接口（供小程序使用）"""
    
    permission_classes = []  # 不需要登录
    
    def get(self, request, product_id):
        """获取商品详情"""
        try:
            try:
                # 只返回上架的商品
                product = MerchantProduct.objects.get(
                    id=product_id, 
                    status='online',
                    merchant__is_active=True  # 商户也必须是启用状态
                )
            except MerchantProduct.DoesNotExist:
                return Response({
                    'success': False,
                    'message': '商品不存在或已下架'
                }, status=status.HTTP_404_NOT_FOUND)
            
            serializer = MerchantProductSerializer(product, context={'request': request})
            return Response({
                'success': True,
                'data': serializer.data
            })
            
        except Exception as e:
            logger.error(f"获取公开商品详情失败: {str(e)}")
            return Response({
                'success': False,
                'message': '获取商品详情失败'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MerchantOrderListView(APIView):
    """商户订单列表接口"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """获取商户订单列表"""
        try:
            # 检查用户是否为商户
            if request.user.role != 2:
                return Response({
                    'success': False,
                    'message': '权限不足'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # 获取商户档案
            try:
                merchant_profile = MerchantProfile.objects.get(user=request.user)
            except MerchantProfile.DoesNotExist:
                return Response({
                    'success': False,
                    'message': '商户档案不存在'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # 获取查询参数
            status_filter = request.GET.get('status', '')
            page = int(request.GET.get('page', 1))
            page_size = int(request.GET.get('page_size', 20))
            
            # 构建查询
            queryset = MerchantOrder.objects.filter(merchant=merchant_profile).select_related('user', 'used_coupon').prefetch_related('items')
            
            if status_filter:
                queryset = queryset.filter(status=status_filter)
            
            # 分页
            start = (page - 1) * page_size
            end = start + page_size
            orders = queryset[start:end]
            total = queryset.count()
            
            serializer = MerchantOrderSerializer(orders, many=True, context={'request': request})
            
            return Response({
                'success': True,
                'data': {
                    'items': serializer.data,
                    'total': total,
                    'page': page,
                    'page_size': page_size,
                    'total_pages': (total + page_size - 1) // page_size
                }
            })
            
        except Exception as e:
            logger.error(f"获取订单列表失败: {str(e)}")
            return Response({
                'success': False,
                'message': '获取订单列表失败'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MerchantOrderDetailView(APIView):
    """商户订单详情接口"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self, request, order_id):
        """获取订单对象"""
        try:
            merchant_profile = MerchantProfile.objects.get(user=request.user)
            return MerchantOrder.objects.select_related('user', 'used_coupon').prefetch_related('items').get(
                id=order_id, merchant=merchant_profile
            )
        except (MerchantProfile.DoesNotExist, MerchantOrder.DoesNotExist):
            return None
    
    def get(self, request, order_id):
        """获取订单详情"""
        try:
            # 检查用户是否为商户
            if request.user.role != 2:
                return Response({
                    'success': False,
                    'message': '权限不足'
                }, status=status.HTTP_403_FORBIDDEN)
            
            order = self.get_object(request, order_id)
            if not order:
                return Response({
                    'success': False,
                    'message': '订单不存在'
                }, status=status.HTTP_404_NOT_FOUND)
            
            serializer = MerchantOrderSerializer(order, context={'request': request})
            return Response({
                'success': True,
                'data': serializer.data
            })
            
        except Exception as e:
            logger.error(f"获取订单详情失败: {str(e)}")
            return Response({
                'success': False,
                'message': '获取订单详情失败'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class OrderStatusUpdateView(APIView):
    """订单状态更新接口"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, order_id):
        """更新订单状态"""
        try:
            # 检查用户是否为商户
            if request.user.role != 2:
                return Response({
                    'success': False,
                    'message': '权限不足'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # 获取订单
            try:
                merchant_profile = MerchantProfile.objects.get(user=request.user)
                order = MerchantOrder.objects.get(id=order_id, merchant=merchant_profile)
            except (MerchantProfile.DoesNotExist, MerchantOrder.DoesNotExist):
                return Response({
                    'success': False,
                    'message': '订单不存在'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # 验证数据
            serializer = OrderStatusUpdateSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    'success': False,
                    'message': '数据验证失败',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            new_status = serializer.validated_data['status']
            reject_reason = serializer.validated_data.get('reject_reason', '')
            
            # 状态流转检查
            valid_transitions = {
                'new': ['accepted', 'cancelled'],
                'accepted': ['preparing', 'cancelled'],
                'preparing': ['ready', 'cancelled'],
                'ready': ['completed', 'cancelled'],
            }
            
            current_status = order.status
            if current_status not in valid_transitions or new_status not in valid_transitions[current_status]:
                return Response({
                    'success': False,
                    'message': f'不能从{order.get_status_display()}状态变更为{dict(MerchantOrder.STATUS_CHOICES)[new_status]}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 更新状态
            from django.utils import timezone
            order.status = new_status
            
            if new_status == 'accepted':
                order.accepted_at = timezone.now()
            elif new_status == 'completed':
                order.completed_at = timezone.now()
            elif new_status == 'cancelled':
                order.reject_reason = reject_reason
            
            order.save()
            
            return Response({
                'success': True,
                'message': '订单状态更新成功',
                'data': MerchantOrderSerializer(order, context={'request': request}).data
            })
            
        except Exception as e:
            logger.error(f"更新订单状态失败: {str(e)}")
            return Response({
                'success': False,
                'message': '更新订单状态失败'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PickupCodeVerifyView(APIView):
    """取餐码验证接口"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """验证取餐码"""
        try:
            # 检查用户是否为商户
            if request.user.role != 2:
                return Response({
                    'success': False,
                    'message': '权限不足'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # 获取商户档案
            try:
                merchant_profile = MerchantProfile.objects.get(user=request.user)
            except MerchantProfile.DoesNotExist:
                return Response({
                    'success': False,
                    'message': '商户档案不存在'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # 验证数据
            serializer = PickupCodeVerifySerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    'success': False,
                    'message': '数据验证失败',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            pickup_code = serializer.validated_data['pickup_code']
            
            # 查找订单
            try:
                order = MerchantOrder.objects.get(
                    pickup_code=pickup_code,
                    merchant=merchant_profile,
                    status__in=['accepted', 'preparing', 'ready']
                )
            except MerchantOrder.DoesNotExist:
                return Response({
                    'success': False,
                    'message': '取餐码无效或订单已完成'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # 完成订单
            order.complete_order()
            
            return Response({
                'success': True,
                'message': f'订单 {order.order_no} 核销成功',
                'data': {
                    'order_id': order.id,
                    'order_no': order.order_no,
                    'customer_name': order.contact_name,
                    'total_amount': order.total_amount
                }
            })
            
        except Exception as e:
            logger.error(f"取餐码验证失败: {str(e)}")
            return Response({
                'success': False,
                'message': '验证失败，请重试'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MerchantCouponListView(APIView):
    """商户优惠券列表接口"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """获取商户优惠券列表"""
        try:
            # 检查用户是否为商户
            if request.user.role != 2:
                return Response({
                    'success': False,
                    'message': '权限不足'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # 获取商户档案
            try:
                merchant_profile = MerchantProfile.objects.get(user=request.user)
            except MerchantProfile.DoesNotExist:
                return Response({
                    'success': False,
                    'message': '商户档案不存在'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # 获取查询参数
            status_filter = request.GET.get('status', '')
            coupon_type = request.GET.get('type', '')
            
            # 构建查询
            queryset = MerchantCoupon.objects.filter(merchant=merchant_profile)
            
            if status_filter:
                queryset = queryset.filter(status=status_filter)
            if coupon_type:
                queryset = queryset.filter(coupon_type=coupon_type)
            
            coupons = queryset.order_by('-created_at')
            serializer = MerchantCouponSerializer(coupons, many=True, context={'request': request})
            
            return Response({
                'success': True,
                'data': serializer.data
            })
            
        except Exception as e:
            logger.error(f"获取优惠券列表失败: {str(e)}")
            return Response({
                'success': False,
                'message': '获取优惠券列表失败'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request):
        """创建优惠券"""
        try:
            # 检查用户是否为商户
            if request.user.role != 2:
                return Response({
                    'success': False,
                    'message': '权限不足'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # 获取商户档案
            try:
                merchant_profile = MerchantProfile.objects.get(user=request.user)
            except MerchantProfile.DoesNotExist:
                return Response({
                    'success': False,
                    'message': '商户档案不存在'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # 验证数据
            serializer = MerchantCouponSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                coupon = serializer.save(merchant=merchant_profile)
                
                return Response({
                    'success': True,
                    'message': '优惠券创建成功',
                    'data': MerchantCouponSerializer(coupon, context={'request': request}).data
                }, status=status.HTTP_201_CREATED)
            
            return Response({
                'success': False,
                'message': '数据验证失败',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"创建优惠券失败: {str(e)}")
            return Response({
                'success': False,
                'message': '创建优惠券失败'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PublicCouponListView(APIView):
    """公开优惠券列表接口（供小程序使用）"""
    
    permission_classes = []
    
    def get(self, request, merchant_id=None):
        """获取优惠券列表"""
        try:
            # 构建查询
            queryset = MerchantCoupon.objects.filter(
                status='active',
                merchant__is_active=True
            )
            
            if merchant_id:
                queryset = queryset.filter(merchant_id=merchant_id)
            
            # 只返回有效期内且有剩余数量的优惠券
            from django.utils import timezone
            now = timezone.now()
            queryset = queryset.filter(
                start_date__lte=now,
                end_date__gte=now,
                total_count__gt=models.F('used_count')
            )
            
            coupons = queryset.select_related('merchant').order_by('-created_at')
            serializer = MerchantCouponSerializer(coupons, many=True, context={'request': request})
            
            return Response({
                'success': True,
                'data': serializer.data
            })
            
        except Exception as e:
            logger.error(f"获取公开优惠券列表失败: {str(e)}")
            return Response({
                'success': False,
                'message': '获取优惠券列表失败'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CouponReceiveView(APIView):
    """优惠券领取接口"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """领取优惠券"""
        try:
            # 验证数据
            serializer = CouponReceiveSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    'success': False,
                    'message': '数据验证失败',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            coupon_id = serializer.validated_data['coupon_id']
            
            try:
                coupon = MerchantCoupon.objects.get(id=coupon_id)
            except MerchantCoupon.DoesNotExist:
                return Response({
                    'success': False,
                    'message': '优惠券不存在'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # 检查优惠券是否有效
            if not coupon.is_valid:
                return Response({
                    'success': False,
                    'message': '优惠券已失效或数量不足'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 检查用户是否已经领取过
            if UserCoupon.objects.filter(user=request.user, coupon=coupon).exists():
                return Response({
                    'success': False,
                    'message': '您已经领取过该优惠券'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 检查用户领取数量限制
            user_received_count = UserCoupon.objects.filter(user=request.user, coupon=coupon).count()
            if user_received_count >= coupon.per_user_limit:
                return Response({
                    'success': False,
                    'message': f'您已达到该优惠券的领取上限（{coupon.per_user_limit}张）'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 使用事务确保数据一致性
            with transaction.atomic():
                # 创建用户优惠券记录
                user_coupon = UserCoupon.objects.create(
                    user=request.user,
                    coupon=coupon
                )
                
                # 更新优惠券使用数量
                coupon.used_count += 1
                coupon.save()
            
            return Response({
                'success': True,
                'message': '优惠券领取成功',
                'data': UserCouponSerializer(user_coupon, context={'request': request}).data
            })
            
        except Exception as e:
            logger.error(f"领取优惠券失败: {str(e)}")
            return Response({
                'success': False,
                'message': '领取优惠券失败'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserCouponListView(APIView):
    """用户优惠券列表接口"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """获取用户的优惠券列表"""
        try:
            # 获取查询参数
            status_filter = request.GET.get('status', '')
            merchant_id = request.GET.get('merchant_id', '')
            
            # 构建查询
            queryset = UserCoupon.objects.filter(user=request.user).select_related('coupon', 'coupon__merchant')
            
            if status_filter:
                queryset = queryset.filter(status=status_filter)
            if merchant_id:
                queryset = queryset.filter(coupon__merchant_id=merchant_id)
            
            user_coupons = queryset.order_by('-received_at')
            serializer = UserCouponSerializer(user_coupons, many=True, context={'request': request})
            
            return Response({
                'success': True,
                'data': serializer.data
            })
            
        except Exception as e:
            logger.error(f"获取用户优惠券列表失败: {str(e)}")
            return Response({
                'success': False,
                'message': '获取优惠券列表失败'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CouponVerifyView(APIView):
    """优惠券核销接口（商户端使用）"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """核销优惠券"""
        try:
            # 检查用户是否为商户
            if request.user.role != 2:
                return Response({
                    'success': False,
                    'message': '权限不足'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # 获取商户档案
            try:
                merchant_profile = MerchantProfile.objects.get(user=request.user)
            except MerchantProfile.DoesNotExist:
                return Response({
                    'success': False,
                    'message': '商户档案不存在'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # 验证数据
            serializer = CouponVerifySerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    'success': False,
                    'message': '数据验证失败',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            verification_code = serializer.validated_data['verification_code']
            order_id = serializer.validated_data.get('order_id')
            
            # 查找用户优惠券
            try:
                user_coupon = UserCoupon.objects.select_related('coupon', 'coupon__merchant').get(
                    verification_code=verification_code,
                    status='unused',
                    coupon__merchant=merchant_profile
                )
            except UserCoupon.DoesNotExist:
                return Response({
                    'success': False,
                    'message': '核销码无效、已使用或不属于本商户'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # 检查优惠券是否在有效期内
            from django.utils import timezone
            if user_coupon.coupon.end_date < timezone.now():
                return Response({
                    'success': False,
                    'message': '优惠券已过期'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 获取关联订单（如果提供）
            order = None
            if order_id:
                try:
                    order = MerchantOrder.objects.get(id=order_id, merchant=merchant_profile)
                except MerchantOrder.DoesNotExist:
                    return Response({
                        'success': False,
                        'message': '关联订单不存在'
                    }, status=status.HTTP_404_NOT_FOUND)
            
            # 核销优惠券
            user_coupon.use_coupon(order)
            
            return Response({
                'success': True,
                'message': f'优惠券"{user_coupon.coupon.name}"核销成功',
                'data': {
                    'coupon_id': user_coupon.coupon.id,
                    'coupon_name': user_coupon.coupon.name,
                    'amount': user_coupon.coupon.amount,
                    'user_name': user_coupon.user.username,
                    'verification_code': verification_code,
                    'used_at': user_coupon.used_at
                }
            })
            
        except Exception as e:
            logger.error(f"优惠券核销失败: {str(e)}")
            return Response({
                'success': False,
                'message': '核销失败，请重试'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class OrderCreateView(APIView):
    """订单创建接口（小程序使用）"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """创建订单"""
        try:

            # 检查用户权限（普通用户才能下单）
            if request.user.role not in [0, 2]:  # 普通用户或商户可以下单
                return Response({
                    'success': False,
                    'message': '权限不足'
                }, status=status.HTTP_403_FORBIDDEN)

            # 验证数据
            serializer = OrderCreateSerializer(data=request.data, context={'request': request})
            if not serializer.is_valid():
                return Response({
                    'success': False,
                    'message': '数据验证失败',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)

            # 创建订单
            order = serializer.save()

            # 返回订单详情
            order_data = MerchantOrderSerializer(order, context={'request': request}).data

            return Response({
                'success': True,
                'message': '订单创建成功',
                'data': {
                    'order_id': order.id,
                    'order_no': order.order_no,
                    'pickup_code': order.pickup_code,
                    'total_amount': float(order.total_amount),
                    'actual_amount': float(order.actual_amount),
                    'discount_amount': float(order.discount_amount),
                    'status': order.get_status_display(),
                    'created_at': order.created_at
                }
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"创建订单失败: {str(e)}")
            return Response({
                'success': False,
                'message': '创建订单失败，请重试'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserOrderListView(APIView):
    """用户订单列表接口（小程序使用）"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """获取用户订单列表"""
        try:
            # 获取查询参数
            status_filter = request.GET.get('status', '')
            page = int(request.GET.get('page', 1))
            page_size = int(request.GET.get('page_size', 20))

            # 构建查询
            queryset = MerchantOrder.objects.filter(user=request.user).select_related('merchant', 'used_coupon').prefetch_related('items')

            if status_filter:
                # 支持多个状态用逗号分隔
                if ',' in status_filter:
                    status_list = [s.strip() for s in status_filter.split(',')]
                    queryset = queryset.filter(status__in=status_list)
                else:
                    queryset = queryset.filter(status=status_filter)

            # 分页
            start = (page - 1) * page_size
            end = start + page_size
            orders = queryset[start:end]
            total = queryset.count()

            serializer = MerchantOrderSerializer(orders, many=True, context={'request': request})

            return Response({
                'success': True,
                'data': {
                    'items': serializer.data,
                    'total': total,
                    'page': page,
                    'page_size': page_size,
                    'total_pages': (total + page_size - 1) // page_size
                }
            })

        except Exception as e:
            logger.error(f"获取用户订单列表失败: {str(e)}")
            return Response({
                'success': False,
                'message': '获取订单列表失败'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserOrderDetailView(APIView):
    """用户订单详情接口（小程序使用）"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, order_id):
        """获取用户订单详情"""
        try:
            order = MerchantOrder.objects.select_related('merchant', 'user', 'used_coupon').prefetch_related('items').get(
                id=order_id, user=request.user
            )

            serializer = MerchantOrderSerializer(order, context={'request': request})

            return Response({
                'success': True,
                'data': serializer.data
            })

        except MerchantOrder.DoesNotExist:
            return Response({
                'success': False,
                'message': '订单不存在'
            }, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            logger.error(f"获取用户订单详情失败: {str(e)}")
            return Response({
                'success': False,
                'message': '获取订单详情失败'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request, order_id):
        """取消订单"""
        try:
            order = MerchantOrder.objects.get(id=order_id, user=request.user)

            # 检查订单状态是否可以取消
            if order.status not in ['new']:
                return Response({
                    'success': False,
                    'message': '订单状态不允许取消'
                }, status=status.HTTP_400_BAD_REQUEST)

            # 更新订单状态
            order.status = 'cancelled'
            order.save()

            # 如果使用了优惠券，退还优惠券
            if order.used_coupon:
                order.used_coupon.is_used = False
                order.used_coupon.used_at = None
                order.used_coupon.save()

            return Response({
                'success': True,
                'message': '订单已取消'
            })

        except MerchantOrder.DoesNotExist:
            return Response({
                'success': False,
                'message': '订单不存在'
            }, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            logger.error(f"取消订单失败: {str(e)}")
            return Response({
                'success': False,
                'message': '取消订单失败'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MerchantStatsView(APIView):
    """商户统计数据接口（商户端使用）"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """获取商户经营统计数据"""
        try:
            # 检查用户权限（只有商户可以查看自己的统计）
            if request.user.role not in [1, 2]:  # 商户角色
                return Response({
                    'success': False,
                    'message': '权限不足'
                }, status=status.HTTP_403_FORBIDDEN)

            # 获取商户档案
            try:
                merchant_profile = MerchantProfile.objects.get(user=request.user)
            except MerchantProfile.DoesNotExist:
                return Response({
                    'success': False,
                    'message': '商户档案不存在'
                }, status=status.HTTP_404_NOT_FOUND)

            # 获取当前时间
            now = timezone.now()
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

            # 今日订单统计
            today_orders = MerchantOrder.objects.filter(
                merchant=merchant_profile,
                created_at__gte=today_start
            )

            # 今日营业额（已完成订单）
            today_completed_orders = today_orders.filter(status='completed')
            today_revenue = today_completed_orders.aggregate(
                total=models.Sum('actual_amount')
            )['total'] or 0

            # 待处理订单（新订单）
            pending_orders = today_orders.filter(status='new').count()

            # 近7天销售趋势
            sales_trend = []
            for i in range(7):
                date = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
                next_date = date + timedelta(days=1)

                daily_revenue = MerchantOrder.objects.filter(
                    merchant=merchant_profile,
                    status='completed',
                    created_at__gte=date,
                    created_at__lt=next_date
                ).aggregate(total=models.Sum('actual_amount'))['total'] or 0

                sales_trend.insert(0, {
                    'date': date.strftime('%m-%d'),
                    'amount': float(daily_revenue)
                })

            return Response({
                'success': True,
                'data': {
                    'todayOrders': today_orders.count(),
                    'todayRevenue': float(today_revenue),
                    'pendingOrders': pending_orders,
                    'salesTrend': sales_trend
                }
            })

        except Exception as e:
            logger.error(f"获取商户统计失败: {str(e)}")
            return Response({
                'success': False,
                'message': '获取统计数据失败'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MerchantLogoUploadView(APIView):
    """商户Logo上传接口"""

    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        """上传商户Logo"""
        try:
            # 检查用户是否为商户
            if request.user.role != 2:  # 商户角色
                return Response({
                    'success': False,
                    'message': '权限不足'
                }, status=status.HTTP_403_FORBIDDEN)

            # 获取商户档案
            try:
                merchant_profile = MerchantProfile.objects.get(user=request.user)
            except MerchantProfile.DoesNotExist:
                return Response({
                    'success': False,
                    'message': '商户档案不存在'
                }, status=status.HTTP_404_NOT_FOUND)

            # 验证上传的文件
            serializer = LogoUploadSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    'code': 400,
                    'message': '文件验证失败',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)

            logo_file = serializer.validated_data['logo']

            # 生成唯一的文件名
            import uuid
            import os
            file_ext = os.path.splitext(logo_file.name)[1].lower()
            new_filename = f"{uuid.uuid4().hex}{file_ext}"

            # 使用临时MerchantProfile实例来保存文件（不保存到数据库）
            temp_profile = MerchantProfile()
            temp_profile.shop_logo.save(new_filename, logo_file, save=False)

            # 构建完整的URL
            logo_url = request.build_absolute_uri(temp_profile.shop_logo.url)

            logger.info(f"商户Logo上传成功: 商户ID={merchant_profile.id}, 文件名={new_filename}")

            return Response({
                'code': 200,
                'message': 'Logo上传成功',
                'data': {
                    'logo_url': logo_url,
                    'filename': new_filename
                }
            })

        except Exception as e:
            logger.error(f"Logo上传失败: {str(e)}")
            return Response({
                'code': 400,
                'message': 'Logo上传失败，请重试'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
