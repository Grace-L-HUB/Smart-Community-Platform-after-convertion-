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