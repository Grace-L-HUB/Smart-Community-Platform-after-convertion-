from django.urls import path
from .views import (
    MerchantApplicationView, MerchantApplicationListView,
    MerchantApplicationReviewView, MerchantProfileView,
    MerchantRegisterView, MerchantLoginView,
    MerchantProductListView, MerchantProductDetailView,
    MerchantProductStatusView, PublicMerchantListView,
    PublicMerchantDetailView, PublicProductListView,
    PublicProductDetailView
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
    
    # 商品管理相关
    path('products/', MerchantProductListView.as_view(), name='merchant_products'),
    path('products/<int:product_id>/', MerchantProductDetailView.as_view(), name='merchant_product_detail'),
    path('products/<int:product_id>/toggle-status/', MerchantProductStatusView.as_view(), name='merchant_product_status'),
    
    # 公开接口（供小程序使用）
    path('profiles/', PublicMerchantListView.as_view(), name='public_merchant_list'),
    path('profile/<int:merchant_id>/', PublicMerchantDetailView.as_view(), name='public_merchant_detail'),
    path('products/public/<int:merchant_id>/', PublicProductListView.as_view(), name='public_product_list'),
    path('product/public/<int:product_id>/', PublicProductDetailView.as_view(), name='public_product_detail'),
]
