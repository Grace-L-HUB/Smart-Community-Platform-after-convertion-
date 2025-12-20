from django.urls import path
from .views import (
    HouseBindingApplicationView, MyHouseListView, HouseBindingStatsView,
    VisitorInviteView, VisitorDetailView, VisitorStatusView, VisitorQRCodeView,
    ParkingBindingApplicationView, MyParkingListView, ParkingBindingStatsView,
    HouseBindingAuditView, ParkingBindingAuditView, HouseBindingUnbindView, ParkingBindingUnbindView,
    HouseListView, ParkingSpaceListView, DashboardStatsView, EmployeeListView,
    HouseBuildingOptionsView, HouseUnitOptionsView, HouseRoomOptionsView,
    ParkingAreaOptionsView, ParkingSpaceOptionsView,
    HouseIdentityOptionsView, ParkingIdentityOptionsView,
    AnnouncementListView, AnnouncementCreateView, AnnouncementDetailView,
    AnnouncementUpdateView, AnnouncementStatusView, AnnouncementDeleteView
)

urlpatterns = [
    # 房屋绑定申请相关
    path('property/house/binding/apply', HouseBindingApplicationView.as_view(), name='house_binding_apply'),
    path('property/house/binding/applications', HouseBindingApplicationView.as_view(), name='house_binding_applications'),
    
    # 我的房屋
    path('property/house/my-houses', MyHouseListView.as_view(), name='my_houses'),
    
    # 统计信息
    path('property/house/stats', HouseBindingStatsView.as_view(), name='house_binding_stats'),
    
    # 房屋绑定审核
    path('property/house/binding/audit', HouseBindingAuditView.as_view(), name='house_binding_audit_list'),
    path('property/house/binding/audit/<int:application_id>', HouseBindingAuditView.as_view(), name='house_binding_audit'),
    
    # 房屋绑定解绑
    path('property/house/binding/unbind/<int:binding_id>', HouseBindingUnbindView.as_view(), name='house_binding_unbind'),
    
    # 访客邀请相关
    path('property/visitor/invite', VisitorInviteView.as_view(), name='visitor_invite'),
    path('property/visitor/list', VisitorInviteView.as_view(), name='visitor_list'),
    path('property/visitor/<uuid:visitor_id>', VisitorDetailView.as_view(), name='visitor_detail'),
    path('property/visitor/<uuid:visitor_id>/status', VisitorStatusView.as_view(), name='visitor_status'),
    path('property/visitor/<uuid:visitor_id>/qrcode', VisitorQRCodeView.as_view(), name='visitor_qrcode'),
    
    # 车位绑定申请相关
    path('parking/binding/apply', ParkingBindingApplicationView.as_view(), name='parking_binding_apply'),
    path('parking/binding/applications', ParkingBindingApplicationView.as_view(), name='parking_binding_applications'),
    
    # 我的车位
    path('parking/my-parkings', MyParkingListView.as_view(), name='my_parkings'),
    
    # 车位统计信息
    path('parking/stats', ParkingBindingStatsView.as_view(), name='parking_binding_stats'),
    
    # 车位绑定审核
    path('parking/binding/audit', ParkingBindingAuditView.as_view(), name='parking_binding_audit_list'),
    path('parking/binding/audit/<int:application_id>', ParkingBindingAuditView.as_view(), name='parking_binding_audit'),
    
    # 车位绑定解绑
    path('parking/binding/unbind/<int:binding_id>', ParkingBindingUnbindView.as_view(), name='parking_binding_unbind'),
    
    # 基础数据列表
    path('property/house/list', HouseListView.as_view(), name='house_list'),
    path('parking/space/list', ParkingSpaceListView.as_view(), name='parking_space_list'),
    
    # 工作台统计
    path('property/dashboard/stats', DashboardStatsView.as_view(), name='dashboard_stats'),
    
    # 员工管理
    path('property/employees', EmployeeListView.as_view(), name='employee_list'),
    
    # 房屋绑定选项数据
    path('property/house/options/buildings', HouseBuildingOptionsView.as_view(), name='house_buildings'),
    path('property/house/options/units', HouseUnitOptionsView.as_view(), name='house_units'), 
    path('property/house/options/rooms', HouseRoomOptionsView.as_view(), name='house_rooms'),
    
    # 车位绑定选项数据
    path('parking/options/areas', ParkingAreaOptionsView.as_view(), name='parking_areas'),
    path('parking/options/spaces', ParkingSpaceOptionsView.as_view(), name='parking_spaces'),
    
    # 身份选项数据
    path('property/house/options/identities', HouseIdentityOptionsView.as_view(), name='house_identities'),
    path('parking/options/identities', ParkingIdentityOptionsView.as_view(), name='parking_identities'),
    
    # ===== 公告管理相关路由 =====
    
    # 公告创建（必须放在列表前面）
    path('property/announcements/create', AnnouncementCreateView.as_view(), name='announcement_create'),
    
    # 公告详情、更新、状态管理、删除
    path('property/announcements/<int:announcement_id>', AnnouncementDetailView.as_view(), name='announcement_detail'),
    path('property/announcements/<int:announcement_id>/update', AnnouncementUpdateView.as_view(), name='announcement_update'),
    path('property/announcements/<int:announcement_id>/status', AnnouncementStatusView.as_view(), name='announcement_status'),
    path('property/announcements/<int:announcement_id>/delete', AnnouncementDeleteView.as_view(), name='announcement_delete'),
    
    # 公告列表（放在最后，避免匹配冲突）
    path('property/announcements', AnnouncementListView.as_view(), name='announcement_list'),
]