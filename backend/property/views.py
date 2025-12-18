from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import HouseBindingApplication, HouseUserBinding
from .serializers import HouseBindingApplicationSerializer, HouseUserBindingSerializer
import logging

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