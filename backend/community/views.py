from django.shortcuts import get_object_or_404
from django.db.models import Q, F
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.pagination import PageNumberPagination
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from .models import (
    MarketItem, MarketItemFavorite, NeighborHelpPost, 
    HelpResponse, ChatMessage, ChatConversation,
    Activity, ActivityRegistration
)
from .serializers import (
    MarketItemListSerializer, MarketItemDetailSerializer,
    NeighborHelpPostListSerializer, NeighborHelpPostDetailSerializer,
    HelpResponseSerializer, ChatMessageSerializer, ChatConversationSerializer,
    ActivityListSerializer, ActivityDetailSerializer, ActivityCreateSerializer,
    ActivityRegistrationSerializer, ActivityRegistrationCreateSerializer
)


class StandardResultsSetPagination(PageNumberPagination):
    """标准分页器"""
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


# =============================================================================
# 二手闲置相关视图
# =============================================================================

class MarketItemListCreateView(generics.ListCreateAPIView):
    """商品列表和发布"""
    
    queryset = MarketItem.objects.filter(is_active=True)
    pagination_class = StandardResultsSetPagination
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return MarketItemDetailSerializer
        return MarketItemListSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get('category')
        search = self.request.query_params.get('search')
        
        if category:
            queryset = queryset.filter(category=category)
        
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search)
            )
        
        return queryset.select_related('seller').prefetch_related('images')
    
    @extend_schema(
        summary="获取二手商品列表",
        parameters=[
            OpenApiParameter('category', OpenApiTypes.STR, description='商品类别'),
            OpenApiParameter('search', OpenApiTypes.STR, description='搜索关键词'),
            OpenApiParameter('page', OpenApiTypes.INT, description='页码'),
            OpenApiParameter('page_size', OpenApiTypes.INT, description='每页数量'),
        ]
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
    
    @extend_schema(
        summary="发布二手商品",
        description="发布新的二手商品信息"
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class MarketItemDetailView(generics.RetrieveAPIView):
    """商品详情"""
    
    queryset = MarketItem.objects.filter(is_active=True)
    serializer_class = MarketItemDetailSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        obj = super().get_object()
        # 增加浏览次数
        MarketItem.objects.filter(pk=obj.pk).update(view_count=F('view_count') + 1)
        return obj
    
    def get_queryset(self):
        return super().get_queryset().select_related('seller').prefetch_related('images')
    
    @extend_schema(
        summary="获取商品详情",
        description="获取指定商品的详细信息"
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


@extend_schema(
    summary="收藏/取消收藏商品",
    description="切换商品的收藏状态"
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_favorite(request, pk):
    """收藏/取消收藏商品"""
    
    item = get_object_or_404(MarketItem, pk=pk, is_active=True)
    favorite, created = MarketItemFavorite.objects.get_or_create(
        user=request.user, item=item
    )
    
    if not created:
        favorite.delete()
        # 减少收藏计数
        MarketItem.objects.filter(pk=item.pk).update(
            favorite_count=F('favorite_count') - 1
        )
        return Response({'favorited': False, 'message': '已取消收藏'})
    else:
        # 增加收藏计数
        MarketItem.objects.filter(pk=item.pk).update(
            favorite_count=F('favorite_count') + 1
        )
        return Response({'favorited': True, 'message': '已收藏'})


# =============================================================================
# 邻居互助相关视图
# =============================================================================

class HelpPostListCreateView(generics.ListCreateAPIView):
    """求助帖列表和发布"""
    
    queryset = NeighborHelpPost.objects.filter(is_active=True)
    pagination_class = StandardResultsSetPagination
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return NeighborHelpPostDetailSerializer
        return NeighborHelpPostListSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        tag = self.request.query_params.get('tag')
        search = self.request.query_params.get('search')
        status_filter = self.request.query_params.get('status')  # resolved/unresolved
        
        if tag:
            queryset = queryset.filter(tag=tag)
        
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(content__icontains=search)
            )
        
        if status_filter == 'resolved':
            queryset = queryset.filter(is_resolved=True)
        elif status_filter == 'unresolved':
            queryset = queryset.filter(is_resolved=False)
        
        return queryset.select_related('publisher').order_by('-is_urgent', '-created_at')
    
    @extend_schema(
        summary="获取求助帖列表",
        parameters=[
            OpenApiParameter('tag', OpenApiTypes.STR, description='求助标签'),
            OpenApiParameter('search', OpenApiTypes.STR, description='搜索关键词'),
            OpenApiParameter('status', OpenApiTypes.STR, description='状态：resolved/unresolved'),
            OpenApiParameter('page', OpenApiTypes.INT, description='页码'),
            OpenApiParameter('page_size', OpenApiTypes.INT, description='每页数量'),
        ]
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
    
    @extend_schema(
        summary="发布求助帖",
        description="发布新的求助信息"
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class HelpPostDetailView(generics.RetrieveUpdateDestroyAPIView):
    """求助帖详情"""
    
    queryset = NeighborHelpPost.objects.filter(is_active=True)
    serializer_class = NeighborHelpPostDetailSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        obj = super().get_object()
        # 增加浏览次数
        NeighborHelpPost.objects.filter(pk=obj.pk).update(view_count=F('view_count') + 1)
        return obj
    
    def get_queryset(self):
        return super().get_queryset().select_related('publisher').prefetch_related(
            'images', 'responses__responder'
        )
    
    @extend_schema(
        summary="获取求助帖详情",
        description="获取指定求助帖的详细信息"
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
    
    @extend_schema(
        summary="更新求助帖",
        description="更新求助帖信息（仅发布者可操作）"
    )
    def put(self, request, *args, **kwargs):
        obj = self.get_object()
        if obj.publisher != request.user:
            return Response({'error': '只有发布者可以编辑求助帖'}, 
                          status=status.HTTP_403_FORBIDDEN)
        return super().put(request, *args, **kwargs)
    
    @extend_schema(
        summary="删除求助帖",
        description="删除求助帖（仅发布者可操作）"
    )
    def delete(self, request, *args, **kwargs):
        obj = self.get_object()
        if obj.publisher != request.user:
            return Response({'error': '只有发布者可以删除求助帖'}, 
                          status=status.HTTP_403_FORBIDDEN)
        # 软删除
        obj.is_active = False
        obj.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(
    summary="回复求助帖",
    description="对指定求助帖进行回复"
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_help_response(request, pk):
    """回复求助帖"""
    
    help_post = get_object_or_404(NeighborHelpPost, pk=pk, is_active=True)
    
    serializer = HelpResponseSerializer(
        data=request.data, 
        context={'request': request}
    )
    
    if serializer.is_valid():
        serializer.save(help_post=help_post)
        
        # 增加回复计数
        NeighborHelpPost.objects.filter(pk=help_post.pk).update(
            response_count=F('response_count') + 1
        )
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    summary="标记求助帖为已解决",
    description="将求助帖标记为已解决状态（仅发布者可操作）"
)
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def resolve_help_post(request, pk):
    """标记求助帖为已解决"""
    
    help_post = get_object_or_404(NeighborHelpPost, pk=pk, is_active=True)
    
    if help_post.publisher != request.user:
        return Response({'error': '只有发布者可以标记为已解决'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    help_post.is_resolved = True
    help_post.resolved_at = timezone.now()
    help_post.save()
    
    return Response({'message': '已标记为解决'})


# =============================================================================
# 私聊相关视图
# =============================================================================

class ConversationListView(generics.ListAPIView):
    """聊天会话列表"""
    
    serializer_class = ChatConversationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        user = self.request.user
        return ChatConversation.objects.filter(
            Q(participant1=user) | Q(participant2=user)
        ).select_related(
            'participant1', 'participant2', 'market_item', 'last_message'
        ).order_by('-last_message_time')
    
    @extend_schema(
        summary="获取聊天会话列表",
        description="获取当前用户的所有聊天会话"
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class ConversationMessagesView(generics.ListAPIView):
    """聊天消息列表"""
    
    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        conversation_id = self.kwargs['conversation_id']
        conversation = get_object_or_404(ChatConversation, pk=conversation_id)
        
        # 检查权限
        user = self.request.user
        if user not in [conversation.participant1, conversation.participant2]:
            return ChatMessage.objects.none()
        
        # 标记为已读
        conversation.mark_as_read(user)
        
        return ChatMessage.objects.filter(
            Q(sender=conversation.participant1, receiver=conversation.participant2) |
            Q(sender=conversation.participant2, receiver=conversation.participant1)
        ).filter(
            market_item=conversation.market_item
        ).select_related('sender', 'receiver').order_by('created_at')
    
    @extend_schema(
        summary="获取会话消息列表",
        description="获取指定会话的消息记录"
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


@extend_schema(
    summary="发送消息",
    description="在指定会话中发送消息"
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message(request, conversation_id):
    """发送消息"""
    
    conversation = get_object_or_404(ChatConversation, pk=conversation_id)
    user = request.user
    
    # 检查权限
    if user not in [conversation.participant1, conversation.participant2]:
        return Response({'error': '无权限访问此会话'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    # 确定接收者
    receiver = conversation.participant2 if user == conversation.participant1 else conversation.participant1
    
    # 创建消息
    data = request.data.copy()
    data['receiver'] = receiver.id
    data['market_item'] = conversation.market_item.id if conversation.market_item else None
    
    serializer = ChatMessageSerializer(data=data, context={'request': request})
    
    if serializer.is_valid():
        message = serializer.save()
        
        # 更新会话信息
        conversation.last_message = message
        conversation.last_message_time = message.created_at
        
        # 更新未读计数
        if receiver == conversation.participant1:
            conversation.unread_count_p1 += 1
        else:
            conversation.unread_count_p2 += 1
        
        conversation.save()
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    summary="开始新会话",
    description="开始与指定用户的新聊天会话"
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_conversation(request):
    """开始新会话"""
    
    target_user_id = request.data.get('target_user_id')
    market_item_id = request.data.get('market_item_id')
    
    if not target_user_id:
        return Response({'error': '缺少目标用户ID'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    target_user = get_object_or_404(User, pk=target_user_id)
    market_item = None
    
    if market_item_id:
        market_item = get_object_or_404(MarketItem, pk=market_item_id)
    
    # 查找或创建会话
    conversation = ChatConversation.objects.filter(
        Q(participant1=request.user, participant2=target_user) |
        Q(participant1=target_user, participant2=request.user),
        market_item=market_item
    ).first()
    
    if not conversation:
        conversation = ChatConversation.objects.create(
            participant1=request.user,
            participant2=target_user,
            market_item=market_item
        )
    
    serializer = ChatConversationSerializer(conversation, context={'request': request})
    return Response(serializer.data)


@extend_schema(
    summary="轮询新消息",
    description="轮询指定会话的新消息"
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def poll_messages(request, conversation_id):
    """轮询新消息"""
    
    conversation = get_object_or_404(ChatConversation, pk=conversation_id)
    user = request.user
    
    # 检查权限
    if user not in [conversation.participant1, conversation.participant2]:
        return Response({'error': '无权限访问此会话'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    # 获取指定时间之后的消息
    since = request.query_params.get('since')
    if since:
        try:
            since_time = timezone.datetime.fromisoformat(since.replace('Z', '+00:00'))
            messages = ChatMessage.objects.filter(
                Q(sender=conversation.participant1, receiver=conversation.participant2) |
                Q(sender=conversation.participant2, receiver=conversation.participant1),
                market_item=conversation.market_item,
                created_at__gt=since_time
            ).select_related('sender', 'receiver').order_by('created_at')
        except (ValueError, TypeError):
            return Response({'error': '时间格式错误'}, 
                           status=status.HTTP_400_BAD_REQUEST)
    else:
        messages = ChatMessage.objects.none()
    
    # 标记为已读
    if messages.exists():
        conversation.mark_as_read(user)
    
    serializer = ChatMessageSerializer(messages, many=True, context={'request': request})
    return Response(serializer.data)


# =============================================================================
# 社区活动相关视图
# =============================================================================

class ActivityListCreateView(generics.ListCreateAPIView):
    """活动列表和创建"""
    
    queryset = Activity.objects.filter(is_active=True)
    pagination_class = StandardResultsSetPagination
    permission_classes = [AllowAny]  # 暂时不需要权限认证，和property应用保持一致
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ActivityCreateSerializer
        return ActivityListSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        status_filter = self.request.query_params.get('status')
        search = self.request.query_params.get('search')
        
        # 更新所有活动状态
        for activity in queryset:
            activity.update_status()
            activity.save()
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(location__icontains=search)
            )
        
        return queryset.select_related('organizer').order_by('-created_at')
    
    def list(self, request, *args, **kwargs):
        """重写list方法以返回自定义格式"""
        response = super().list(request, *args, **kwargs)
        return Response({
            'code': 200,
            'message': '获取成功',
            'data': response.data['results'] if 'results' in response.data else response.data,
            'total': response.data.get('count', len(response.data)) if isinstance(response.data, dict) else len(response.data)
        })
    
    def create(self, request, *args, **kwargs):
        """重写create方法以返回自定义格式"""
        # 临时处理：如果没有认证，使用第一个用户作为组织者
        if not request.user or request.user.is_anonymous:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                request.user = User.objects.first()
            except:
                return Response({
                    'code': 400,
                    'message': '系统中没有可用用户，请先创建用户'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            activity = serializer.save()
            return Response({
                'code': 200,
                'message': '活动创建成功',
                'data': ActivityDetailSerializer(activity, context={'request': request}).data
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                'code': 400,
                'message': '数据验证失败',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @extend_schema(
        summary="获取活动列表",
        parameters=[
            OpenApiParameter('status', OpenApiTypes.STR, description='活动状态：upcoming/ongoing/ended'),
            OpenApiParameter('search', OpenApiTypes.STR, description='搜索关键词'),
            OpenApiParameter('page', OpenApiTypes.INT, description='页码'),
            OpenApiParameter('page_size', OpenApiTypes.INT, description='每页数量'),
        ]
    )
    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)
    
    @extend_schema(
        summary="创建活动",
        description="创建新的社区活动"
    )
    def post(self, request, *args, **kwargs):
        return self.create(request, *args, **kwargs)


class ActivityDetailView(generics.RetrieveUpdateDestroyAPIView):
    """活动详情、编辑、删除"""

    queryset = Activity.objects.filter(is_active=True)
    serializer_class = ActivityDetailSerializer
    permission_classes = [AllowAny]  # 暂时不需要权限认证
    
    def get_object(self):
        obj = super().get_object()
        # 更新状态并增加浏览次数
        obj.update_status()
        Activity.objects.filter(pk=obj.pk).update(view_count=F('view_count') + 1)
        obj.save()
        return obj
    
    def get_queryset(self):
        return super().get_queryset().select_related('organizer').prefetch_related(
            'images', 'registrations__user'
        )
    
    def retrieve(self, request, *args, **kwargs):
        """重写retrieve方法以返回自定义格式"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            'code': 200,
            'message': '获取成功',
            'data': serializer.data
        })
    
    def update(self, request, *args, **kwargs):
        """重写update方法以返回自定义格式"""
        instance = self.get_object()
        
        # 临时处理：在开发环境中跳过权限检查
        # if instance.organizer != request.user:
        #     return Response({
        #         'code': 403,
        #         'message': '只有组织者可以编辑活动'
        #     }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = self.get_serializer(instance, data=request.data, partial=kwargs.get('partial', False))
        if serializer.is_valid():
            activity = serializer.save()
            return Response({
                'code': 200,
                'message': '活动更新成功',
                'data': serializer.data
            })
        else:
            return Response({
                'code': 400,
                'message': '数据验证失败',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, *args, **kwargs):
        """重写destroy方法以返回自定义格式"""
        instance = self.get_object()
        
        # 临时处理：在开发环境中跳过权限检查
        # if instance.organizer != request.user:
        #     return Response({
        #         'code': 403,
        #         'message': '只有组织者可以删除活动'
        #     }, status=status.HTTP_403_FORBIDDEN)
        
        # 软删除
        instance.is_active = False
        instance.save()
        return Response({
            'code': 200,
            'message': '活动删除成功'
        })
    
    @extend_schema(
        summary="获取活动详情",
        description="获取指定活动的详细信息"
    )
    def get(self, request, *args, **kwargs):
        return self.retrieve(request, *args, **kwargs)
    
    @extend_schema(
        summary="更新活动信息",
        description="更新活动信息（仅组织者可操作）"
    )
    def put(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)
    
    @extend_schema(
        summary="删除活动",
        description="删除活动（仅组织者可操作）"
    )
    def delete(self, request, *args, **kwargs):
        return self.destroy(request, *args, **kwargs)


@extend_schema(
    summary="报名活动",
    description="用户报名参加指定活动"
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def register_activity(request, pk):
    """报名活动"""
    
    activity = get_object_or_404(Activity, pk=pk, is_active=True)
    
    # 检查是否可以报名
    if not activity.can_register():
        return Response({'code': 400, 'message': '活动不可报名'}, status=status.HTTP_400_BAD_REQUEST)
    
    # 检查用户是否已经报名
    existing_registration = ActivityRegistration.objects.filter(
        activity=activity, user=request.user
    ).first()
    
    if existing_registration:
        if existing_registration.status == 'approved':
            return Response({'code': 400, 'message': '您已经报名了此活动'}, status=status.HTTP_400_BAD_REQUEST)
        elif existing_registration.status == 'cancelled':
            # 重新激活报名
            existing_registration.status = 'approved'
            existing_registration.save()
            
            return Response({'code': 200, 'message': '报名成功'})
    
    # 创建新的报名记录
    serializer = ActivityRegistrationCreateSerializer(
        data=request.data, 
        context={'request': request, 'activity': activity}
    )
    
    if serializer.is_valid():
        serializer.save()
        return Response({'code': 200, 'message': '报名成功'}, status=status.HTTP_201_CREATED)
    
    return Response({'code': 400, 'message': '数据验证失败', 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    summary="取消报名",
    description="用户取消活动报名"
)
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def cancel_registration(request, pk):
    """取消报名"""
    
    activity = get_object_or_404(Activity, pk=pk, is_active=True)
    registration = get_object_or_404(
        ActivityRegistration, 
        activity=activity, 
        user=request.user
    )
    
    if registration.status == 'cancelled':
        return Response({'code': 400, 'message': '您已经取消了报名'}, status=status.HTTP_400_BAD_REQUEST)
    
    # 标记为已取消而不是删除
    registration.status = 'cancelled'
    registration.save()
    
    return Response({'code': 200, 'message': '已取消报名'})


@extend_schema(
    summary="获取活动报名名单",
    description="获取指定活动的报名用户列表（仅组织者可查看）"
)
@api_view(['GET'])
@permission_classes([AllowAny])
def activity_participants(request, pk):
    """获取活动报名名单"""
    
    activity = get_object_or_404(Activity, pk=pk, is_active=True)
    
    # 临时处理：在开发环境中跳过权限检查
    # if activity.organizer != request.user:
    #     return Response({
    #         'code': 403,
    #         'message': '只有组织者可以查看报名名单'
    #     }, status=status.HTTP_403_FORBIDDEN)
    
    registrations = ActivityRegistration.objects.filter(
        activity=activity
    ).select_related('user').order_by('-created_at')
    
    # 分页
    paginator = StandardResultsSetPagination()
    page = paginator.paginate_queryset(registrations, request)
    
    if page is not None:
        serializer = ActivityRegistrationSerializer(page, many=True, context={'request': request})
        return Response({
            'code': 200,
            'message': '获取成功',
            'data': serializer.data,
            'total': paginator.page.paginator.count
        })
    
    serializer = ActivityRegistrationSerializer(registrations, many=True, context={'request': request})
    return Response({
        'code': 200,
        'message': '获取成功',
        'data': serializer.data,
        'total': len(serializer.data)
    })




@extend_schema(
    summary="用户活动列表",
    description="获取当前用户报名的活动列表"
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_activities(request):
    """获取用户参与的活动"""
    
    # 获取用户报名的活动
    registrations = ActivityRegistration.objects.filter(
        user=request.user,
        status='approved'
    ).select_related('activity').order_by('-created_at')
    
    activities = [reg.activity for reg in registrations if reg.activity.is_active]
    
    # 分页
    paginator = StandardResultsSetPagination()
    page = paginator.paginate_queryset(activities, request)
    
    if page is not None:
        serializer = ActivityListSerializer(page, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)
    
    serializer = ActivityListSerializer(activities, many=True, context={'request': request})
    return Response(serializer.data)
