from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import (
    HouseBindingApplication, HouseUserBinding, Visitor,
    ParkingBindingApplication, ParkingUserBinding
)
from .serializers import (
    HouseBindingApplicationSerializer, HouseUserBindingSerializer,
    VisitorCreateSerializer, VisitorListSerializer, VisitorDetailSerializer,
    ParkingBindingApplicationSerializer, ParkingUserBindingSerializer
)
import logging
import json

logger = logging.getLogger(__name__)
User = get_user_model()


class HouseBindingApplicationView(APIView):
    """房屋绑定申请接口"""
    permission_classes = []  # 暂时不需要权限认证

    def post(self, request):
        """提交房屋绑定申请"""
        # TODO: 后续添加JWT认证后，从token获取用户
        # user = request.user
        
        # 临时处理：从请求参数获取用户ID
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({
                "code": 400,
                "message": "缺少用户ID参数"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({
                "code": 404,
                "message": "用户不存在"
            }, status=status.HTTP_404_NOT_FOUND)

        # 检查是否已经有待审核的申请
        existing_application = HouseBindingApplication.objects.filter(
            user=user,
            building_name=request.data.get('building_name'),
            unit_name=request.data.get('unit_name'),
            room_number=request.data.get('room_number'),
            status=0  # 待审核状态
        ).first()

        if existing_application:
            return Response({
                "code": 400,
                "message": "该房屋已有待审核的绑定申请，请勿重复提交"
            }, status=status.HTTP_400_BAD_REQUEST)

        # 创建申请记录
        serializer = HouseBindingApplicationSerializer(data=request.data)
        if serializer.is_valid():
            application = serializer.save(user=user)
            logger.info(f"用户 {user.id} 提交房屋绑定申请: {application.building_name}{application.unit_name}{application.room_number}")
            
            return Response({
                "code": 200,
                "message": "申请提交成功，请等待审核",
                "data": {
                    "application_id": application.id,
                    "status": application.status,
                    "created_at": application.created_at
                }
            })
        
        return Response({
            "code": 400,
            "message": "数据校验失败",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        """获取用户的房屋绑定申请列表"""
        # TODO: 后续添加JWT认证后，从token获取用户
        user_id = request.GET.get('user_id')
        if not user_id:
            return Response({
                "code": 400,
                "message": "缺少用户ID参数"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({
                "code": 404,
                "message": "用户不存在"
            }, status=status.HTTP_404_NOT_FOUND)

        applications = HouseBindingApplication.objects.filter(user=user).order_by('-created_at')
        serializer = HouseBindingApplicationSerializer(applications, many=True)
        
        return Response({
            "code": 200,
            "message": "获取成功",
            "data": serializer.data
        })


class MyHouseListView(APIView):
    """我的房屋列表"""
    permission_classes = []
    
    def get(self, request):
        """获取用户已绑定的房屋列表"""
        user_id = request.GET.get('user_id')
        
        # 如果user_id为'all'，返回所有绑定记录（用于管理员查看）
        if user_id == 'all':
            bindings = HouseUserBinding.objects.filter(status=1).order_by('-created_at')
            serializer = HouseUserBindingSerializer(bindings, many=True)
            
            return Response({
                "code": 200,
                "message": "获取成功",
                "data": serializer.data
            })
        
        if not user_id:
            return Response({
                "code": 400,
                "message": "缺少用户ID参数"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({
                "code": 404,
                "message": "用户不存在"
            }, status=status.HTTP_404_NOT_FOUND)

        # 获取已绑定的房屋（状态为已绑定）
        bindings = HouseUserBinding.objects.filter(user=user, status=1).order_by('-created_at')
        serializer = HouseUserBindingSerializer(bindings, many=True)
        
        return Response({
            "code": 200,
            "message": "获取成功",
            "data": serializer.data
        })


class HouseBindingStatsView(APIView):
    """房屋绑定统计信息"""
    permission_classes = []
    
    def get(self, request):
        """获取房屋绑定统计数据"""
        stats = {
            "total_applications": HouseBindingApplication.objects.count(),
            "pending_applications": HouseBindingApplication.objects.filter(status=0).count(),
            "approved_applications": HouseBindingApplication.objects.filter(status=1).count(),
            "rejected_applications": HouseBindingApplication.objects.filter(status=2).count(),
            "total_bindings": HouseUserBinding.objects.filter(status=1).count(),
        }
        
        return Response({
            "code": 200,
            "message": "获取成功",
            "data": stats
        })


class VisitorInviteView(APIView):
    """访客邀请接口"""
    permission_classes = []  # 暂时不需要权限认证

    def post(self, request):
        """创建访客邀请"""
        # TODO: 后续添加JWT认证后，从token获取用户
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({
                "code": 400,
                "message": "缺少用户ID参数"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({
                "code": 404,
                "message": "用户不存在"
            }, status=status.HTTP_404_NOT_FOUND)

        # 检查用户是否已绑定房屋（只有已绑定房屋的业主才能邀请访客）
        # user_bindings = HouseUserBinding.objects.filter(user=user, status=1)
        # if not user_bindings.exists():
        #     return Response({
        #         "code": 403,
        #         "message": "您需要先绑定房屋才能邀请访客"
        #     }, status=status.HTTP_403_FORBIDDEN)

        # 创建访客邀请
        serializer = VisitorCreateSerializer(data=request.data)
        if serializer.is_valid():
            visitor = serializer.save(inviter=user)
            logger.info(f"用户 {user.id} 创建访客邀请: {visitor.name}")
            
            return Response({
                "code": 200,
                "message": "访客邀请创建成功",
                "data": {
                    "visitor_id": str(visitor.id),
                    "qr_code_token": visitor.qr_code_token,
                    "expires_at": visitor.qr_code_expires_at
                }
            })
        
        return Response({
            "code": 400,
            "message": "数据校验失败",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        """获取用户的访客邀请列表"""
        user_id = request.GET.get('user_id')
        if not user_id:
            return Response({
                "code": 400,
                "message": "缺少用户ID参数"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({
                "code": 404,
                "message": "用户不存在"
            }, status=status.HTTP_404_NOT_FOUND)

        # 获取用户的访客邀请列表
        visitors = Visitor.objects.filter(inviter=user).order_by('-created_at')
        
        # 自动更新过期状态
        now = timezone.now()
        for visitor in visitors:
            if visitor.status == 'pending' and visitor.qr_code_expires_at <= now:
                visitor.status = 'expired'
                visitor.save()
        
        serializer = VisitorListSerializer(visitors, many=True)
        
        return Response({
            "code": 200,
            "message": "获取成功",
            "data": serializer.data
        })


class VisitorDetailView(APIView):
    """访客详情接口"""
    permission_classes = []

    def get(self, request, visitor_id):
        """获取访客详情"""
        try:
            visitor = Visitor.objects.get(id=visitor_id)
        except Visitor.DoesNotExist:
            return Response({
                "code": 404,
                "message": "访客邀请不存在"
            }, status=status.HTTP_404_NOT_FOUND)

        # 检查是否有权限查看（邀请人或管理员）
        user_id = request.GET.get('user_id')
        if user_id and str(visitor.inviter.id) != user_id:
            return Response({
                "code": 403,
                "message": "无权查看此访客邀请"
            }, status=status.HTTP_403_FORBIDDEN)

        # 自动更新过期状态
        if visitor.status == 'pending' and visitor.qr_code_expires_at <= timezone.now():
            visitor.status = 'expired'
            visitor.save()

        serializer = VisitorDetailSerializer(visitor)
        
        return Response({
            "code": 200,
            "message": "获取成功",
            "data": serializer.data
        })


class VisitorStatusView(APIView):
    """访客状态管理接口"""
    permission_classes = []

    def patch(self, request, visitor_id):
        """更新访客状态"""
        try:
            visitor = Visitor.objects.get(id=visitor_id)
        except Visitor.DoesNotExist:
            return Response({
                "code": 404,
                "message": "访客邀请不存在"
            }, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action')
        user_id = request.data.get('user_id')

        # 检查权限
        if user_id and str(visitor.inviter.id) != user_id:
            return Response({
                "code": 403,
                "message": "无权操作此访客邀请"
            }, status=status.HTTP_403_FORBIDDEN)

        if action == 'cancel':
            # 取消邀请
            if visitor.status != 'pending':
                return Response({
                    "code": 400,
                    "message": "只能取消待访问状态的邀请"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            visitor.status = 'cancelled'
            visitor.save()
            
            return Response({
                "code": 200,
                "message": "邀请已取消"
            })
        
        elif action == 'visit':
            # 访客通行（扫码时调用）
            if visitor.status != 'pending':
                return Response({
                    "code": 400,
                    "message": "此邀请无法使用"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if visitor.is_qr_code_expired():
                visitor.status = 'expired'
                visitor.save()
                return Response({
                    "code": 400,
                    "message": "二维码已过期"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            visitor.status = 'visited'
            visitor.visit_actual_time = timezone.now()
            visitor.save()
            
            return Response({
                "code": 200,
                "message": "访客通行成功"
            })
        
        return Response({
            "code": 400,
            "message": "无效的操作"
        }, status=status.HTTP_400_BAD_REQUEST)


class VisitorQRCodeView(APIView):
    """访客二维码接口"""
    permission_classes = []

    def get(self, request, visitor_id):
        """获取访客二维码数据"""
        try:
            visitor = Visitor.objects.get(id=visitor_id)
        except Visitor.DoesNotExist:
            return Response({
                "code": 404,
                "message": "访客邀请不存在"
            }, status=status.HTTP_404_NOT_FOUND)

        # 检查权限
        user_id = request.GET.get('user_id')
        if user_id and str(visitor.inviter.id) != user_id:
            return Response({
                "code": 403,
                "message": "无权查看此二维码"
            }, status=status.HTTP_403_FORBIDDEN)

        # 检查状态和过期时间
        if visitor.status != 'pending':
            return Response({
                "code": 400,
                "message": "此邀请已无法使用"
            }, status=status.HTTP_400_BAD_REQUEST)

        if visitor.is_qr_code_expired():
            visitor.status = 'expired'
            visitor.save()
            return Response({
                "code": 400,
                "message": "二维码已过期"
            }, status=status.HTTP_400_BAD_REQUEST)

        # 使用简洁的字符串格式，减少二维码数据量
        qr_text = visitor.get_qr_code_simple_string()
        
        return Response({
            "code": 200,
            "message": "获取成功",
            "data": {
                "qr_code_data": qr_text,
                "qr_code_text": qr_text,  # 兼容前端
                "expires_at": visitor.qr_code_expires_at,
                "visitor_info": {
                    "name": visitor.name,
                    "phone": visitor.phone,
                    "visit_time": visitor.visit_time
                }
            }
        })


# ===== 车位绑定相关视图 =====

class ParkingBindingApplicationView(APIView):
    """车位绑定申请接口"""
    permission_classes = []  # 暂时不需要权限认证

    def post(self, request):
        """提交车位绑定申请"""
        # TODO: 后续添加JWT认证后，从token获取用户
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({
                "code": 400,
                "message": "缺少用户ID参数"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({
                "code": 404,
                "message": "用户不存在"
            }, status=status.HTTP_404_NOT_FOUND)

        # 检查是否已经有待审核的申请（同一车位）
        existing_application = ParkingBindingApplication.objects.filter(
            user=user,
            parking_area=request.data.get('parking_area'),
            parking_no=request.data.get('parking_no'),
            status=0  # 待审核状态
        ).first()

        if existing_application:
            return Response({
                "code": 400,
                "message": "该车位已有待审核的绑定申请，请勿重复提交"
            }, status=status.HTTP_400_BAD_REQUEST)

        # 检查是否已经绑定了相同车牌号
        existing_car_binding = ParkingBindingApplication.objects.filter(
            user=user,
            car_no=request.data.get('car_no'),
            status__in=[0, 1]  # 待审核或已通过
        ).first()

        if existing_car_binding:
            return Response({
                "code": 400,
                "message": "该车辆已有绑定记录，一辆车只能绑定一个车位"
            }, status=status.HTTP_400_BAD_REQUEST)

        # 创建申请记录
        serializer = ParkingBindingApplicationSerializer(data=request.data)
        if serializer.is_valid():
            application = serializer.save(user=user)
            logger.info(f"用户 {user.id} 提交车位绑定申请: {application.parking_area}-{application.parking_no} ({application.car_no})")
            
            return Response({
                "code": 200,
                "message": "申请提交成功，请等待审核",
                "data": {
                    "application_id": application.id,
                    "status": application.status,
                    "created_at": application.created_at
                }
            })
        
        return Response({
            "code": 400,
            "message": "数据校验失败",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        """获取用户的车位绑定申请列表"""
        # TODO: 后续添加JWT认证后，从token获取用户
        user_id = request.GET.get('user_id')
        if not user_id:
            return Response({
                "code": 400,
                "message": "缺少用户ID参数"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({
                "code": 404,
                "message": "用户不存在"
            }, status=status.HTTP_404_NOT_FOUND)

        applications = ParkingBindingApplication.objects.filter(user=user).order_by('-created_at')
        serializer = ParkingBindingApplicationSerializer(applications, many=True)
        
        return Response({
            "code": 200,
            "message": "获取成功",
            "data": serializer.data
        })


class MyParkingListView(APIView):
    """我的车位列表"""
    permission_classes = []
    
    def get(self, request):
        """获取用户已绑定的车位列表"""
        user_id = request.GET.get('user_id')
        
        # 如果user_id为'all'，返回所有绑定记录（用于管理员查看）
        if user_id == 'all':
            bindings = ParkingUserBinding.objects.filter(status=1).order_by('-created_at')
            serializer = ParkingUserBindingSerializer(bindings, many=True)
            
            return Response({
                "code": 200,
                "message": "获取成功",
                "data": serializer.data
            })
        
        if not user_id:
            return Response({
                "code": 400,
                "message": "缺少用户ID参数"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({
                "code": 404,
                "message": "用户不存在"
            }, status=status.HTTP_404_NOT_FOUND)

        # 获取已绑定的车位（状态为已绑定）
        bindings = ParkingUserBinding.objects.filter(user=user, status=1).order_by('-created_at')
        serializer = ParkingUserBindingSerializer(bindings, many=True)
        
        return Response({
            "code": 200,
            "message": "获取成功",
            "data": serializer.data
        })


class ParkingBindingStatsView(APIView):
    """车位绑定统计信息"""
    permission_classes = []
    
    def get(self, request):
        """获取车位绑定统计数据"""
        stats = {
            "total_applications": ParkingBindingApplication.objects.count(),
            "pending_applications": ParkingBindingApplication.objects.filter(status=0).count(),
            "approved_applications": ParkingBindingApplication.objects.filter(status=1).count(),
            "rejected_applications": ParkingBindingApplication.objects.filter(status=2).count(),
            "total_bindings": ParkingUserBinding.objects.filter(status=1).count(),
        }
        
        return Response({
            "code": 200,
            "message": "获取成功",
            "data": stats
        })


class HouseBindingAuditView(APIView):
    """房屋绑定审核接口"""
    permission_classes = []
    
    def get(self, request):
        """获取待审核的房屋绑定申请列表"""
        applications = HouseBindingApplication.objects.filter(status=0).order_by('-created_at')
        from .serializers import HouseBindingApplicationListSerializer
        serializer = HouseBindingApplicationListSerializer(applications, many=True)
        
        return Response({
            "code": 200,
            "message": "获取成功",
            "data": serializer.data
        })
    
    def patch(self, request, application_id):
        """审核房屋绑定申请"""
        try:
            application = HouseBindingApplication.objects.get(id=application_id)
        except HouseBindingApplication.DoesNotExist:
            return Response({
                "code": 404,
                "message": "申请记录不存在"
            }, status=status.HTTP_404_NOT_FOUND)
        
        action = request.data.get('action')
        
        if action == 'approve':
            # 通过申请
            application.status = 1
            application.audit_time = timezone.now()
            # TODO: 从JWT获取审核人
            # application.auditor = request.user
            application.audit_remark = request.data.get('remark', '')
            application.save()
            
            # 创建正式绑定关系
            HouseUserBinding.objects.create(
                user=application.user,
                application=application,
                identity=application.identity
            )
            
            logger.info(f"房屋绑定申请 {application_id} 已通过审核")
            
            return Response({
                "code": 200,
                "message": "审核通过"
            })
        
        elif action == 'reject':
            # 拒绝申请
            reject_reason = request.data.get('reject_reason')
            if not reject_reason:
                return Response({
                    "code": 400,
                    "message": "请输入拒绝原因"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            application.status = 2
            application.audit_time = timezone.now()
            # application.auditor = request.user
            application.reject_reason = reject_reason
            application.save()
            
            logger.info(f"房屋绑定申请 {application_id} 已拒绝，原因：{reject_reason}")
            
            return Response({
                "code": 200,
                "message": "已拒绝申请"
            })
        
        return Response({
            "code": 400,
            "message": "无效的操作"
        }, status=status.HTTP_400_BAD_REQUEST)


class ParkingBindingAuditView(APIView):
    """车位绑定审核接口"""
    permission_classes = []
    
    def get(self, request):
        """获取待审核的车位绑定申请列表"""
        applications = ParkingBindingApplication.objects.filter(status=0).order_by('-created_at')
        from .serializers import ParkingBindingApplicationListSerializer
        serializer = ParkingBindingApplicationListSerializer(applications, many=True)
        
        return Response({
            "code": 200,
            "message": "获取成功",
            "data": serializer.data
        })
    
    def patch(self, request, application_id):
        """审核车位绑定申请"""
        try:
            application = ParkingBindingApplication.objects.get(id=application_id)
        except ParkingBindingApplication.DoesNotExist:
            return Response({
                "code": 404,
                "message": "申请记录不存在"
            }, status=status.HTTP_404_NOT_FOUND)
        
        action = request.data.get('action')
        
        if action == 'approve':
            # 通过申请
            application.status = 1
            application.audit_time = timezone.now()
            # application.auditor = request.user
            application.audit_remark = request.data.get('remark', '')
            application.save()
            
            # 创建正式绑定关系
            ParkingUserBinding.objects.create(
                user=application.user,
                application=application
            )
            
            logger.info(f"车位绑定申请 {application_id} 已通过审核")
            
            return Response({
                "code": 200,
                "message": "审核通过"
            })
        
        elif action == 'reject':
            # 拒绝申请
            reject_reason = request.data.get('reject_reason')
            if not reject_reason:
                return Response({
                    "code": 400,
                    "message": "请输入拒绝原因"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            application.status = 2
            application.audit_time = timezone.now()
            # application.auditor = request.user
            application.reject_reason = reject_reason
            application.save()
            
            logger.info(f"车位绑定申请 {application_id} 已拒绝，原因：{reject_reason}")
            
            return Response({
                "code": 200,
                "message": "已拒绝申请"
            })
        
        return Response({
            "code": 400,
            "message": "无效的操作"
        }, status=status.HTTP_400_BAD_REQUEST)


class HouseBindingUnbindView(APIView):
    """房屋绑定解绑接口"""
    permission_classes = []
    
    def patch(self, request, binding_id):
        """解绑房屋绑定关系"""
        try:
            binding = HouseUserBinding.objects.get(id=binding_id)
        except HouseUserBinding.DoesNotExist:
            return Response({
                "code": 404,
                "message": "绑定记录不存在"
            }, status=status.HTTP_404_NOT_FOUND)
        
        # 执行软删除
        binding.status = 2  # 已解绑
        binding.save()
        
        logger.info(f"房屋绑定关系 {binding_id} 已解绑")
        
        return Response({
            "code": 200,
            "message": "已解除绑定"
        })


class ParkingBindingUnbindView(APIView):
    """车位绑定解绑接口"""  
    permission_classes = []
    
    def patch(self, request, binding_id):
        """解绑车位绑定关系"""
        try:
            binding = ParkingUserBinding.objects.get(id=binding_id)
        except ParkingUserBinding.DoesNotExist:
            return Response({
                "code": 404,
                "message": "绑定记录不存在"
            }, status=status.HTTP_404_NOT_FOUND)
        
        # 执行软删除
        binding.status = 2  # 已解绑
        binding.save()
        
        logger.info(f"车位绑定关系 {binding_id} 已解绑")
        
        return Response({
            "code": 200,
            "message": "已解除绑定"
        })


class HouseListView(APIView):
    """房屋基础数据列表接口"""
    permission_classes = []  # 暂时不需要权限认证

    def get(self, request):
        """获取所有房屋列表，包含绑定信息"""
        try:
            from .models import House, Building
            
            houses = House.objects.select_related('building').all()
            house_list = []
            
            for house in houses:
                # 获取绑定信息
                binding = HouseUserBinding.objects.filter(
                    house=house, 
                    status=1  # 已绑定状态
                ).select_related('application', 'user').first()
                
                # 构建房屋数据
                house_data = {
                    'id': house.id,
                    'building': house.building.name,
                    'unit': house.unit,
                    'room': house.room_number,
                    'floor': house.floor,
                    'area': str(house.area),
                    'status': 'self' if house.status == 1 else ('rent' if house.status == 2 else 'empty'),
                    'ownerName': None,
                    'ownerPhone': None,
                    'bindingId': None
                }
                
                # 如果有绑定关系，添加绑定信息
                if binding and binding.application:
                    house_data.update({
                        'ownerName': binding.application.applicant_name,
                        'ownerPhone': binding.application.applicant_phone,
                        'bindingId': binding.id
                    })
                
                house_list.append(house_data)
            
            return Response({
                "code": 200,
                "message": "获取成功",
                "data": house_list
            })
            
        except Exception as e:
            logger.error(f"获取房屋列表失败: {e}")
            return Response({
                "code": 500,
                "message": f"获取房屋列表失败: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ParkingSpaceListView(APIView):
    """车位基础数据列表接口"""
    permission_classes = []  # 暂时不需要权限认证

    def get(self, request):
        """获取所有车位列表，包含绑定信息"""
        try:
            from .models import ParkingSpace
            
            parking_spaces = ParkingSpace.objects.all()
            parking_list = []
            
            for space in parking_spaces:
                # 获取绑定信息
                binding = ParkingUserBinding.objects.filter(
                    parking_space=space,
                    status=1  # 已绑定状态
                ).select_related('application', 'user').first()
                
                # 构建车位数据
                parking_data = {
                    'id': space.id,
                    'area': space.area_name,
                    'parkingNo': space.space_number,
                    'type': space.parking_type,
                    'status': 'active' if space.status == 1 else ('expired' if space.status == 2 else 'empty'),
                    'carNo': None,
                    'carBrand': None,
                    'carColor': None,
                    'ownerName': None,
                    'ownerPhone': None,
                    'bindingId': None
                }
                
                # 如果有绑定关系，添加绑定信息
                if binding and binding.application:
                    parking_data.update({
                        'carNo': binding.application.car_no,
                        'carBrand': binding.application.car_brand,
                        'carColor': binding.application.car_color,
                        'ownerName': binding.application.owner_name,
                        'ownerPhone': binding.application.owner_phone,
                        'bindingId': binding.id
                    })
                
                parking_list.append(parking_data)
            
            return Response({
                "code": 200,
                "message": "获取成功", 
                "data": parking_list
            })
            
        except Exception as e:
            logger.error(f"获取车位列表失败: {e}")
            return Response({
                "code": 500,
                "message": f"获取车位列表失败: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)