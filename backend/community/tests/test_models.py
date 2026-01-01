"""
Community module model tests
Tests community interaction related models
"""
import pytest
from datetime import datetime, timedelta
from django.utils import timezone
from community.models import (
    MarketItem, MarketItemImage, NeighborHelpPost, HelpResponse,
    ChatMessage, ChatConversation, MarketItemFavorite,
    Activity, ActivityRegistration
)
from community.tests.fixtures import (
    MarketItemFactory, MarketItemImageFactory,
    NeighborHelpPostFactory, HelpResponseFactory,
    ChatMessageFactory, ChatConversationFactory,
    MarketItemFavoriteFactory, ActivityFactory,
    ActivityRegistrationFactory
)
from users.tests.fixtures import UserFactory


class TestMarketItem:
    """MarketItem model tests"""

    @pytest.mark.django_db
    def test_create_market_item(self):
        """Test creating used item"""
        item = MarketItemFactory(
            title='used-fridge',
            price=500.00,
            category='appliances',
            condition='like-new'
        )
        assert item.title == 'used-fridge'
        assert item.price == 500.00
        assert item.is_sold is False
        assert item.is_active is True

    @pytest.mark.django_db
    def test_market_item_str_representation(self):
        """Test item string representation"""
        item = MarketItemFactory(title='used-fridge')
        assert str(item) == 'used-fridge'


class TestMarketItemImage:
    """MarketItemImage model tests"""

    @pytest.mark.django_db
    def test_create_market_item_image(self):
        """Test creating item image"""
        image = MarketItemImageFactory(order=1)
        assert image.order == 1
        assert image.item is not None


class TestNeighborHelpPost:
    """NeighborHelpPost model tests"""

    @pytest.mark.django_db
    def test_create_help_post(self):
        """Test creating help post"""
        post = NeighborHelpPostFactory(
            title='borrow-ladder',
            content='Does anyone have a ladder I can borrow?',
            tag='borrow',
            is_urgent=False,
            is_resolved=False
        )
        assert post.title == 'borrow-ladder'
        assert post.tag == 'borrow'
        assert post.is_resolved is False

    @pytest.mark.django_db
    def test_help_post_auto_generate_title(self):
        """Test auto generate title"""
        post = NeighborHelpPostFactory(
            title='',
            content='Does anyone have a ladder I can borrow?',
            tag='borrow'
        )
        # Title should be auto generated on save
        post.save()
        assert post.title is not None
        # Title contains part of the content
        assert post.title.endswith('...')

    @pytest.mark.django_db
    def test_help_post_str_representation(self):
        """Test help post string representation"""
        post = NeighborHelpPostFactory(title='borrow-ladder')
        assert str(post) == 'borrow-ladder'

        # No title case - title is auto-generated with tag prefix
        # The auto-generated title contains the tag, just verify it's not empty
        post_no_title = NeighborHelpPostFactory(title='')
        post_no_title.save()  # Trigger auto-title generation
        assert str(post_no_title) != ''
        assert post_no_title.title != ''


class TestHelpResponse:
    """HelpResponse model tests"""

    @pytest.mark.django_db
    def test_create_help_response(self):
        """Test creating help response"""
        response = HelpResponseFactory(
            message='I have a ladder you can borrow'
        )
        assert response.message == 'I have a ladder you can borrow'
        assert response.help_post is not None
        assert response.responder is not None

    @pytest.mark.django_db
    def test_help_response_str_representation(self):
        """Test response string representation"""
        post = NeighborHelpPostFactory(title='borrow-ladder')
        responder = UserFactory(nickname='user1')
        response = HelpResponseFactory(
            help_post=post,
            responder=responder
        )
        str_repr = str(response)
        assert 'user1' in str_repr
        assert 'borrow-ladder' in str_repr


class TestChatMessage:
    """ChatMessage model tests"""

    @pytest.mark.django_db
    def test_create_chat_message(self):
        """Test creating chat message"""
        sender = UserFactory()
        receiver = UserFactory()
        message = ChatMessageFactory(
            sender=sender,
            receiver=receiver,
            content='hello is the item still available',
            message_type='text'
        )
        assert message.content == 'hello is the item still available'
        assert message.message_type == 'text'
        assert message.is_read is False

    @pytest.mark.django_db
    def test_chat_message_str_representation(self):
        """Test chat message string representation"""
        sender = UserFactory(nickname='user1')
        receiver = UserFactory(nickname='user2')
        message = ChatMessageFactory(
            sender=sender,
            receiver=receiver,
            content='this is a very long message to test truncation'
        )
        str_repr = str(message)
        assert 'user1' in str_repr
        assert 'user2' in str_repr
        assert 'this is a very long message' in str_repr


class TestChatConversation:
    """ChatConversation model tests"""

    @pytest.mark.django_db
    def test_create_chat_conversation(self):
        """Test creating chat conversation"""
        conv = ChatConversationFactory(
            unread_count_p1=2,
            unread_count_p2=0
        )
        assert conv.participant1 is not None
        assert conv.participant2 is not None
        assert conv.unread_count_p1 == 2
        assert conv.unread_count_p2 == 0

    @pytest.mark.django_db
    def test_get_unread_count(self):
        """Test getting unread count"""
        conv = ChatConversationFactory(unread_count_p1=5, unread_count_p2=3)

        assert conv.get_unread_count(conv.participant1) == 5
        assert conv.get_unread_count(conv.participant2) == 3

        # Third party user returns 0
        other_user = UserFactory()
        assert conv.get_unread_count(other_user) == 0

    @pytest.mark.django_db
    def test_mark_as_read(self):
        """Test mark as read"""
        conv = ChatConversationFactory(unread_count_p1=5, unread_count_p2=3)

        conv.mark_as_read(conv.participant1)
        conv.refresh_from_db()
        assert conv.unread_count_p1 == 0
        assert conv.unread_count_p2 == 3

        conv.mark_as_read(conv.participant2)
        conv.refresh_from_db()
        assert conv.unread_count_p2 == 0

    @pytest.mark.django_db
    def test_conversation_str_representation(self):
        """Test conversation string representation"""
        p1 = UserFactory(nickname='user1')
        p2 = UserFactory(nickname='user2')
        conv = ChatConversationFactory(
            participant1=p1,
            participant2=p2
        )
        str_repr = str(conv)
        assert 'user1' in str_repr
        assert 'user2' in str_repr

    @pytest.mark.django_db
    def test_conversation_unique_constraint(self):
        """Test conversation unique constraint"""
        p1 = UserFactory()
        p2 = UserFactory()
        item = MarketItemFactory()

        ChatConversationFactory(
            participant1=p1,
            participant2=p2,
            market_item=item
        )

        # Same participants and item should violate unique constraint
        with pytest.raises(Exception):  # IntegrityError
            ChatConversationFactory(
                participant1=p1,
                participant2=p2,
                market_item=item
            )


class TestMarketItemFavorite:
    """MarketItemFavorite model tests"""

    @pytest.mark.django_db
    def test_create_favorite(self):
        """Test creating favorite"""
        favorite = MarketItemFavoriteFactory()
        assert favorite.user is not None
        assert favorite.item is not None

    @pytest.mark.django_db
    def test_favorite_unique_constraint(self):
        """Test favorite unique constraint"""
        user = UserFactory()
        item = MarketItemFactory()

        MarketItemFavoriteFactory(user=user, item=item)

        # Duplicate favorite should violate unique constraint
        with pytest.raises(Exception):  # IntegrityError
            MarketItemFavoriteFactory(user=user, item=item)

    @pytest.mark.django_db
    def test_favorite_str_representation(self):
        """Test favorite string representation"""
        user = UserFactory(nickname='user1')
        item = MarketItemFactory(title='used-fridge')
        favorite = MarketItemFavoriteFactory(user=user, item=item)
        str_repr = str(favorite)
        assert 'user1' in str_repr
        assert 'used-fridge' in str_repr


class TestActivity:
    """Activity model tests"""

    @pytest.mark.django_db
    def test_create_activity(self):
        """Test creating activity"""
        activity = ActivityFactory(
            title='community-badminton',
            max_participants=30,
            current_participants=5
        )
        assert activity.title == 'community-badminton'
        assert activity.max_participants == 30
        assert activity.current_participants == 5

    @pytest.mark.django_db
    def test_activity_update_status_upcoming(self):
        """Test updating activity status - upcoming"""
        now = timezone.now()
        activity = ActivityFactory(
            start_time=now + timedelta(days=1),
            end_time=now + timedelta(days=1, hours=2)
        )
        activity.update_status()
        assert activity.status == 'upcoming'

    @pytest.mark.django_db
    def test_activity_update_status_ongoing(self):
        """Test updating activity status - ongoing"""
        now = timezone.now()
        activity = ActivityFactory(
            start_time=now - timedelta(hours=1),
            end_time=now + timedelta(hours=1)
        )
        activity.update_status()
        assert activity.status == 'ongoing'

    @pytest.mark.django_db
    def test_activity_update_status_ended(self):
        """Test updating activity status - ended"""
        now = timezone.now()
        activity = ActivityFactory(
            start_time=now - timedelta(days=1),
            end_time=now - timedelta(days=1, hours=-2)
        )
        activity.update_status()
        assert activity.status == 'ended'

    @pytest.mark.django_db
    def test_activity_can_register(self):
        """Test if can register"""
        activity = ActivityFactory(
            is_active=True,
            status='upcoming',
            max_participants=50,
            current_participants=30
        )
        assert activity.can_register() is True

        # Activity inactive
        activity.is_active = False
        assert activity.can_register() is False

        # Full capacity
        activity.is_active = True
        activity.current_participants = 50
        assert activity.can_register() is False

    @pytest.mark.django_db
    def test_activity_auto_update_on_save(self):
        """Test auto update status on save"""
        now = timezone.now()
        activity = ActivityFactory(
            start_time=now - timedelta(hours=1),
            end_time=now + timedelta(hours=1)
        )
        # Status should auto update to ongoing after save
        activity.save()
        assert activity.status == 'ongoing'


class TestActivityRegistration:
    """ActivityRegistration model tests"""

    @pytest.mark.django_db
    def test_create_registration(self):
        """Test creating activity registration"""
        registration = ActivityRegistrationFactory(
            status='approved'
        )
        assert registration.status == 'approved'
        # New approved registration should increase participant count
        registration.activity.refresh_from_db()
        assert registration.activity.current_participants == 1

    @pytest.mark.django_db
    def test_registration_status_change(self):
        """Test registration status change"""
        registration = ActivityRegistrationFactory(status='approved')
        activity = registration.activity

        # Cancel registration should decrease participant count
        registration.status = 'cancelled'
        registration.save()
        activity.refresh_from_db()
        assert activity.current_participants == 0

    @pytest.mark.django_db
    def test_registration_delete(self):
        """Test deleting registration"""
        registration = ActivityRegistrationFactory(status='approved')
        activity = registration.activity
        activity.refresh_from_db()  # Refresh to get updated participant count
        participants = activity.current_participants

        registration.delete()
        activity.refresh_from_db()
        assert activity.current_participants == participants - 1

    @pytest.mark.django_db
    def test_registration_unique_constraint(self):
        """Test registration unique constraint"""
        activity = ActivityFactory()
        user = UserFactory()

        ActivityRegistrationFactory(activity=activity, user=user)

        # Duplicate registration should violate unique constraint
        with pytest.raises(Exception):  # IntegrityError
            ActivityRegistrationFactory(activity=activity, user=user)

    @pytest.mark.django_db
    def test_registration_str_representation(self):
        """Test registration string representation"""
        user = UserFactory(nickname='user1')
        activity = ActivityFactory(title='community-badminton')
        registration = ActivityRegistrationFactory(
            user=user,
            activity=activity
        )
        str_repr = str(registration)
        assert 'user1' in str_repr
        assert 'community-badminton' in str_repr
