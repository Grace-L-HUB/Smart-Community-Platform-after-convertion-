from django.urls import path
from .views import (
    MerchantApplicationView, MerchantApplicationListView,
    MerchantApplicationReviewView, MerchantProfileView,
    MerchantRegisterView, MerchantLoginView,
    MerchantProductListView, MerchantProductDetailView,
    MerchantProductStatusView, PublicMerchantListView,
    PublicMerchantDetailView, PublicProductListView,
    PublicProductDetailView, MerchantOrderListView,
    MerchantOrderDetailView, OrderStatusUpdateView,
    PickupCodeVerifyView, MerchantCouponListView,
    PublicCouponListView, CouponReceiveView,
    UserCouponListView, CouponVerifyView, OrderCreateView,
    UserOrderListView, UserOrderDetailView, MerchantStatsView,
    MerchantLogoUploadView, ProductImageUploadView
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
    path('upload/logo/', MerchantLogoUploadView.as_view(), name='merchant_logo_upload'),
    path('upload/product-image/', ProductImageUploadView.as_view(), name='product_image_upload'),
    
    # 商品管理相关
    path('products/', MerchantProductListView.as_view(), name='merchant_products'),
    path('products/<int:product_id>/', MerchantProductDetailView.as_view(), name='merchant_product_detail'),
    path('products/<int:product_id>/toggle-status/', MerchantProductStatusView.as_view(), name='merchant_product_status'),
    
    # 订单管理相关
    path('orders/', MerchantOrderListView.as_view(), name='merchant_orders'),
    path('orders/<int:order_id>/', MerchantOrderDetailView.as_view(), name='merchant_order_detail'),
    path('orders/<int:order_id>/status/', OrderStatusUpdateView.as_view(), name='order_status_update'),
    path('orders/verify-pickup/', PickupCodeVerifyView.as_view(), name='pickup_code_verify'),

    # 统计数据相关
    path('stats/', MerchantStatsView.as_view(), name='merchant_stats'),
    
    # 优惠券管理相关
    path('coupons/', MerchantCouponListView.as_view(), name='merchant_coupons'),
    path('coupons/verify/', CouponVerifyView.as_view(), name='coupon_verify'),
    
    # 公开接口（供小程序使用）
    path('profiles/', PublicMerchantListView.as_view(), name='public_merchant_list'),
    path('profile/<int:merchant_id>/', PublicMerchantDetailView.as_view(), name='public_merchant_detail'),
    path('products/public/<int:merchant_id>/', PublicProductListView.as_view(), name='public_product_list'),
    path('product/public/<int:product_id>/', PublicProductDetailView.as_view(), name='public_product_detail'),
    
    # 优惠券公开接口（供小程序使用）
    path('coupons/public/', PublicCouponListView.as_view(), name='public_coupon_list'),
    path('coupons/public/<int:merchant_id>/', PublicCouponListView.as_view(), name='public_merchant_coupons'),
    path('coupons/receive/', CouponReceiveView.as_view(), name='coupon_receive'),
    path('user/coupons/', UserCouponListView.as_view(), name='user_coupons'),

    # 订单公开接口（供小程序使用）
    path('orders/create/', OrderCreateView.as_view(), name='order_create'),
    path('user/orders/', UserOrderListView.as_view(), name='user_orders'),
    path('user/orders/<int:order_id>/', UserOrderDetailView.as_view(), name='user_order_detail'),
    path('user/orders/<int:order_id>/cancel/', UserOrderDetailView.as_view(), name='user_order_cancel'),
]