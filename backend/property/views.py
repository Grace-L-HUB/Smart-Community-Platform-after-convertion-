from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import models
from .models import (
    HouseBindingApplication, HouseUserBinding, Visitor,
    ParkingBindingApplication, ParkingUserBinding, Announcement,
    RepairOrder, RepairOrderImage, RepairEmployee, FeeStandard, Bill, AccessLog
)
from .serializers import (
    HouseBindingApplicationSerializer, HouseUserBindingSerializer,
    VisitorCreateSerializer, VisitorListSerializer, VisitorDetailSerializer,
    ParkingBindingApplicationSerializer, ParkingUserBindingSerializer,
    AnnouncementCreateSerializer, AnnouncementListSerializer, AnnouncementDetailSerializer,
    RepairOrderCreateSerializer, RepairOrderListSerializer, RepairOrderDetailSerializer,
    RepairOrderAssignSerializer, RepairOrderCompleteSerializer, RepairOrderRatingSerializer,
    RepairEmployeeSerializer
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
            
            # 查找对应的House记录
            try:
                from .models import Building, House
                building = Building.objects.get(name=application.building_name)
                house = House.objects.get(
                    building=building,
                    unit=application.unit_name,
                    room_number=application.room_number
                )
                
                # 更新房屋状态为已绑定（1=自住, 2=出租）
                house.status = 1 if application.identity == 1 else 2  # 业主=自住，其他=出租
                house.save()
                
                # 创建正式绑定关系，关联House记录
                HouseUserBinding.objects.create(
                    user=application.user,
                    house=house,
                    application=application,
                    identity=application.identity
                )
                
                logger.info(f"房屋绑定申请 {application_id} 已通过审核，房屋 {house} 状态已更新")
                
            except (Building.DoesNotExist, House.DoesNotExist):
                # 如果找不到对应的House记录，仍然创建绑定关系但不关联house
                HouseUserBinding.objects.create(
                    user=application.user,
                    application=application,
                    identity=application.identity
                )
                logger.warning(f"房屋绑定申请 {application_id} 已通过审核，但找不到对应的House记录：{application.building_name}{application.unit_name}{application.room_number}")
            
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
            
            # 查找对应的ParkingSpace记录
            try:
                from .models import ParkingSpace
                parking_space = ParkingSpace.objects.get(
                    area_name=application.parking_area,
                    space_number=application.parking_no
                )
                
                # 更新车位状态为已占用
                parking_space.status = 1  # 已占用
                parking_space.save()
                
                # 创建正式绑定关系，关联ParkingSpace记录
                ParkingUserBinding.objects.create(
                    user=application.user,
                    parking_space=parking_space,
                    application=application,
                    identity=application.identity
                )
                
                logger.info(f"车位绑定申请 {application_id} 已通过审核，车位 {parking_space} 状态已更新")
                
            except ParkingSpace.DoesNotExist:
                # 如果找不到对应的ParkingSpace记录，仍然创建绑定关系但不关联parking_space
                ParkingUserBinding.objects.create(
                    user=application.user,
                    application=application,
                    identity=application.identity
                )
                logger.warning(f"车位绑定申请 {application_id} 已通过审核，但找不到对应的ParkingSpace记录：{application.parking_area}-{application.parking_no}")
            
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
        
        # 更新对应房屋状态为空置
        if binding.house:
            binding.house.status = 3  # 空置状态
            binding.house.save()
            logger.info(f"房屋绑定关系 {binding_id} 已解绑，房屋 {binding.house} 状态已重置为空置")
        else:
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
        
        # 更新对应车位状态为空闲
        if binding.parking_space:
            binding.parking_space.status = 3  # 空闲状态
            binding.parking_space.save()
            logger.info(f"车位绑定关系 {binding_id} 已解绑，车位 {binding.parking_space} 状态已重置为空闲")
        else:
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


class DashboardStatsView(APIView):
    """工作台统计数据接口"""
    permission_classes = []  # 暂时不需要权限认证

    def get(self, request):
        """获取工作台统计数据"""
        try:
            from .models import House, ParkingSpace
            from users.models import User
            from datetime import date, timedelta
            from django.utils import timezone
            
            # 计算统计数据
            total_houses = House.objects.count()
            occupied_houses = HouseUserBinding.objects.filter(status=1).count()
            total_residents = occupied_houses  # 简化：每个绑定房屋算一户
            
            total_parking_spaces = ParkingSpace.objects.count()
            occupied_parking_spaces = ParkingUserBinding.objects.filter(status=1).count()
            
            # 模拟工单数据（实际项目中应该有WorkOrder模型）
            pending_work_orders = 5
            today_repairs = 3
            
            # 模拟费收缴率
            fee_collection_rate = round((occupied_houses / total_houses if total_houses > 0 else 0) * 0.85, 3)
            
            # 近7天数据（模拟）
            today = date.today()
            work_order_trend = []
            for i in range(6, -1, -1):
                target_date = today - timedelta(days=i)
                work_order_trend.append({
                    'date': target_date.strftime('%m-%d'),
                    'count': (i * 2 + 3) % 8 + 1  # 模拟数据
                })
            
            # 报修类型分布（模拟）
            repair_type_distribution = [
                {'type': '水电', 'value': 35},
                {'type': '门窗', 'value': 20},
                {'type': '公区', 'value': 25},
                {'type': '其他', 'value': 20},
            ]
            
            stats = {
                'pendingWorkOrders': pending_work_orders,
                'todayRepairs': today_repairs,
                'totalResidents': total_residents,
                'feeCollectionRate': fee_collection_rate,
                'totalHouses': total_houses,
                'occupiedHouses': occupied_houses,
                'totalParkingSpaces': total_parking_spaces,
                'occupiedParkingSpaces': occupied_parking_spaces,
                'workOrderTrend': work_order_trend,
                'repairTypeDistribution': repair_type_distribution
            }
            
            return Response({
                "code": 200,
                "message": "获取成功",
                "data": stats
            })
            
        except Exception as e:
            logger.error(f"获取统计数据失败: {e}")
            return Response({
                "code": 500,
                "message": f"获取统计数据失败: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EmployeeListView(APIView):
    """员工管理接口"""
    permission_classes = []  # 暂时不需要权限认证
    
    def get(self, request):
        """获取员工列表"""
        try:
            # 获取所有物业人员和管理员
            employees = User.objects.filter(
                role__in=[1, 3]  # 1=物业人员, 3=管理员
            ).values(
                'id', 'real_name', 'phone', 'role', 'is_active', 'created_at'
            )
            
            # 角色映射
            role_map = {
                1: 'service',  # 物业人员 -> 客服
                3: 'admin'     # 管理员
            }
            
            employee_list = []
            for emp in employees:
                employee_list.append({
                    'id': emp['id'],
                    'name': emp['real_name'] or f"用户{emp['id']}",
                    'phone': emp['phone'] or '',
                    'role': role_map.get(emp['role'], 'service'),
                    'status': 'active' if emp['is_active'] else 'inactive',
                    'createdAt': emp['created_at'].strftime('%Y-%m-%d %H:%M:%S')
                })
            
            return Response({
                "code": 200,
                "message": "获取成功",
                "data": employee_list
            })
            
        except Exception as e:
            logger.error(f"获取员工列表失败: {e}")
            return Response({
                "code": 500,
                "message": f"获取员工列表失败: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request):
        """添加员工"""
        try:
            from users.models import User
            
            data = request.data
            name = data.get('name')
            phone = data.get('phone')
            role = data.get('role', 'service')
            
            if not name or not phone:
                return Response({
                    "code": 400,
                    "message": "姓名和手机号不能为空"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 角色映射
            role_map = {
                'admin': 3,
                'service': 1,
                'repair': 1,
                'security': 1
            }
            
            user_role = role_map.get(role, 1)
            
            # 创建用户
            user = User.objects.create_user(
                username=phone,  # 使用手机号作为用户名
                phone=phone,
                real_name=name,
                nickname=name,
                role=user_role,
                is_verified=True,
                password='123456'  # 默认密码
            )
            
            return Response({
                "code": 200,
                "message": "添加成功",
                "data": {
                    'id': user.id,
                    'name': user.real_name,
                    'phone': user.phone,
                    'role': role,
                    'status': 'active',
                    'createdAt': user.created_at.strftime('%Y-%m-%d %H:%M:%S')
                }
            })
            
        except Exception as e:
            logger.error(f"添加员工失败: {e}")
            return Response({
                "code": 500,
                "message": f"添加员工失败: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class HouseBuildingOptionsView(APIView):
    """房屋绑定选项数据API - 获取楼栋列表"""
    permission_classes = []
    
    def get(self, request):
        """获取所有楼栋列表"""
        try:
            from .models import Building
            buildings = Building.objects.all().order_by('id')
            building_list = [building.name for building in buildings]
            
            return Response({
                "code": 200,
                "message": "获取成功",
                "data": building_list
            })
        except Exception as e:
            logger.error(f"获取楼栋列表失败: {e}")
            return Response({
                "code": 500,
                "message": f"获取楼栋列表失败: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class HouseUnitOptionsView(APIView):
    """房屋绑定选项数据API - 获取单元列表"""
    permission_classes = []
    
    def get(self, request):
        """根据楼栋获取单元列表"""
        building_name = request.GET.get('building')
        if not building_name:
            return Response({
                "code": 400,
                "message": "请提供楼栋参数"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from .models import House, Building
            building = Building.objects.get(name=building_name)
            
            # 获取该楼栋下的所有单元（去重）
            units = House.objects.filter(building=building).values_list('unit', flat=True).distinct().order_by('unit')
            unit_list = list(units)
            
            return Response({
                "code": 200,
                "message": "获取成功",
                "data": unit_list
            })
        except Building.DoesNotExist:
            return Response({
                "code": 404,
                "message": "楼栋不存在"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"获取单元列表失败: {e}")
            return Response({
                "code": 500,
                "message": f"获取单元列表失败: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class HouseRoomOptionsView(APIView):
    """房屋绑定选项数据API - 获取房号列表"""
    permission_classes = []
    
    def get(self, request):
        """根据楼栋和单元获取房号列表"""
        building_name = request.GET.get('building')
        unit_name = request.GET.get('unit')
        
        if not building_name or not unit_name:
            return Response({
                "code": 400,
                "message": "请提供楼栋和单元参数"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from .models import House, Building
            building = Building.objects.get(name=building_name)
            
            # 获取该楼栋该单元下的所有房号（去重，并且只返回未绑定的房号）
            rooms = House.objects.filter(
                building=building, 
                unit=unit_name
            ).exclude(
                user_bindings__status=1  # 排除已绑定的房屋
            ).values_list('room_number', flat=True).order_by('room_number')
            room_list = list(rooms)
            
            return Response({
                "code": 200,
                "message": "获取成功",
                "data": room_list
            })
        except Building.DoesNotExist:
            return Response({
                "code": 404,
                "message": "楼栋不存在"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"获取房号列表失败: {e}")
            return Response({
                "code": 500,
                "message": f"获取房号列表失败: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ParkingAreaOptionsView(APIView):
    """车位绑定选项数据API - 获取停车区域列表"""
    permission_classes = []
    
    def get(self, request):
        """获取所有停车区域列表"""
        try:
            from .models import ParkingSpace
            areas = ParkingSpace.objects.values_list('area_name', flat=True).distinct().order_by('area_name')
            area_list = list(areas)
            
            return Response({
                "code": 200,
                "message": "获取成功",
                "data": area_list
            })
        except Exception as e:
            logger.error(f"获取停车区域列表失败: {e}")
            return Response({
                "code": 500,
                "message": f"获取停车区域列表失败: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ParkingSpaceOptionsView(APIView):
    """车位绑定选项数据API - 获取车位号列表"""
    permission_classes = []
    
    def get(self, request):
        """根据停车区域获取车位号列表"""
        area_name = request.GET.get('area')
        if not area_name:
            return Response({
                "code": 400,
                "message": "请提供停车区域参数"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from .models import ParkingSpace
            
            # 获取该区域下的所有车位号（只返回未绑定的车位）
            spaces = ParkingSpace.objects.filter(
                area_name=area_name
            ).exclude(
                user_bindings__status=1  # 排除已绑定的车位
            ).values_list('space_number', flat=True).order_by('space_number')
            space_list = list(spaces)
            
            return Response({
                "code": 200,
                "message": "获取成功",
                "data": space_list
            })
        except Exception as e:
            logger.error(f"获取车位号列表失败: {e}")
            return Response({
                "code": 500,
                "message": f"获取车位号列表失败: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class HouseIdentityOptionsView(APIView):
    """房屋绑定身份选项API - 获取可选身份列表"""
    permission_classes = []
    
    def get(self, request):
        """根据房屋信息获取可选身份列表"""
        building_name = request.GET.get('building')
        unit_name = request.GET.get('unit')
        room_number = request.GET.get('room')
        
        if not all([building_name, unit_name, room_number]):
            return Response({
                "code": 400,
                "message": "请提供完整的房屋信息参数"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from .models import House, Building, HouseUserBinding
            
            # 查找对应房屋
            building = Building.objects.get(name=building_name)
            house = House.objects.get(
                building=building,
                unit=unit_name,
                room_number=room_number
            )
            
            # 检查该房屋是否已有业主绑定
            has_owner = HouseUserBinding.objects.filter(
                house=house,
                identity=1,  # 业主身份
                status=1     # 已绑定状态
            ).exists()
            
            # 根据是否已有业主来决定可选身份
            if has_owner:
                # 已有业主，只能选择家属或租客
                identity_options = [
                    {"value": 2, "label": "家属"},
                    {"value": 3, "label": "租客"}
                ]
            else:
                # 没有业主，可选择所有身份
                identity_options = [
                    {"value": 1, "label": "业主"},
                    {"value": 2, "label": "家属"},
                    {"value": 3, "label": "租客"}
                ]
            
            return Response({
                "code": 200,
                "message": "获取成功",
                "data": {
                    "identities": identity_options,
                    "has_owner": has_owner
                }
            })
            
        except Building.DoesNotExist:
            return Response({
                "code": 404,
                "message": "楼栋不存在"
            }, status=status.HTTP_404_NOT_FOUND)
        except House.DoesNotExist:
            return Response({
                "code": 404,
                "message": "房屋不存在"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"获取房屋身份选项失败: {e}")
            return Response({
                "code": 500,
                "message": f"获取房屋身份选项失败: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ParkingIdentityOptionsView(APIView):
    """车位绑定身份选项API - 获取可选身份列表"""
    permission_classes = []
    
    def get(self, request):
        """获取车位绑定可选身份列表"""
        try:
            # 车位只能选择业主或租客
            identity_options = [
                {"value": 1, "label": "业主"},
                {"value": 3, "label": "租客"}
            ]
            
            return Response({
                "code": 200,
                "message": "获取成功", 
                "data": {
                    "identities": identity_options
                }
            })
        except Exception as e:
            logger.error(f"获取车位身份选项失败: {e}")
            return Response({
                "code": 500,
                "message": f"获取车位身份选项失败: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ===== 公告管理相关视图 =====

class AnnouncementListView(APIView):
    """公告列表接口"""
    permission_classes = []  # 暂时不需要权限认证
    
    def get(self, request):
        """获取公告列表"""
        try:
            announcements = Announcement.objects.all().order_by('-created_at')
            
            from .serializers import AnnouncementListSerializer
            serializer = AnnouncementListSerializer(announcements, many=True)
            
            return Response({
                "code": 200,
                "message": "获取成功",
                "data": serializer.data
            })
            
        except Exception as e:
            logger.error(f"获取公告列表失败: {e}")
            return Response({
                "code": 500,
                "message": f"获取公告列表失败: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AnnouncementCreateView(APIView):
    """公告创建接口"""
    permission_classes = []  # 暂时不需要权限认证
    
    def post(self, request):
        """创建公告"""
        try:
            from .serializers import AnnouncementCreateSerializer
            
            # 获取作者信息
            # TODO: 后续添加JWT认证后，从token获取用户
            user_id = request.data.get('user_id')  # 临时从请求中获取用户ID
            author = None
            author_name = request.data.get('author', '管理员')  # 默认作者名
            
            if user_id:
                try:
                    author = User.objects.get(id=user_id)
                    author_name = author.real_name or author.nickname or f"用户{author.id}"
                except User.DoesNotExist:
                    # 用户不存在时使用默认作者，不报错
                    logger.warning(f"用户ID {user_id} 不存在，使用默认作者")
                    pass
            
            # 验证数据
            serializer = AnnouncementCreateSerializer(data=request.data)
            if serializer.is_valid():
                # 确定状态：如果是发布操作则设为已发布，否则为草稿
                action = request.data.get('action', 'draft')  # draft 或 publish
                status_value = 'published' if action == 'publish' else 'draft'
                
                # 创建公告
                announcement = serializer.save(
                    author=author,
                    author_name=author_name,
                    status=status_value
                )
                
                # 如果是发布操作，设置发布时间
                if status_value == 'published':
                    announcement.published_at = timezone.now()
                    announcement.save()
                
                logger.info(f"用户 {author_name} {'发布' if status_value == 'published' else '保存'}公告: {announcement.title}")
                
                return Response({
                    "code": 200,
                    "message": "发布成功" if status_value == 'published' else "草稿已保存",
                    "data": {
                        "id": announcement.id,
                        "title": announcement.title,
                        "status": announcement.status,
                        "created_at": announcement.created_at.strftime('%Y-%m-%d %H:%M:%S')
                    }
                })
            else:
                return Response({
                    "code": 400,
                    "message": "数据验证失败",
                    "errors": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"创建公告失败: {e}")
            return Response({
                "code": 500,
                "message": f"创建公告失败: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AnnouncementDetailView(APIView):
    """公告详情接口"""
    permission_classes = []
    
    def get(self, request, announcement_id):
        """获取公告详情"""
        try:
            announcement = Announcement.objects.get(id=announcement_id)
            
            from .serializers import AnnouncementDetailSerializer
            serializer = AnnouncementDetailSerializer(announcement)
            
            # 增加阅读次数（只对已发布的公告）
            if announcement.status == 'published':
                announcement.read_count += 1
                announcement.save(update_fields=['read_count'])
            
            return Response({
                "code": 200,
                "message": "获取成功",
                "data": serializer.data
            })
            
        except Announcement.DoesNotExist:
            return Response({
                "code": 404,
                "message": "公告不存在"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"获取公告详情失败: {e}")
            return Response({
                "code": 500,
                "message": f"获取公告详情失败: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AnnouncementUpdateView(APIView):
    """公告更新接口（仅限草稿状态）"""
    permission_classes = []
    
    def put(self, request, announcement_id):
        """更新公告内容"""
        try:
            announcement = Announcement.objects.get(id=announcement_id)
            
            # 只能更新草稿状态的公告
            if announcement.status != 'draft':
                return Response({
                    "code": 400,
                    "message": "只能编辑草稿状态的公告"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            from .serializers import AnnouncementCreateSerializer
            serializer = AnnouncementCreateSerializer(announcement, data=request.data, partial=True)
            
            if serializer.is_valid():
                # 确定操作类型
                action = request.data.get('action', 'save')  # save 或 publish
                
                if action == 'publish':
                    # 发布公告
                    announcement = serializer.save(
                        status='published',
                        published_at=timezone.now()
                    )
                    message = "公告已发布"
                else:
                    # 保存草稿
                    announcement = serializer.save()
                    message = "草稿已保存"
                
                logger.info(f"公告 {announcement_id} 已更新: {announcement.title}")
                
                return Response({
                    "code": 200,
                    "message": message,
                    "data": {
                        "id": announcement.id,
                        "title": announcement.title,
                        "status": announcement.status,
                        "updated_at": announcement.updated_at.strftime('%Y-%m-%d %H:%M:%S')
                    }
                })
            else:
                return Response({
                    "code": 400,
                    "message": "数据验证失败",
                    "errors": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Announcement.DoesNotExist:
            return Response({
                "code": 404,
                "message": "公告不存在"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"更新公告失败: {e}")
            return Response({
                "code": 500,
                "message": f"更新公告失败: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AnnouncementStatusView(APIView):
    """公告状态管理接口"""
    permission_classes = []
    
    def patch(self, request, announcement_id):
        """更新公告状态（发布/撤回）"""
        try:
            announcement = Announcement.objects.get(id=announcement_id)
            action = request.data.get('action')
            
            if action == 'publish':
                if announcement.status != 'draft':
                    return Response({
                        "code": 400,
                        "message": "只能发布草稿状态的公告"
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                announcement.publish()
                message = "公告已发布"
                
            elif action == 'withdraw':
                if announcement.status != 'published':
                    return Response({
                        "code": 400,
                        "message": "只能撤回已发布的公告"
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                announcement.withdraw()
                message = "公告已撤回"
                
            else:
                return Response({
                    "code": 400,
                    "message": "无效的操作类型"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            logger.info(f"公告 {announcement_id} 状态已更新为: {announcement.status}")
            
            return Response({
                "code": 200,
                "message": message,
                "data": {
                    "id": announcement.id,
                    "status": announcement.status,
                    "updated_at": announcement.updated_at.strftime('%Y-%m-%d %H:%M:%S')
                }
            })
            
        except Announcement.DoesNotExist:
            return Response({
                "code": 404,
                "message": "公告不存在"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"更新公告状态失败: {e}")
            return Response({
                "code": 500,
                "message": f"更新公告状态失败: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AnnouncementDeleteView(APIView):
    """公告删除接口"""
    permission_classes = []
    
    def delete(self, request, announcement_id):
        """删除公告（硬删除）"""
        try:
            announcement = Announcement.objects.get(id=announcement_id)
            
            # 记录删除信息
            title = announcement.title
            status = announcement.status
            
            # 删除公告
            announcement.delete()
            
            logger.info(f"公告已删除: {title} (状态: {status})")
            
            return Response({
                "code": 200,
                "message": "公告已删除"
            })
            
        except Announcement.DoesNotExist:
            return Response({
                "code": 404,
                "message": "公告不存在"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"删除公告失败: {e}")
            return Response({
                "code": 500,
                "message": f"删除公告失败: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AnnouncementCategoryOptionsView(APIView):
    """公告分类选项API"""
    permission_classes = []
    
    def get(self, request):
        """获取公告分类选项"""
        try:
            from .models import Announcement
            
            # 获取分类选项
            category_options = []
            for value, label in Announcement.CATEGORY_CHOICES:
                category_options.append({
                    "value": value,
                    "label": label
                })
            
            return Response({
                "code": 200,
                "message": "获取成功",
                "data": {
                    "categories": category_options
                }
            })
        except Exception as e:
            logger.error(f"获取公告分类选项失败: {e}")
            return Response({
                "code": 500,
                "message": f"获取公告分类选项失败: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ===== 报修工单相关视图 =====

class RepairOrderView(APIView):
    """报修工单接口"""
    permission_classes = []  # 暂时不需要权限认证

    def post(self, request):
        """提交报修工单"""
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

        try:
            serializer = RepairOrderCreateSerializer(data=request.data)
            if serializer.is_valid():
                # 设置报修人
                repair_order = serializer.save(reporter=user)
                
                # 返回创建的工单详情
                detail_serializer = RepairOrderDetailSerializer(repair_order)
                return Response({
                    "code": 200,
                    "message": "报修工单提交成功",
                    "data": detail_serializer.data
                })
            else:
                return Response({
                    "code": 400,
                    "message": "数据验证失败",
                    "errors": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"提交报修工单失败: {e}")
            return Response({
                "code": 500,
                "message": f"提交报修工单失败: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def get(self, request):
        """获取报修工单列表"""
        try:
            # 获取筛选参数
            status_filter = request.GET.get('status')
            type_filter = request.GET.get('type')
            keyword = request.GET.get('keyword', '').strip()
            user_id = request.GET.get('user_id')  # 用于筛选用户自己的工单
            
            # 构建查询条件
            queryset = RepairOrder.objects.all()
            
            if status_filter:
                queryset = queryset.filter(status=status_filter)
            
            if type_filter:
                queryset = queryset.filter(repair_type=type_filter)
            
            if keyword:
                queryset = queryset.filter(
                    models.Q(order_no__icontains=keyword) |
                    models.Q(reporter_name__icontains=keyword) |
                    models.Q(location__icontains=keyword) |
                    models.Q(summary__icontains=keyword)
                )
            
            if user_id:
                queryset = queryset.filter(reporter_id=user_id)
            
            # 排序
            queryset = queryset.order_by('-created_at')
            
            # 分页
            page = int(request.GET.get('page', 1))
            page_size = int(request.GET.get('page_size', 10))
            start = (page - 1) * page_size
            end = start + page_size
            
            total = queryset.count()
            orders = queryset[start:end]
            
            serializer = RepairOrderListSerializer(orders, many=True)
            
            return Response({
                "code": 200,
                "message": "获取成功",
                "data": {
                    "list": serializer.data,
                    "total": total,
                    "page": page,
                    "page_size": page_size,
                    "total_pages": (total + page_size - 1) // page_size
                }
            })
        except Exception as e:
            logger.error(f"获取报修工单列表失败: {e}")
            return Response({
                "code": 500,
                "message": f"获取报修工单列表失败: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RepairOrderDetailView(APIView):
    """报修工单详情接口"""
    permission_classes = []

    def get(self, request, order_id):
        """获取工单详情"""
        try:
            order = RepairOrder.objects.get(id=order_id)
            serializer = RepairOrderDetailSerializer(order)
            
            return Response({
                "code": 200,
                "message": "获取成功",
                "data": serializer.data
            })
        except RepairOrder.DoesNotExist:
            return Response({
                "code": 404,
                "message": "工单不存在"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"获取工单详情失败: {e}")
            return Response({
                "code": 500,
                "message": f"获取工单详情失败: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RepairOrderAssignView(APIView):
    """工单派单接口"""
    permission_classes = []

    def post(self, request, order_id):
        """派单"""
        try:
            order = RepairOrder.objects.get(id=order_id)
            
            if order.status != 'pending':
                return Response({
                    "code": 400,
                    "message": "只能对待受理的工单进行派单"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            serializer = RepairOrderAssignSerializer(data=request.data)
            if serializer.is_valid():
                assignee = serializer.validated_data['assignee']
                
                # TODO: 后续从JWT获取当前用户
                assigned_by_user_id = request.data.get('assigned_by_user_id')
                assigned_by_user = None
                if assigned_by_user_id:
                    try:
                        assigned_by_user = User.objects.get(id=assigned_by_user_id)
                    except User.DoesNotExist:
                        pass
                
                # 执行派单
                order.assign_to(assignee, assigned_by_user)
                
                # 返回更新后的工单信息
                detail_serializer = RepairOrderDetailSerializer(order)
                return Response({
                    "code": 200,
                    "message": "派单成功",
                    "data": detail_serializer.data
                })
            else:
                return Response({
                    "code": 400,
                    "message": "数据验证失败",
                    "errors": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
        except RepairOrder.DoesNotExist:
            return Response({
                "code": 404,
                "message": "工单不存在"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"派单失败: {e}")
            return Response({
                "code": 500,
                "message": f"派单失败: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RepairOrderCompleteView(APIView):
    """工单完成接口"""
    permission_classes = []

    def post(self, request, order_id):
        """完成工单"""
        try:
            order = RepairOrder.objects.get(id=order_id)
            
            if order.status != 'processing':
                return Response({
                    "code": 400,
                    "message": "只能完成处理中的工单"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            serializer = RepairOrderCompleteSerializer(data=request.data)
            if serializer.is_valid():
                result = serializer.validated_data['result']
                cost = serializer.validated_data.get('cost')
                
                # 完成工单
                order.complete_order(result, cost)
                
                # 返回更新后的工单信息
                detail_serializer = RepairOrderDetailSerializer(order)
                return Response({
                    "code": 200,
                    "message": "工单已完成",
                    "data": detail_serializer.data
                })
            else:
                return Response({
                    "code": 400,
                    "message": "数据验证失败",
                    "errors": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
        except RepairOrder.DoesNotExist:
            return Response({
                "code": 404,
                "message": "工单不存在"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"完成工单失败: {e}")
            return Response({
                "code": 500,
                "message": f"完成工单失败: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RepairOrderRejectView(APIView):
    """工单驳回接口"""
    permission_classes = []

    def post(self, request, order_id):
        """驳回工单"""
        try:
            order = RepairOrder.objects.get(id=order_id)
            
            if order.status != 'pending':
                return Response({
                    "code": 400,
                    "message": "只能驳回待受理的工单"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 驳回工单
            order.reject_order()
            
            # 返回更新后的工单信息
            detail_serializer = RepairOrderDetailSerializer(order)
            return Response({
                "code": 200,
                "message": "工单已驳回",
                "data": detail_serializer.data
            })
        except RepairOrder.DoesNotExist:
            return Response({
                "code": 404,
                "message": "工单不存在"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"驳回工单失败: {e}")
            return Response({
                "code": 500,
                "message": f"驳回工单失败: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RepairOrderRatingView(APIView):
    """工单评价接口"""
    permission_classes = []

    def post(self, request, order_id):
        """评价工单"""
        try:
            order = RepairOrder.objects.get(id=order_id)
            
            if order.status != 'completed':
                return Response({
                    "code": 400,
                    "message": "只能对已完成的工单进行评价"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if order.is_rated:
                return Response({
                    "code": 400,
                    "message": "该工单已经评价过了"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            serializer = RepairOrderRatingSerializer(data=request.data)
            if serializer.is_valid():
                rating = serializer.validated_data['rating']
                comment = serializer.validated_data.get('comment', '')
                
                # 保存评价
                order.rating = rating
                order.rating_comment = comment
                order.is_rated = True
                order.rated_at = timezone.now()
                order.save()
                
                # 返回更新后的工单信息
                detail_serializer = RepairOrderDetailSerializer(order)
                return Response({
                    "code": 200,
                    "message": "评价成功",
                    "data": detail_serializer.data
                })
            else:
                return Response({
                    "code": 400,
                    "message": "数据验证失败",
                    "errors": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
        except RepairOrder.DoesNotExist:
            return Response({
                "code": 404,
                "message": "工单不存在"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"评价工单失败: {e}")
            return Response({
                "code": 500,
                "message": f"评价工单失败: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RepairEmployeeView(APIView):
    """维修人员接口"""
    permission_classes = []

    def get(self, request):
        """获取维修人员列表"""
        try:
            employees = RepairEmployee.objects.filter(is_active=True).order_by('name')
            serializer = RepairEmployeeSerializer(employees, many=True)
            
            return Response({
                "code": 200,
                "message": "获取成功",
                "data": serializer.data
            })
        except Exception as e:
            logger.error(f"获取维修人员列表失败: {e}")
            return Response({
                "code": 500,
                "message": f"获取维修人员列表失败: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RepairOrderOptionsView(APIView):
    """报修工单选项接口"""
    permission_classes = []

    def get(self, request):
        """获取报修相关的选项数据"""
        try:
            # 报修类型选项
            type_options = [
                {"label": label, "value": value}
                for value, label in RepairOrder.TYPE_CHOICES
            ]
            
            # 紧急程度选项
            priority_options = [
                {"label": label, "value": value}
                for value, label in RepairOrder.PRIORITY_CHOICES
            ]
            
            # 报修类别选项
            category_options = [
                {"label": label, "value": value}
                for value, label in RepairOrder.REPAIR_CATEGORY_CHOICES
            ]
            
            # 工单状态选项
            status_options = [
                {"label": label, "value": value}
                for value, label in RepairOrder.STATUS_CHOICES
            ]
            
            return Response({
                "code": 200,
                "message": "获取成功",
                "data": {
                    "types": type_options,
                    "priorities": priority_options,
                    "categories": category_options,
                    "statuses": status_options
                }
            })
        except Exception as e:
            logger.error(f"获取报修选项失败: {e}")
            return Response({
                "code": 500,
                "message": f"获取报修选项失败: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DashboardStatsView(APIView):
    """Dashboard统计数据接口"""
    permission_classes = []

    def get(self, request):
        """获取Dashboard统计数据"""
        try:
            from datetime import datetime, timedelta
            from django.db.models import Count, Q
            from django.utils import timezone
            
            now = timezone.now()
            today = now.date()
            
            # 1. 待处理工单数量
            pending_work_orders = RepairOrder.objects.filter(status='pending').count()
            
            # 2. 今日报修数量
            today_repairs = RepairOrder.objects.filter(
                created_at__date=today
            ).count()
            
            # 3. 总住户数量
            from .models import HouseUserBinding
            total_residents = HouseUserBinding.objects.filter(status=1).count()
            
            # 4. 物业费收缴率 (模拟数据，实际需要根据账单系统计算)
            fee_collection_rate = 0.856  # 85.6%
            
            # 5. 近7天工单趋势
            work_order_trend = []
            for i in range(6, -1, -1):  # 从6天前到今天
                date = today - timedelta(days=i)
                count = RepairOrder.objects.filter(created_at__date=date).count()
                work_order_trend.append({
                    'date': date.strftime('%m-%d'),
                    'count': count
                })
            
            # 6. 报修类型分布
            type_distribution = RepairOrder.objects.values('repair_type').annotate(
                count=Count('id')
            ).order_by('-count')
            
            # 转换为前端需要的格式
            type_names = {
                'water': '水电',
                'electric': '电气', 
                'door': '门窗',
                'public': '公区',
                'other': '其他'
            }
            
            repair_type_distribution = []
            for item in type_distribution:
                repair_type_distribution.append({
                    'type': type_names.get(item['repair_type'], item['repair_type']),
                    'value': item['count']
                })
            
            # 如果没有数据，提供默认值
            if not repair_type_distribution:
                repair_type_distribution = [
                    {'type': '水电', 'value': 0},
                    {'type': '电气', 'value': 0}, 
                    {'type': '门窗', 'value': 0},
                    {'type': '公区', 'value': 0},
                    {'type': '其他', 'value': 0}
                ]
            
            stats_data = {
                'pendingWorkOrders': pending_work_orders,
                'todayRepairs': today_repairs,
                'totalResidents': total_residents,
                'feeCollectionRate': fee_collection_rate,
                'workOrderTrend': work_order_trend,
                'repairTypeDistribution': repair_type_distribution
            }
            
            return Response({
                "code": 200,
                "message": "获取成功",
                "data": stats_data
            })
            
        except Exception as e:
            logger.error(f"获取Dashboard统计数据失败: {e}")
            return Response({
                "code": 500,
                "message": f"获取Dashboard统计数据失败: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ===== 缴费管理相关视图 =====

class FeeStandardView(APIView):
    """收费标准管理接口"""
    permission_classes = []

    def get(self, request):
        """获取收费标准列表"""
        try:
            standards = FeeStandard.objects.filter(is_active=True).order_by('-created_at')
            from .serializers import FeeStandardSerializer
            serializer = FeeStandardSerializer(standards, many=True)
            
            return Response({
                "code": 200,
                "message": "获取成功",
                "data": serializer.data
            })
        except Exception as e:
            logger.error(f"获取收费标准列表失败: {e}")
            return Response({
                "code": 500,
                "message": f"获取收费标准列表失败: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        """创建收费标准"""
        try:
            from .serializers import FeeStandardSerializer
            serializer = FeeStandardSerializer(data=request.data)
            if serializer.is_valid():
                fee_standard = serializer.save()
                return Response({
                    "code": 200,
                    "message": "创建成功",
                    "data": FeeStandardSerializer(fee_standard).data
                })
            else:
                return Response({
                    "code": 400,
                    "message": "数据验证失败",
                    "errors": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"创建收费标准失败: {e}")
            return Response({
                "code": 500,
                "message": f"创建收费标准失败: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BillBatchGenerateView(APIView):
    """账单批量生成接口"""
    permission_classes = []

    def post(self, request):
        """批量生成账单"""
        try:
            from .serializers import BillCreateSerializer
            from datetime import date, timedelta
            from decimal import Decimal
            
            serializer = BillCreateSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    "code": 400,
                    "message": "数据验证失败",
                    "errors": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)

            validated_data = serializer.validated_data
            fee_type = validated_data['fee_type']
            billing_year = validated_data['billing_year']
            billing_month = validated_data['billing_month']
            fee_standard_id = validated_data['fee_standard_id']
            target_buildings = validated_data.get('target_buildings', [])

            # 获取收费标准
            try:
                fee_standard = FeeStandard.objects.get(id=fee_standard_id)
            except FeeStandard.DoesNotExist:
                return Response({
                    "code": 404,
                    "message": "收费标准不存在"
                }, status=status.HTTP_404_NOT_FOUND)

            # 计算计费周期
            billing_period_start = date(billing_year, billing_month, 1)
            # 计算月末日期
            if billing_month == 12:
                next_month = date(billing_year + 1, 1, 1)
            else:
                next_month = date(billing_year, billing_month + 1, 1)
            billing_period_end = next_month - timedelta(days=1)

            # 设置缴费截止日期（次月15日）
            if billing_month == 12:
                due_date = date(billing_year + 1, 1, 15)
            else:
                due_date = date(billing_year, billing_month + 1, 15)

            # 查询要生成账单的房屋
            from .models import Building, House
            houses_query = House.objects.all()
            
            # 如果指定了楼栋，只生成指定楼栋的账单
            if target_buildings:
                buildings = Building.objects.filter(name__in=target_buildings)
                houses_query = houses_query.filter(building__in=buildings)
            
            # 只为已绑定业主的房屋生成账单
            houses = houses_query.filter(
                user_bindings__status=1,  # 已绑定状态
                user_bindings__identity=1  # 业主身份
            ).distinct()

            # 检查是否已经生成过该期间的账单
            existing_bills = Bill.objects.filter(
                house__in=houses,
                fee_type=fee_type,
                billing_period_start=billing_period_start,
                billing_period_end=billing_period_end
            )
            if existing_bills.exists():
                return Response({
                    "code": 400,
                    "message": f"{billing_year}年{billing_month}月的{fee_standard.get_fee_type_display()}账单已存在"
                }, status=status.HTTP_400_BAD_REQUEST)

            # 批量创建账单
            bills_to_create = []
            generated_bill_nos = set()  # 用于确保账单号不重复
            
            for house in houses:
                # 获取该房屋的业主
                binding = house.user_bindings.filter(status=1, identity=1).first()
                if not binding:
                    continue
                
                user = binding.user
                
                # 计算费用
                if fee_standard.billing_unit == 'per_sqm_month':
                    quantity = house.area
                    amount = quantity * fee_standard.unit_price
                elif fee_standard.billing_unit == 'per_month':
                    quantity = Decimal('1')
                    amount = fee_standard.unit_price
                else:
                    # 其他计费方式暂时按固定金额处理
                    quantity = Decimal('1')
                    amount = fee_standard.unit_price

                # 生成账单号（因为bulk_create不会调用save方法）
                import datetime
                import random
                today = datetime.date.today()
                date_str = today.strftime('%Y%m%d')
                
                # 生成唯一账单号
                bill_no = None
                max_attempts = 100  # 防止无限循环
                attempts = 0
                
                while attempts < max_attempts:
                    random_num = random.randint(10000000, 99999999)
                    bill_no = f'BILL{date_str}{random_num}'
                    
                    # 检查数据库和当前批次中是否重复
                    if (not Bill.objects.filter(bill_no=bill_no).exists() and 
                        bill_no not in generated_bill_nos):
                        generated_bill_nos.add(bill_no)
                        break
                    attempts += 1
                
                if attempts >= max_attempts:
                    logger.error(f"生成账单号失败，超过最大尝试次数")
                    continue

                bill = Bill(
                    bill_no=bill_no,
                    title=f"{billing_year}年{billing_month}月{fee_standard.get_fee_type_display()}",
                    fee_type=fee_type,
                    house=house,
                    user=user,
                    fee_standard=fee_standard,
                    billing_period_start=billing_period_start,
                    billing_period_end=billing_period_end,
                    unit_price=fee_standard.unit_price,
                    quantity=quantity,
                    amount=amount,
                    due_date=due_date,
                    description=f"房屋地址：{house}，计费面积：{quantity}平米"
                )
                bills_to_create.append(bill)

            # 批量创建
            if bills_to_create:
                print(f"准备批量创建{len(bills_to_create)}张账单")
                
                # 验证所有账单号都不为空且唯一
                bill_nos = [bill.bill_no for bill in bills_to_create]
                print(f"生成的账单号样例: {bill_nos[:5]}")
                
                if '' in bill_nos or None in bill_nos:
                    logger.error("发现空账单号，取消批量创建")
                    return Response({
                        "code": 500,
                        "message": "账单号生成失败"
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                Bill.objects.bulk_create(bills_to_create)
                logger.info(f"成功生成{len(bills_to_create)}张{fee_standard.get_fee_type_display()}账单")
                
                return Response({
                    "code": 200,
                    "message": f"成功生成{len(bills_to_create)}张账单",
                    "data": {
                        "generated_count": len(bills_to_create),
                        "fee_type": fee_standard.get_fee_type_display(),
                        "period": f"{billing_year}年{billing_month}月"
                    }
                })
            else:
                return Response({
                    "code": 400,
                    "message": "没有符合条件的房屋可以生成账单"
                }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"批量生成账单失败: {e}")
            return Response({
                "code": 500,
                "message": f"批量生成账单失败: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BillListView(APIView):
    """账单列表接口"""
    permission_classes = []

    def get(self, request):
        """获取账单列表"""
        try:
            # 获取筛选参数
            fee_type = request.GET.get('fee_type')
            status_filter = request.GET.get('status')
            user_id = request.GET.get('user_id')
            building = request.GET.get('building')
            is_overdue = request.GET.get('is_overdue')
            
            # 添加调试日志
            print(f"=== 账单筛选参数 ===")
            print(f"fee_type: '{fee_type}'")
            print(f"status_filter: '{status_filter}'")
            print(f"user_id: {user_id}")
            print(f"building: {building}")
            print(f"is_overdue: {is_overdue}")
            
            # 构建查询条件
            queryset = Bill.objects.select_related('house__building', 'user', 'fee_standard').all()
            
            print(f"初始查询数量: {queryset.count()}")
            
            # 查看数据库中实际的fee_type值
            all_fee_types = Bill.objects.values_list('fee_type', flat=True).distinct()
            print(f"数据库中的所有fee_type值: {list(all_fee_types)}")
            
            if fee_type:
                queryset = queryset.filter(fee_type=fee_type)
                print(f"fee_type='{fee_type}'筛选后数量: {queryset.count()}")
            
            if status_filter:
                queryset = queryset.filter(status=status_filter)
                print(f"status='{status_filter}'筛选后数量: {queryset.count()}")
                # 调试：查看所有可能的status值
                all_statuses = Bill.objects.values_list('status', flat=True).distinct()
                print(f"数据库中的所有status值: {list(all_statuses)}")
            
            if user_id:
                queryset = queryset.filter(user_id=user_id)
                print(f"user_id筛选后数量: {queryset.count()}")
            
            if building:
                queryset = queryset.filter(house__building__name=building)
                print(f"building筛选后数量: {queryset.count()}")
            
            if is_overdue == 'true':
                from django.utils import timezone
                queryset = queryset.filter(status='unpaid', due_date__lt=timezone.now().date())
                print(f"overdue筛选后数量: {queryset.count()}")
            
            # 分页
            page = int(request.GET.get('page', 1))
            page_size = int(request.GET.get('page_size', 20))
            start = (page - 1) * page_size
            end = start + page_size
            
            total = queryset.count()
            bills = queryset.order_by('-created_at')[start:end]
            
            from .serializers import BillListSerializer
            serializer = BillListSerializer(bills, many=True)
            
            return Response({
                "code": 200,
                "message": "获取成功",
                "data": {
                    "list": serializer.data,
                    "total": total,
                    "page": page,
                    "page_size": page_size,
                    "total_pages": (total + page_size - 1) // page_size
                }
            })
            
        except Exception as e:
            logger.error(f"获取账单列表失败: {e}")
            return Response({
                "code": 500,
                "message": f"获取账单列表失败: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BillDetailView(APIView):
    """账单详情接口"""
    permission_classes = []

    def get(self, request, bill_id):
        """获取账单详情"""
        try:
            bill = Bill.objects.select_related('house__building', 'user', 'fee_standard').get(id=bill_id)
            from .serializers import BillDetailSerializer
            serializer = BillDetailSerializer(bill)
            
            return Response({
                "code": 200,
                "message": "获取成功",
                "data": serializer.data
            })
        except Bill.DoesNotExist:
            return Response({
                "code": 404,
                "message": "账单不存在"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"获取账单详情失败: {e}")
            return Response({
                "code": 500,
                "message": f"获取账单详情失败: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BillPaymentView(APIView):
    """账单支付接口（模拟支付）"""
    permission_classes = []

    def post(self, request, bill_id):
        """支付账单（模拟支付）"""
        try:
            bill = Bill.objects.get(id=bill_id)
            
            if bill.status != 'unpaid':
                return Response({
                    "code": 400,
                    "message": "该账单已支付或状态不允许支付"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            from .serializers import BillPaymentSerializer
            serializer = BillPaymentSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    "code": 400,
                    "message": "数据验证失败",
                    "errors": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)

            payment_method = serializer.validated_data['payment_method']
            payment_reference = serializer.validated_data.get('payment_reference', '')
            
            # 生成模拟的支付流水号
            if not payment_reference:
                import random
                import datetime
                now = datetime.datetime.now()
                payment_reference = f"{payment_method.upper()}{now.strftime('%Y%m%d%H%M%S')}{random.randint(1000, 9999)}"
            
            # 标记为已支付
            bill.mark_as_paid(payment_method, payment_reference)
            
            logger.info(f"账单 {bill.bill_no} 支付成功，支付方式：{payment_method}，流水号：{payment_reference}")
            
            # 返回支付成功结果
            from .serializers import BillDetailSerializer
            serializer = BillDetailSerializer(bill)
            
            return Response({
                "code": 200,
                "message": "支付成功",
                "data": {
                    "bill_info": serializer.data,
                    "payment_info": {
                        "payment_method": payment_method,
                        "payment_reference": payment_reference,
                        "paid_amount": str(bill.paid_amount),
                        "paid_at": bill.paid_at.strftime('%Y-%m-%d %H:%M:%S')
                    }
                }
            })
        except Bill.DoesNotExist:
            return Response({
                "code": 404,
                "message": "账单不存在"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"支付账单失败: {e}")
            return Response({
                "code": 500,
                "message": f"支付账单失败: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BillReminderView(APIView):
    """账单催缴接口"""
    permission_classes = []

    def post(self, request):
        """批量发送催缴通知"""
        try:
            from .serializers import ReminderBatchSerializer
            from users.models import Notification
            
            serializer = ReminderBatchSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    "code": 400,
                    "message": "数据验证失败",
                    "errors": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)

            bill_ids = serializer.validated_data['bill_ids']
            message_template = serializer.validated_data['message_template']
            
            # 获取未支付的账单
            bills = Bill.objects.filter(id__in=bill_ids, status='unpaid').select_related('user', 'house')
            
            notifications_to_create = []
            for bill in bills:
                # 构建催缴消息内容
                house_info = f"{bill.house}" if bill.house else "您的房屋"
                content = f"尊敬的业主，{house_info}的{bill.get_fee_type_display()}（{bill.get_period_display()}）尚未缴费，" \
                         f"金额￥{bill.amount}，请于{bill.due_date}前完成缴费。{message_template}"
                
                notification = Notification(
                    title="缴费催收通知",
                    content=content,
                    notification_type='bill_reminder',
                    recipient=bill.user,
                    related_object_type='bill',
                    related_object_id=bill.id
                )
                notifications_to_create.append(notification)
            
            # 批量创建通知
            if notifications_to_create:
                Notification.objects.bulk_create(notifications_to_create)
                logger.info(f"成功发送{len(notifications_to_create)}条催缴通知")
                
                return Response({
                    "code": 200,
                    "message": f"成功发送{len(notifications_to_create)}条催缴通知"
                })
            else:
                return Response({
                    "code": 400,
                    "message": "没有符合条件的账单可以催缴"
                }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"发送催缴通知失败: {e}")
            return Response({
                "code": 500,
                "message": f"发送催缴通知失败: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BillReceiptView(APIView):
    """电子缴费凭证接口"""
    permission_classes = []

    def get(self, request, bill_id):
        """获取电子缴费凭证"""
        try:
            bill = Bill.objects.select_related('house__building', 'user', 'fee_standard').get(id=bill_id)
            
            if bill.status != 'paid':
                return Response({
                    "code": 400,
                    "message": "该账单尚未支付，无法生成缴费凭证"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 构建电子凭证数据
            receipt_data = {
                "bill_info": {
                    "bill_no": bill.bill_no,
                    "title": bill.title,
                    "fee_type": bill.get_fee_type_display(),
                    "amount": str(bill.amount),
                    "paid_amount": str(bill.paid_amount),
                    "payment_method": bill.get_payment_method_display(),
                    "payment_reference": bill.payment_reference,
                    "paid_at": bill.paid_at.strftime('%Y年%m月%d日 %H:%M:%S'),
                    "period": bill.get_period_display()
                },
                "payer_info": {
                    "name": bill.user.real_name or bill.user.nickname or f"用户{bill.user.id}",
                    "phone": bill.user.phone or ''
                },
                "property_info": {
                    "address": str(bill.house) if bill.house else '',
                    "area": str(bill.house.area) if bill.house else '',
                    "unit_price": str(bill.unit_price),
                    "quantity": str(bill.quantity)
                },
                "receipt_info": {
                    "receipt_no": f"RC{bill.bill_no[4:]}",  # 去掉BILL前缀，改为RC
                    "generated_at": timezone.now().strftime('%Y年%m月%d日 %H:%M:%S'),
                    "status": "已支付",
                    "seal_text": "电子缴费凭证"
                }
            }
            
            return Response({
                "code": 200,
                "message": "获取成功",
                "data": receipt_data
            })
            
        except Bill.DoesNotExist:
            return Response({
                "code": 404,
                "message": "账单不存在"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"获取电子凭证失败: {e}")
            return Response({
                "code": 500,
                "message": f"获取电子凭证失败: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BillStatsView(APIView):
    """账单统计接口"""
    permission_classes = []

    def get(self, request):
        """获取账单统计数据"""
        try:
            from django.db.models import Sum, Count, Q
            from django.utils import timezone
            
            # 基础统计
            total_bills = Bill.objects.count()
            paid_bills = Bill.objects.filter(status='paid').count()
            unpaid_bills = Bill.objects.filter(status='unpaid').count()
            overdue_bills = Bill.objects.filter(
                status='unpaid', 
                due_date__lt=timezone.now().date()
            ).count()
            
            # 金额统计
            total_amount = Bill.objects.aggregate(
                total=Sum('amount')
            )['total'] or 0
            
            paid_amount = Bill.objects.filter(status='paid').aggregate(
                total=Sum('paid_amount')
            )['total'] or 0
            
            unpaid_amount = Bill.objects.filter(status='unpaid').aggregate(
                total=Sum('amount')
            )['total'] or 0
            
            # 按费用类型统计
            type_stats = Bill.objects.values('fee_type').annotate(
                total_count=Count('id'),
                paid_count=Count('id', filter=Q(status='paid')),
                total_amount=Sum('amount'),
                paid_amount=Sum('paid_amount', filter=Q(status='paid'))
            )
            
            # 转换为前端需要的格式
            fee_type_distribution = []
            for stat in type_stats:
                fee_type_display = dict(Bill.FEE_TYPE_CHOICES).get(stat['fee_type'], stat['fee_type'])
                fee_type_distribution.append({
                    'type': fee_type_display,
                    'total_count': stat['total_count'],
                    'paid_count': stat['paid_count'] or 0,
                    'unpaid_count': stat['total_count'] - (stat['paid_count'] or 0),
                    'total_amount': float(stat['total_amount'] or 0),
                    'paid_amount': float(stat['paid_amount'] or 0),
                    'collection_rate': round((stat['paid_count'] or 0) / stat['total_count'] * 100, 2) if stat['total_count'] > 0 else 0
                })
            
            stats_data = {
                'total_bills': total_bills,
                'paid_bills': paid_bills,
                'unpaid_bills': unpaid_bills,
                'overdue_bills': overdue_bills,
                'total_amount': float(total_amount),
                'paid_amount': float(paid_amount),
                'unpaid_amount': float(unpaid_amount),
                'collection_rate': round(paid_bills / total_bills * 100, 2) if total_bills > 0 else 0,
                'fee_type_distribution': fee_type_distribution
            }
            
            return Response({
                "code": 200,
                "message": "获取成功",
                "data": stats_data
            })
            
        except Exception as e:
            logger.error(f"获取账单统计数据失败: {e}")
            return Response({
                "code": 500,
                "message": f"获取账单统计数据失败: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ===== 门禁日志相关视图 =====

class AccessLogView(APIView):
    """门禁日志接口"""
    permission_classes = []  # 暂时不需要权限认证

    def get(self, request):
        """获取门禁日志列表"""
        try:
            # 获取筛选参数
            method_filter = request.GET.get('method')  # 开门方式筛选
            location_filter = request.GET.get('location')  # 位置筛选
            keyword = request.GET.get('keyword', '').strip()  # 人员姓名搜索
            start_date = request.GET.get('start_date')  # 开始日期
            end_date = request.GET.get('end_date')  # 结束日期
            person_type = request.GET.get('person_type')  # 人员类型

            # 构建查询条件
            queryset = AccessLog.objects.all()

            # 开门方式筛选
            if method_filter:
                queryset = queryset.filter(method=method_filter)

            # 位置筛选
            if location_filter:
                queryset = queryset.filter(location=location_filter)

            # 人员姓名搜索
            if keyword:
                queryset = queryset.filter(person_name__icontains=keyword)

            # 日期范围筛选
            if start_date:
                queryset = queryset.filter(timestamp__date__gte=start_date)

            if end_date:
                queryset = queryset.filter(timestamp__date__lte=end_date)

            # 人员类型筛选
            if person_type:
                queryset = queryset.filter(person_type=person_type)

            # 只显示成功的记录
            queryset = queryset.filter(success=True)

            # 排序（最新的在前）
            queryset = queryset.order_by('-timestamp')

            # 分页
            page = int(request.GET.get('page', 1))
            page_size = int(request.GET.get('page_size', 50))
            start = (page - 1) * page_size
            end = start + page_size

            total = queryset.count()
            logs = queryset[start:end]

            # 使用前端期望的序列化器
            from .serializers import AccessLogListSerializer
            serializer = AccessLogListSerializer(logs, many=True)

            return Response({
                "code": 200,
                "message": "获取成功",
                "data": {
                    "list": serializer.data,
                    "total": total,
                    "page": page,
                    "page_size": page_size,
                    "total_pages": (total + page_size - 1) // page_size
                }
            })

        except Exception as e:
            logger.error(f"获取门禁日志列表失败: {e}")
            return Response({
                "code": 500,
                "message": f"获取门禁日志列表失败: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        """创建门禁日志记录（设备上报）"""
        try:
            from .serializers import AccessLogCreateSerializer
            serializer = AccessLogCreateSerializer(data=request.data)

            if serializer.is_valid():
                access_log = serializer.save()

                # 返回创建成功的日志信息
                from .serializers import AccessLogListSerializer
                response_serializer = AccessLogListSerializer(access_log)

                logger.info(f"门禁日志记录创建成功: {access_log.person_name} - {access_log.location}")

                return Response({
                    "code": 200,
                    "message": "记录创建成功",
                    "data": response_serializer.data
                })
            else:
                return Response({
                    "code": 400,
                    "message": "数据验证失败",
                    "errors": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"创建门禁日志失败: {e}")
            return Response({
                "code": 500,
                "message": f"创建门禁日志失败: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AccessLogStatisticsView(APIView):
    """门禁日志统计接口"""
    permission_classes = []

    def get(self, request):
        """获取门禁日志统计数据"""
        try:
            from datetime import datetime, timedelta
            from django.db.models import Count
            from django.utils import timezone

            # 获取统计参数
            days = int(request.GET.get('days', 7))  # 默认统计最近7天
            start_date = request.GET.get('start_date')
            end_date = request.GET.get('end_date')

            # 确定统计时间范围
            if start_date and end_date:
                # 使用指定日期范围
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            else:
                # 使用最近N天
                end_date = timezone.now().date()
                start_date = end_date - timedelta(days=days-1)

            # 1. 今日记录数
            today = timezone.now().date()
            today_count = AccessLog.objects.filter(
                timestamp__date=today,
                success=True
            ).count()

            # 2. 总记录数（在统计范围内）
            total_count = AccessLog.objects.filter(
                timestamp__date__gte=start_date,
                timestamp__date__lte=end_date,
                success=True
            ).count()

            # 3. 按开门方式统计
            method_stats = AccessLog.objects.filter(
                timestamp__date__gte=start_date,
                timestamp__date__lte=end_date,
                success=True
            ).values('method').annotate(count=Count('id')).order_by('-count')

            method_distribution = []
            method_names = {
                'face': '人脸识别',
                'qrcode': '二维码',
                'card': '刷卡',
                'password': '密码'
            }

            for stat in method_stats:
                method_distribution.append({
                    'method': method_names.get(stat['method'], stat['method']),
                    'count': stat['count'],
                    'percentage': round(stat['count'] / total_count * 100, 2) if total_count > 0 else 0
                })

            # 4. 按位置统计
            location_stats = AccessLog.objects.filter(
                timestamp__date__gte=start_date,
                timestamp__date__lte=end_date,
                success=True
            ).values('location').annotate(count=Count('id')).order_by('-count')[:10]  # 只取前10个位置

            location_distribution = []
            for stat in location_stats:
                location_distribution.append({
                    'location': stat['location'],
                    'count': stat['count'],
                    'percentage': round(stat['count'] / total_count * 100, 2) if total_count > 0 else 0
                })

            # 5. 按人员类型统计
            person_type_stats = AccessLog.objects.filter(
                timestamp__date__gte=start_date,
                timestamp__date__lte=end_date,
                success=True
            ).values('person_type').annotate(count=Count('id')).order_by('-count')

            person_type_distribution = []
            person_type_names = {
                'resident': '业主',
                'visitor': '访客',
                'delivery': '配送员',
                'staff': '工作人员',
                'other': '其他'
            }

            for stat in person_type_stats:
                person_type_distribution.append({
                    'type': person_type_names.get(stat['person_type'], stat['person_type']),
                    'count': stat['count'],
                    'percentage': round(stat['count'] / total_count * 100, 2) if total_count > 0 else 0
                })

            # 6. 每日统计趋势
            daily_trend = []
            current_date = start_date
            while current_date <= end_date:
                count = AccessLog.objects.filter(
                    timestamp__date=current_date,
                    success=True
                ).count()

                daily_trend.append({
                    'date': current_date.strftime('%m-%d'),
                    'count': count
                })
                current_date += timedelta(days=1)

            # 7. 高峰时段统计（小时）
            hourly_stats = AccessLog.objects.filter(
                timestamp__date__gte=start_date,
                timestamp__date__lte=end_date,
                success=True
            ).extra(
                select={'hour': 'timestamp_hour'}
            ).values('hour').annotate(count=Count('id')).order_by('hour')

            hourly_distribution = []
            for hour in range(24):
                count = 0
                for stat in hourly_stats:
                    if stat['hour'] == hour:
                        count = stat['count']
                        break

                hourly_distribution.append({
                    'hour': f"{hour:02d}:00",
                    'count': count
                })

            stats_data = {
                'today_count': today_count,
                'total_count': total_count,
                'date_range': f"{start_date.strftime('%Y-%m-%d')} 至 {end_date.strftime('%Y-%m-%d')}",
                'method_distribution': method_distribution,
                'location_distribution': location_distribution,
                'person_type_distribution': person_type_distribution,
                'daily_trend': daily_trend,
                'hourly_distribution': hourly_distribution
            }

            return Response({
                "code": 200,
                "message": "获取成功",
                "data": stats_data
            })

        except Exception as e:
            logger.error(f"获取门禁日志统计数据失败: {e}")
            return Response({
                "code": 500,
                "message": f"获取门禁日志统计数据失败: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AccessLogOptionsView(APIView):
    """门禁日志选项接口"""
    permission_classes = []

    def get(self, request):
        """获取门禁日志相关的选项数据"""
        try:
            # 开门方式选项
            method_options = [
                {"label": label, "value": value}
                for value, label in AccessLog.METHOD_CHOICES
            ]

            # 位置选项（从现有数据中获取最常用的位置）
            from django.db.models import Count
            popular_locations = AccessLog.objects.values('location').annotate(
                count=Count('id')
            ).order_by('-count')[:20]  # 取前20个常用位置

            location_options = []
            if popular_locations.exists():
                location_options = [
                    {"label": item['location'], "value": item['location']}
                    for item in popular_locations
                ]
            else:
                # 如果没有数据，提供一些默认位置
                location_options = [
                    {"label": "1栋东门", "value": "1栋东门"},
                    {"label": "1栋西门", "value": "1栋西门"},
                    {"label": "2栋东门", "value": "2栋东门"},
                    {"label": "2栋西门", "value": "2栋西门"},
                    {"label": "南大门", "value": "南大门"},
                    {"label": "北大门", "value": "北大门"},
                ]

            # 人员类型选项
            person_type_options = [
                {"label": "业主", "value": "resident"},
                {"label": "访客", "value": "visitor"},
                {"label": "配送员", "value": "delivery"},
                {"label": "工作人员", "value": "staff"},
                {"label": "其他", "value": "other"},
            ]

            return Response({
                "code": 200,
                "message": "获取成功",
                "data": {
                    "methods": method_options,
                    "locations": location_options,
                    "person_types": person_type_options
                }
            })

        except Exception as e:
            logger.error(f"获取门禁日志选项失败: {e}")
            return Response({
                "code": 500,
                "message": f"获取门禁日志选项失败: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)