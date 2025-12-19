from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    MarketItem, MarketItemImage, MarketItemFavorite,
    NeighborHelpPost, HelpPostImage, HelpResponse,
    ChatMessage, ChatConversation,
    Activity, ActivityImage, ActivityRegistration
)

User = get_user_model()


class UserSimpleSerializer(serializers.ModelSerializer):
    """用户简化序列化器"""
    
    display_name = serializers.ReadOnlyField()
    
    class Meta:
        model = User
        fields = ['id', 'nickname', 'avatar', 'display_name']


class MarketItemImageSerializer(serializers.ModelSerializer):
    """商品图片序列化器"""
    
    class Meta:
        model = MarketItemImage
        fields = ['id', 'image', 'order']


class MarketItemListSerializer(serializers.ModelSerializer):
    """商品列表序列化器"""
    
    seller = UserSimpleSerializer(read_only=True)
    first_image = serializers.SerializerMethodField()
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = MarketItem
        fields = [
            'id', 'title', 'price', 'condition', 'seller', 
            'first_image', 'time_ago', 'view_count', 'favorite_count'
        ]
    
    def get_first_image(self, obj):
        first_image = obj.images.first()
        if first_image and first_image.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(first_image.image.url)
        return None
    
    def get_time_ago(self, obj):
        from django.utils import timezone
        import datetime
        
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff.days > 0:
            return f"{diff.days}天前"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f"{hours}小时前"
        else:
            minutes = max(diff.seconds // 60, 1)
            return f"{minutes}分钟前"


class MarketItemDetailSerializer(serializers.ModelSerializer):
    """商品详情序列化器"""
    
    seller = UserSimpleSerializer(read_only=True)
    images = MarketItemImageSerializer(many=True, read_only=True)
    time_ago = serializers.SerializerMethodField()
    is_favorite = serializers.SerializerMethodField()
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(), write_only=True, required=False
    )
    
    class Meta:
        model = MarketItem
        fields = [
            'id', 'title', 'description', 'price', 'category', 'condition', 
            'seller', 'images', 'time_ago', 'view_count', 
            'favorite_count', 'is_sold', 'is_favorite', 'uploaded_images'
        ]
        read_only_fields = ['seller', 'view_count', 'favorite_count']
    
    def get_time_ago(self, obj):
        return MarketItemListSerializer().get_time_ago(obj)
    
    def get_is_favorite(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return MarketItemFavorite.objects.filter(
                user=request.user, item=obj
            ).exists()
        return False
    
    def create(self, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])
        validated_data['seller'] = self.context['request'].user
        
        item = super().create(validated_data)
        
        # 创建图片
        for index, image in enumerate(uploaded_images):
            MarketItemImage.objects.create(
                item=item, image=image, order=index
            )
        
        return item


class HelpPostImageSerializer(serializers.ModelSerializer):
    """求助帖图片序列化器"""
    
    class Meta:
        model = HelpPostImage
        fields = ['id', 'image', 'order']


class HelpResponseSerializer(serializers.ModelSerializer):
    """求助回复序列化器"""
    
    responder = UserSimpleSerializer(read_only=True)
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = HelpResponse
        fields = ['id', 'message', 'responder', 'time_ago']
        read_only_fields = ['responder']
    
    def get_time_ago(self, obj):
        return MarketItemListSerializer().get_time_ago(obj)
    
    def create(self, validated_data):
        validated_data['responder'] = self.context['request'].user
        return super().create(validated_data)


class NeighborHelpPostListSerializer(serializers.ModelSerializer):
    """求助帖列表序列化器"""
    
    publisher = UserSimpleSerializer(read_only=True)
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = NeighborHelpPost
        fields = [
            'id', 'title', 'tag', 'publisher', 'time_ago', 
            'is_urgent', 'is_resolved', 'response_count', 'view_count'
        ]
    
    def get_time_ago(self, obj):
        return MarketItemListSerializer().get_time_ago(obj)


class NeighborHelpPostDetailSerializer(serializers.ModelSerializer):
    """求助帖详情序列化器"""
    
    publisher = UserSimpleSerializer(read_only=True)
    images = HelpPostImageSerializer(many=True, read_only=True)
    responses = HelpResponseSerializer(many=True, read_only=True)
    time_ago = serializers.SerializerMethodField()
    is_owner = serializers.SerializerMethodField()
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(), write_only=True, required=False
    )
    
    class Meta:
        model = NeighborHelpPost
        fields = [
            'id', 'title', 'content', 'tag', 'publisher', 'phone', 
            'location', 'is_urgent', 'is_resolved', 'images', 
            'responses', 'time_ago', 'view_count', 'response_count',
            'is_owner', 'uploaded_images'
        ]
        read_only_fields = ['publisher', 'view_count', 'response_count', 'title']
    
    def get_time_ago(self, obj):
        return MarketItemListSerializer().get_time_ago(obj)
    
    def get_is_owner(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.publisher == request.user
        return False
    
    def create(self, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])
        validated_data['publisher'] = self.context['request'].user
        
        post = super().create(validated_data)
        
        # 创建图片
        for index, image in enumerate(uploaded_images):
            HelpPostImage.objects.create(
                post=post, image=image, order=index
            )
        
        return post


class ChatMessageSerializer(serializers.ModelSerializer):
    """私聊消息序列化器"""
    
    sender = UserSimpleSerializer(read_only=True)
    receiver = UserSimpleSerializer(read_only=True)
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatMessage
        fields = [
            'id', 'market_item', 'sender', 'receiver', 'content', 
            'message_type', 'is_read', 'time_ago', 'created_at'
        ]
        read_only_fields = ['sender', 'is_read']
    
    def get_time_ago(self, obj):
        return MarketItemListSerializer().get_time_ago(obj)
    
    def create(self, validated_data):
        validated_data['sender'] = self.context['request'].user
        return super().create(validated_data)


class ChatConversationSerializer(serializers.ModelSerializer):
    """聊天会话序列化器"""
    
    participant1 = UserSimpleSerializer(read_only=True)
    participant2 = UserSimpleSerializer(read_only=True)
    market_item = MarketItemListSerializer(read_only=True)
    last_message = ChatMessageSerializer(read_only=True)
    unread_count = serializers.SerializerMethodField()
    other_user = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatConversation
        fields = [
            'id', 'participant1', 'participant2', 'market_item', 
            'last_message', 'unread_count', 'other_user', 'last_message_time'
        ]
    
    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.get_unread_count(request.user)
        return 0
    
    def get_other_user(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if obj.participant1 == request.user:
                return UserSimpleSerializer(obj.participant2).data
            else:
                return UserSimpleSerializer(obj.participant1).data
        return None


# =============================================================================
# 活动相关序列化器
# =============================================================================

class ActivityImageSerializer(serializers.ModelSerializer):
    """活动图片序列化器"""
    
    class Meta:
        model = ActivityImage
        fields = ['id', 'image', 'order']


class ActivityRegistrationSerializer(serializers.ModelSerializer):
    """活动报名序列化器"""
    
    user = UserSimpleSerializer(read_only=True)
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = ActivityRegistration
        fields = [
            'id', 'user', 'status', 'note', 'contact_phone', 
            'created_at', 'time_ago'
        ]
        read_only_fields = ['user']
    
    def get_time_ago(self, obj):
        from django.utils import timezone
        import datetime
        
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff.days > 0:
            return f"{diff.days}天前"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f"{hours}小时前"
        else:
            minutes = max(diff.seconds // 60, 1)
            return f"{minutes}分钟前"


class ActivityListSerializer(serializers.ModelSerializer):
    """活动列表序列化器"""
    
    organizer = UserSimpleSerializer(read_only=True)
    time_ago = serializers.SerializerMethodField()
    start_time = serializers.DateTimeField(format='%Y-%m-%d %H:%M')
    end_time = serializers.DateTimeField(format='%Y-%m-%d %H:%M')
    registration_progress = serializers.SerializerMethodField()
    can_register = serializers.SerializerMethodField()
    user_registered = serializers.SerializerMethodField()
    
    class Meta:
        model = Activity
        fields = [
            'id', 'title', 'description', 'location', 'start_time', 'end_time',
            'max_participants', 'current_participants', 'status', 'organizer',
            'time_ago', 'view_count', 'registration_progress', 'can_register',
            'user_registered'
        ]
    
    def get_time_ago(self, obj):
        from django.utils import timezone
        import datetime
        
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff.days > 0:
            return f"{diff.days}天前"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f"{hours}小时前"
        else:
            minutes = max(diff.seconds // 60, 1)
            return f"{minutes}分钟前"
    
    def get_registration_progress(self, obj):
        """获取报名进度百分比"""
        if obj.max_participants == 0:
            return 0
        return min(100, (obj.current_participants / obj.max_participants) * 100)
    
    def get_can_register(self, obj):
        """检查是否可以报名"""
        return obj.can_register()
    
    def get_user_registered(self, obj):
        """检查当前用户是否已报名"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return ActivityRegistration.objects.filter(
                activity=obj, user=request.user, status='approved'
            ).exists()
        return False


class ActivityDetailSerializer(serializers.ModelSerializer):
    """活动详情序列化器"""
    
    organizer = UserSimpleSerializer(read_only=True)
    images = ActivityImageSerializer(many=True, read_only=True)
    registrations = ActivityRegistrationSerializer(many=True, read_only=True)
    time_ago = serializers.SerializerMethodField()
    registration_progress = serializers.SerializerMethodField()
    can_register = serializers.SerializerMethodField()
    user_registered = serializers.SerializerMethodField()
    is_organizer = serializers.SerializerMethodField()
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(), write_only=True, required=False
    )
    
    # 重新定义时间字段，用于前端显示和编辑
    start_time = serializers.DateTimeField(format='%Y-%m-%dT%H:%M')
    end_time = serializers.DateTimeField(format='%Y-%m-%dT%H:%M')
    
    class Meta:
        model = Activity
        fields = [
            'id', 'title', 'description', 'location', 'start_time', 'end_time',
            'max_participants', 'current_participants', 'status', 'organizer',
            'is_active', 'require_approval', 'images', 'registrations',
            'time_ago', 'view_count', 'registration_progress', 'can_register',
            'user_registered', 'is_organizer', 'uploaded_images'
        ]
        read_only_fields = ['organizer', 'current_participants', 'view_count']
    
    def get_time_ago(self, obj):
        return ActivityListSerializer().get_time_ago(obj)
    
    def get_registration_progress(self, obj):
        return ActivityListSerializer().get_registration_progress(obj)
    
    def get_can_register(self, obj):
        return obj.can_register()
    
    def get_user_registered(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return ActivityRegistration.objects.filter(
                activity=obj, user=request.user, status='approved'
            ).exists()
        return False
    
    def get_is_organizer(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.organizer == request.user
        return False
    
    def create(self, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])
        validated_data['organizer'] = self.context['request'].user
        
        activity = super().create(validated_data)
        
        # 创建图片
        for index, image in enumerate(uploaded_images):
            ActivityImage.objects.create(
                activity=activity, image=image, order=index
            )
        
        return activity
    
    def update(self, instance, validated_data):
        # 移除上传的图片（如果有的话）
        uploaded_images = validated_data.pop('uploaded_images', None)
        
        # 更新基本信息
        activity = super().update(instance, validated_data)
        
        # 如果有新图片，添加到现有图片后面
        if uploaded_images:
            # 获取当前最大的order值
            max_order = ActivityImage.objects.filter(activity=activity).count()
            
            for index, image in enumerate(uploaded_images):
                ActivityImage.objects.create(
                    activity=activity, image=image, order=max_order + index
                )
        
        return activity


class ActivityCreateSerializer(serializers.ModelSerializer):
    """活动创建序列化器（简化版）"""
    
    start_time = serializers.DateTimeField(format='%Y-%m-%dT%H:%M', input_formats=['%Y-%m-%dT%H:%M'])
    end_time = serializers.DateTimeField(format='%Y-%m-%dT%H:%M', input_formats=['%Y-%m-%dT%H:%M'])
    
    class Meta:
        model = Activity
        fields = [
            'title', 'description', 'location', 'start_time', 'end_time',
            'max_participants', 'require_approval'
        ]
    
    def create(self, validated_data):
        validated_data['organizer'] = self.context['request'].user
        return super().create(validated_data)


class ActivityRegistrationCreateSerializer(serializers.ModelSerializer):
    """活动报名创建序列化器"""
    
    class Meta:
        model = ActivityRegistration
        fields = ['note', 'contact_phone']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        validated_data['activity'] = self.context['activity']
        
        # 如果活动不需要审核，直接设置为已通过
        if not validated_data['activity'].require_approval:
            validated_data['status'] = 'approved'
        else:
            validated_data['status'] = 'pending'
        
        return super().create(validated_data)