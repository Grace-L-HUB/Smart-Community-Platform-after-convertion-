from django.urls import path
from .views import (
    MerchantApplicationView, MerchantApplicationListView,
    MerchantApplicationReviewView, MerchantProfileView,
    MerchantRegisterView, MerchantLoginView
)

urlpatterns = [
    # 商户注册和登录
    path('register/', MerchantRegisterView.as_view(), name='merchant_register'),
    path('login/', MerchantLoginView.as_view(), name='merchant_login'),
    
    # 商户申请相关
    path('application/', MerchantApplicationView.as_view(), name='merchant_application'),
    path('applications/', MerchantApplicationListView.as_view(), name='merchant_application_list'),
    path('applications/<int:application_id>/review/', MerchantApplicationReviewView.as_view(), name='merchant_application_review'),
    
    # 商户档案相关
    path('profile/', MerchantProfileView.as_view(), name='merchant_profile'),
]
