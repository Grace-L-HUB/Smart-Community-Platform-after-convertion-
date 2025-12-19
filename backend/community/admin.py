from django.contrib import admin
from .models import (
    MarketItem, MarketItemImage, MarketItemFavorite,
    NeighborHelpPost, HelpPostImage, HelpResponse,
    ChatMessage, ChatConversation
)


class MarketItemImageInline(admin.TabularInline):
    model = MarketItemImage
    extra = 0


@admin.register(MarketItem)
class MarketItemAdmin(admin.ModelAdmin):
    list_display = ['title', 'seller', 'price', 'category', 'condition', 'is_sold', 'created_at']
    list_filter = ['category', 'condition', 'is_sold', 'is_active', 'created_at']
    search_fields = ['title', 'description', 'seller__nickname', 'seller__username']
    readonly_fields = ['view_count', 'favorite_count', 'created_at', 'updated_at']
    inlines = [MarketItemImageInline]
    
    fieldsets = (
        ('基本信息', {
            'fields': ('title', 'description', 'price', 'category', 'condition', 'trade_type')
        }),
        ('状态', {
            'fields': ('is_sold', 'is_active')
        }),
        ('统计信息', {
            'fields': ('view_count', 'favorite_count', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


class HelpPostImageInline(admin.TabularInline):
    model = HelpPostImage
    extra = 0


class HelpResponseInline(admin.TabularInline):
    model = HelpResponse
    extra = 0
    readonly_fields = ['responder', 'created_at']


@admin.register(NeighborHelpPost)
class NeighborHelpPostAdmin(admin.ModelAdmin):
    list_display = ['title', 'publisher', 'tag', 'is_urgent', 'is_resolved', 'response_count', 'created_at']
    list_filter = ['tag', 'is_urgent', 'is_resolved', 'is_active', 'created_at']
    search_fields = ['title', 'content', 'publisher__nickname', 'publisher__username']
    readonly_fields = ['response_count', 'view_count', 'created_at', 'updated_at', 'resolved_at']
    inlines = [HelpPostImageInline, HelpResponseInline]
    
    fieldsets = (
        ('基本信息', {
            'fields': ('title', 'content', 'tag', 'phone', 'location')
        }),
        ('状态', {
            'fields': ('is_urgent', 'is_resolved', 'is_active', 'resolved_at')
        }),
        ('统计信息', {
            'fields': ('response_count', 'view_count', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(HelpResponse)
class HelpResponseAdmin(admin.ModelAdmin):
    list_display = ['help_post', 'responder', 'message_preview', 'created_at']
    list_filter = ['created_at']
    search_fields = ['message', 'help_post__title', 'responder__nickname']
    readonly_fields = ['created_at', 'updated_at']
    
    def message_preview(self, obj):
        return obj.message[:50] + '...' if len(obj.message) > 50 else obj.message
    message_preview.short_description = '回复内容预览'


@admin.register(ChatConversation)
class ChatConversationAdmin(admin.ModelAdmin):
    list_display = ['participant1', 'participant2', 'market_item', 'unread_count_p1', 'unread_count_p2', 'last_message_time']
    list_filter = ['created_at', 'last_message_time']
    search_fields = ['participant1__nickname', 'participant2__nickname', 'market_item__title']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['sender', 'receiver', 'market_item', 'message_preview', 'message_type', 'is_read', 'created_at']
    list_filter = ['message_type', 'is_read', 'created_at']
    search_fields = ['content', 'sender__nickname', 'receiver__nickname']
    readonly_fields = ['created_at', 'read_at']
    
    def message_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    message_preview.short_description = '消息预览'


@admin.register(MarketItemFavorite)
class MarketItemFavoriteAdmin(admin.ModelAdmin):
    list_display = ['user', 'item', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__nickname', 'item__title']
    readonly_fields = ['created_at']
