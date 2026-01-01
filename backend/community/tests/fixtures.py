"""
community 模块测试数据工厂
使用 factory-boy 生成测试数据
"""
import factory
from factory import fuzzy
from datetime import datetime, timedelta
from django.utils import timezone
from community.models import (
    MarketItem, MarketItemImage, NeighborHelpPost, HelpPostImage, HelpResponse,
    ChatMessage, ChatConversation, MarketItemFavorite,
    Activity, ActivityImage, ActivityRegistration
)
from users.tests.fixtures import UserFactory


class MarketItemFactory(factory.django.DjangoModelFactory):
    """二手商品数据工厂"""
    class Meta:
        model = MarketItem

    title = factory.Faker('sentence')
    description = factory.Faker('text')
    price = fuzzy.FuzzyFloat(10.0, 1000.0)
    category = fuzzy.FuzzyChoice(['appliances', 'furniture', 'electronics', 'books', 'clothing'])
    condition = fuzzy.FuzzyChoice(['new', 'like-new', 'good', 'fair', 'poor'])
    seller = factory.SubFactory(UserFactory)
    is_sold = False
    is_active = True


class MarketItemImageFactory(factory.django.DjangoModelFactory):
    """商品图片数据工厂"""
    class Meta:
        model = MarketItemImage

    item = factory.SubFactory(MarketItemFactory)
    image = factory.Faker('url')
    order = 0


class NeighborHelpPostFactory(factory.django.DjangoModelFactory):
    """邻居互助帖数据工厂"""
    class Meta:
        model = NeighborHelpPost

    title = factory.Faker('sentence')
    content = factory.Faker('text')
    tag = fuzzy.FuzzyChoice(['urgent', 'borrow', 'lost', 'help'])
    publisher = factory.SubFactory(UserFactory)
    phone = factory.Sequence(lambda n: f'138{n:08d}')
    location = factory.Faker('address')
    is_urgent = False
    is_resolved = False
    is_active = True


class HelpPostImageFactory(factory.django.DjangoModelFactory):
    """求助帖图片数据工厂"""
    class Meta:
        model = HelpPostImage

    post = factory.SubFactory(NeighborHelpPostFactory)
    image = factory.Faker('url')
    order = 0


class HelpResponseFactory(factory.django.DjangoModelFactory):
    """求助回复数据工厂"""
    class Meta:
        model = HelpResponse

    help_post = factory.SubFactory(NeighborHelpPostFactory)
    responder = factory.SubFactory(UserFactory)
    message = factory.Faker('text')


class ChatMessageFactory(factory.django.DjangoModelFactory):
    """私聊消息数据工厂"""
    class Meta:
        model = ChatMessage

    sender = factory.SubFactory(UserFactory)
    receiver = factory.SubFactory(UserFactory)
    content = factory.Faker('text')
    message_type = 'text'
    is_read = False


class ChatConversationFactory(factory.django.DjangoModelFactory):
    """聊天会话数据工厂"""
    class Meta:
        model = ChatConversation

    participant1 = factory.SubFactory(UserFactory)
    participant2 = factory.SubFactory(UserFactory)
    unread_count_p1 = 0
    unread_count_p2 = 0


class MarketItemFavoriteFactory(factory.django.DjangoModelFactory):
    """商品收藏数据工厂"""
    class Meta:
        model = MarketItemFavorite

    user = factory.SubFactory(UserFactory)
    item = factory.SubFactory(MarketItemFactory)


class ActivityFactory(factory.django.DjangoModelFactory):
    """社区活动数据工厂"""
    class Meta:
        model = Activity

    title = factory.Faker('sentence')
    description = factory.Faker('text')
    location = factory.Faker('address')
    start_time = factory.LazyFunction(lambda: timezone.now() + timedelta(days=7))
    end_time = factory.LazyFunction(lambda: timezone.now() + timedelta(days=7, hours=3))
    max_participants = 50
    current_participants = 0
    status = 'upcoming'
    organizer = factory.SubFactory(UserFactory)
    is_active = True


class ActivityImageFactory(factory.django.DjangoModelFactory):
    """活动图片数据工厂"""
    class Meta:
        model = ActivityImage

    activity = factory.SubFactory(ActivityFactory)
    image = factory.Faker('url')
    order = 0


class ActivityRegistrationFactory(factory.django.DjangoModelFactory):
    """活动报名数据工厂"""
    class Meta:
        model = ActivityRegistration

    activity = factory.SubFactory(ActivityFactory)
    user = factory.SubFactory(UserFactory)
    status = 'approved'
