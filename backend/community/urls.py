from django.urls import path
from .views import (
    # 二手闲置相关
    MarketItemListCreateView, MarketItemDetailView, toggle_favorite, mark_item_sold,

    # 邻居互助相关
    HelpPostListCreateView, HelpPostDetailView,
    create_help_response, resolve_help_post,

    # 私聊相关
    ConversationListView, ConversationMessagesView,
    send_message, start_conversation, poll_messages,

    # 社区活动相关
    ActivityListCreateView, ActivityDetailView, register_activity,
    cancel_registration, activity_participants, my_activities,

    # 图片上传相关
    CommunityImageUploadView,
)

urlpatterns = [
    # =============================================================================
    # 二手闲置相关路由
    # =============================================================================
    
    # 商品列表和发布
    path('market-items/', MarketItemListCreateView.as_view(), name='market_items'),
    
    # 商品详情
    path('market-items/<int:pk>/', MarketItemDetailView.as_view(), name='market_item_detail'),

    # 收藏/取消收藏
    path('market-items/<int:pk>/favorite/', toggle_favorite, name='toggle_favorite'),

    # 标记商品已售
    path('market-items/<int:pk>/sold/', mark_item_sold, name='mark_item_sold'),
    
    # =============================================================================
    # 邻居互助相关路由
    # =============================================================================
    
    # 求助帖列表和发布
    path('help-posts/', HelpPostListCreateView.as_view(), name='help_posts'),
    
    # 求助帖详情、编辑、删除
    path('help-posts/<int:pk>/', HelpPostDetailView.as_view(), name='help_post_detail'),
    
    # 回复求助帖
    path('help-posts/<int:pk>/responses/', create_help_response, name='help_responses'),
    
    # 标记为已解决
    path('help-posts/<int:pk>/resolve/', resolve_help_post, name='resolve_help_post'),
    
    # =============================================================================
    # 私聊相关路由
    # =============================================================================
    
    # 会话列表
    path('conversations/', ConversationListView.as_view(), name='conversations'),
    
    # 开始新会话
    path('conversations/start/', start_conversation, name='start_conversation'),
    
    # 会话消息列表
    path('conversations/<int:conversation_id>/messages/', ConversationMessagesView.as_view(), name='conversation_messages'),
    
    # 发送消息
    path('conversations/<int:conversation_id>/send/', send_message, name='send_message'),
    
    # 轮询新消息
    path('conversations/<int:conversation_id>/poll/', poll_messages, name='poll_messages'),
    
    # =============================================================================
    # 社区活动相关路由
    # =============================================================================
    
    # 活动列表和创建
    path('activities/', ActivityListCreateView.as_view(), name='activities'),
    
    # 活动详情、编辑、删除
    path('activities/<int:pk>/', ActivityDetailView.as_view(), name='activity_detail'),
    
    # 报名活动
    path('activities/<int:pk>/register/', register_activity, name='register_activity'),
    
    # 取消报名
    path('activities/<int:pk>/cancel/', cancel_registration, name='cancel_registration'),
    
    # 获取活动报名名单
    path('activities/<int:pk>/participants/', activity_participants, name='activity_participants'),
    
    # 用户参与的活动
    path('my-activities/', my_activities, name='my_activities'),

    # 图片上传
    path('upload/image/', CommunityImageUploadView.as_view(), name='community_image_upload'),
]