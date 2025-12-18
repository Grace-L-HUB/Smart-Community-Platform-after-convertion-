from django.urls import path
from .views import (
    HouseBindingApplicationView, MyHouseListView, HouseBindingStatsView,
    VisitorInviteView, VisitorDetailView, VisitorStatusView, VisitorQRCodeView
)

urlpatterns = [
    # 房屋绑定申请相关
    path('property/house/binding/apply', HouseBindingApplicationView.as_view(), name='house_binding_apply'),
    path('property/house/binding/applications', HouseBindingApplicationView.as_view(), name='house_binding_applications'),
    
    # 我的房屋
    path('property/house/my-houses', MyHouseListView.as_view(), name='my_houses'),
    
    # 统计信息
    path('property/house/stats', HouseBindingStatsView.as_view(), name='house_binding_stats'),
    
    # 访客邀请相关
    path('property/visitor/invite', VisitorInviteView.as_view(), name='visitor_invite'),
    path('property/visitor/list', VisitorInviteView.as_view(), name='visitor_list'),
    path('property/visitor/<uuid:visitor_id>', VisitorDetailView.as_view(), name='visitor_detail'),
    path('property/visitor/<uuid:visitor_id>/status', VisitorStatusView.as_view(), name='visitor_status'),
    path('property/visitor/<uuid:visitor_id>/qrcode', VisitorQRCodeView.as_view(), name='visitor_qrcode'),
]