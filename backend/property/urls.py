from django.urls import path
from .views import HouseBindingApplicationView, MyHouseListView, HouseBindingStatsView

urlpatterns = [
    # 房屋绑定申请相关
    path('house/binding/apply', HouseBindingApplicationView.as_view(), name='house_binding_apply'),
    path('house/binding/applications', HouseBindingApplicationView.as_view(), name='house_binding_applications'),
    
    # 我的房屋
    path('house/my-houses', MyHouseListView.as_view(), name='my_houses'),
    
    # 统计信息
    path('house/stats', HouseBindingStatsView.as_view(), name='house_binding_stats'),
]