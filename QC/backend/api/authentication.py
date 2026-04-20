from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from rest_framework_simplejwt.settings import api_settings
from django.utils.translation import gettext_lazy as _
from api.models import Users

class CustomJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        """
        Attempts to find and return a user using the given validated token.
        Overrides the default to check our custom unmanaged Users model.
        """
        try:
            user_id = validated_token[api_settings.USER_ID_CLAIM]
        except KeyError:
            raise AuthenticationFailed(_('Token contained no recognizable user identification'))

        try:
            # Token stores the numeric ID
            user = Users.objects.get(id=user_id)
        except Users.DoesNotExist:
            raise AuthenticationFailed(_('User not found'), code='user_not_found')

        # Since it's a minimal unmanaged model, simply return it.
        # DRF expects `is_authenticated` to be True.
        user.is_authenticated = True
        return user
