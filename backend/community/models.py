from django.db import models
from django.conf import settings
from django.utils import timezone


class MarketItem(models.Model):
    """二手闲置商品模型"""
    
    CATEGORY_CHOICES = [
        ('家用电器', '家用电器'),
        ('家具', '家具'),
        ('数码产品', '数码产品'),
        ('图书音像', '图书音像'),
        ('服装鞋包', '服装鞋包'),
        ('母婴用品', '母婴用品'),
        ('运动户外', '运动户外'),
        ('其他', '其他'),
    ]
    
    CONDITION_CHOICES = [
        ('全新', '全新'),
        ('99新', '99新'),
        ('95新', '95新'),
        ('9成新', '9成新'),
        ('8成新', '8成新'),
        ('7成新', '7成新'),
    ]
    
    
    title = models.CharField(max_length=200, verbose_name="商品标题")
    description = models.TextField(verbose_name="商品描述")
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="价格")
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, verbose_name="商品类别")
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, verbose_name="成色")
    
    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, 
                              related_name='market_items', verbose_name="卖家")
    
    # 商品状态
    is_sold = models.BooleanField(default=False, verbose_name="是否已售出")
    is_active = models.BooleanField(default=True, verbose_name="是否有效")
    
    # 时间戳
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="发布时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")
    
    # 统计数据
    view_count = models.PositiveIntegerField(default=0, verbose_name="浏览次数")
    favorite_count = models.PositiveIntegerField(default=0, verbose_name="收藏次数")
    
    class Meta:
        db_table = 'community_market_item'
        ordering = ['-created_at']
        verbose_name = "二手商品"
        verbose_name_plural = "二手商品管理"
    
    def __str__(self):
        return self.title


class MarketItemImage(models.Model):
    """商品图片模型"""
    
    item = models.ForeignKey(MarketItem, on_delete=models.CASCADE, 
                            related_name='images', verbose_name="商品")
    image = models.ImageField(upload_to='market_items/', verbose_name="图片")
    order = models.PositiveSmallIntegerField(default=0, verbose_name="排序")
    
    class Meta:
        db_table = 'community_market_item_image'
        ordering = ['order']
        verbose_name = "商品图片"
        verbose_name_plural = "商品图片管理"
    
    def __str__(self):
        return f"{self.item.title} - 图片{self.order}"


class NeighborHelpPost(models.Model):
    """邻居互助求助帖模型"""
    
    TAG_CHOICES = [
        ('急', '急'),
        ('借物', '借物'),
        ('寻物', '寻物'),
        ('帮忙', '帮忙'),
    ]
    
    title = models.CharField(max_length=200, verbose_name="求助标题", blank=True)
    content = models.TextField(verbose_name="求助内容")
    tag = models.CharField(max_length=20, choices=TAG_CHOICES, blank=True, verbose_name="标签")
    
    publisher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                 related_name='help_posts', verbose_name="发布者")
    phone = models.CharField(max_length=15, blank=True, verbose_name="联系电话")
    location = models.CharField(max_length=200, blank=True, verbose_name="位置")
    
    # 状态
    is_urgent = models.BooleanField(default=False, verbose_name="是否紧急")
    is_resolved = models.BooleanField(default=False, verbose_name="是否已解决")
    is_active = models.BooleanField(default=True, verbose_name="是否有效")
    
    # 时间戳
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="发布时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")
    resolved_at = models.DateTimeField(null=True, blank=True, verbose_name="解决时间")
    
    # 统计数据
    view_count = models.PositiveIntegerField(default=0, verbose_name="浏览次数")
    response_count = models.PositiveIntegerField(default=0, verbose_name="回复数量")
    
    class Meta:
        db_table = 'community_help_post'
        ordering = ['-created_at']
        verbose_name = "互助求助帖"
        verbose_name_plural = "互助求助帖管理"
    
    def __str__(self):
        return self.title or f"求助帖-{self.id}"
    
    def save(self, *args, **kwargs):
        # 如果没有标题，自动从内容生成
        if not self.title and self.content:
            self.title = f"【{self.tag or '求助'}】{self.content[:30]}..."
        super().save(*args, **kwargs)


class HelpPostImage(models.Model):
    """求助帖图片模型"""
    
    post = models.ForeignKey(NeighborHelpPost, on_delete=models.CASCADE,
                            related_name='images', verbose_name="求助帖")
    image = models.ImageField(upload_to='help_posts/', verbose_name="图片")
    order = models.PositiveSmallIntegerField(default=0, verbose_name="排序")
    
    class Meta:
        db_table = 'community_help_post_image'
        ordering = ['order']
        verbose_name = "求助帖图片"
        verbose_name_plural = "求助帖图片管理"
    
    def __str__(self):
        return f"{self.post.title} - 图片{self.order}"


class HelpResponse(models.Model):
    """求助回复模型"""
    
    help_post = models.ForeignKey(NeighborHelpPost, on_delete=models.CASCADE,
                                 related_name='responses', verbose_name="求助帖")
    responder = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                 related_name='help_responses', verbose_name="回复者")
    message = models.TextField(verbose_name="回复内容")
    
    # 时间戳
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="回复时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")
    
    class Meta:
        db_table = 'community_help_response'
        ordering = ['created_at']
        verbose_name = "求助回复"
        verbose_name_plural = "求助回复管理"
    
    def __str__(self):
        return f"{self.responder.display_name}回复{self.help_post.title}"


class ChatMessage(models.Model):
    """私聊消息模型"""
    
    MESSAGE_TYPE_CHOICES = [
        ('text', '文本'),
        ('image', '图片'),
        ('system', '系统消息'),
    ]
    
    # 关联商品（可选，用于二手商品咨询）
    market_item = models.ForeignKey(MarketItem, on_delete=models.SET_NULL, 
                                   null=True, blank=True, related_name='chat_messages',
                                   verbose_name="关联商品")
    
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                              related_name='sent_messages', verbose_name="发送者")
    receiver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                related_name='received_messages', verbose_name="接收者")
    
    content = models.TextField(verbose_name="消息内容")
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPE_CHOICES, 
                                   default='text', verbose_name="消息类型")
    
    # 状态
    is_read = models.BooleanField(default=False, verbose_name="是否已读")
    
    # 时间戳
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="发送时间")
    read_at = models.DateTimeField(null=True, blank=True, verbose_name="阅读时间")
    
    class Meta:
        db_table = 'community_chat_message'
        ordering = ['created_at']
        verbose_name = "私聊消息"
        verbose_name_plural = "私聊消息管理"
    
    def __str__(self):
        return f"{self.sender.display_name} -> {self.receiver.display_name}: {self.content[:30]}"


class ChatConversation(models.Model):
    """聊天会话模型（用于管理聊天列表）"""
    
    participant1 = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                    related_name='conversations_as_p1', verbose_name="参与者1")
    participant2 = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                    related_name='conversations_as_p2', verbose_name="参与者2")
    
    # 关联商品（可选）
    market_item = models.ForeignKey(MarketItem, on_delete=models.SET_NULL,
                                   null=True, blank=True, related_name='conversations',
                                   verbose_name="关联商品")
    
    # 最后一条消息信息
    last_message = models.ForeignKey(ChatMessage, on_delete=models.SET_NULL,
                                    null=True, blank=True, verbose_name="最后一条消息")
    last_message_time = models.DateTimeField(auto_now_add=True, verbose_name="最后消息时间")
    
    # 未读消息数
    unread_count_p1 = models.PositiveIntegerField(default=0, verbose_name="参与者1未读数")
    unread_count_p2 = models.PositiveIntegerField(default=0, verbose_name="参与者2未读数")
    
    # 时间戳
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")
    
    class Meta:
        db_table = 'community_chat_conversation'
        ordering = ['-last_message_time']
        verbose_name = "聊天会话"
        verbose_name_plural = "聊天会话管理"
        unique_together = [['participant1', 'participant2', 'market_item']]
    
    def __str__(self):
        return f"{self.participant1.display_name} <-> {self.participant2.display_name}"
    
    def get_unread_count(self, user):
        """获取指定用户的未读消息数"""
        if user == self.participant1:
            return self.unread_count_p1
        elif user == self.participant2:
            return self.unread_count_p2
        return 0
    
    def mark_as_read(self, user):
        """将指定用户的消息标记为已读"""
        if user == self.participant1:
            self.unread_count_p1 = 0
        elif user == self.participant2:
            self.unread_count_p2 = 0
        self.save()


class MarketItemFavorite(models.Model):
    """商品收藏模型"""
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                            related_name='favorite_items', verbose_name="用户")
    item = models.ForeignKey(MarketItem, on_delete=models.CASCADE,
                            related_name='favorited_by', verbose_name="商品")
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="收藏时间")
    
    class Meta:
        db_table = 'community_market_item_favorite'
        unique_together = [['user', 'item']]
        verbose_name = "商品收藏"
        verbose_name_plural = "商品收藏管理"
    
    def __str__(self):
        return f"{self.user.display_name}收藏{self.item.title}"
