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