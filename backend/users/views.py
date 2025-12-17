from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import LoginSerializer

# Create your views here.

class LoginView(APIView):
    # 这是一个不需要登录就能访问的接口
    permission_classes = [] 

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            # 这里生成 Token (后续我们要配置 JWT)
            # token = RefreshToken.for_user(user)
            return Response({
                "code": 200,
                "message": "登录成功",
                "data": {
                    "token": "模拟的token_abc123", 
                    "user_id": user.id,
                    "role": user.role
                }
            })
        return Response({
            "code": 400,
            "message": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
