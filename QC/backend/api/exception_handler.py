"""
Custom DRF exception handler that catches unhandled exceptions
(e.g. SQL errors) and returns JSON instead of Django's HTML 500 page.
"""
import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    # Let DRF handle its own exceptions first (validation, auth, etc.)
    response = exception_handler(exc, context)

    if response is not None:
        return response

    # If DRF didn't handle the exception, it's an unhandled server error.
    # Log the full traceback and return a JSON 500.
    logger.exception("Unhandled exception in view: %s", exc)
    return Response(
        {'error': f'Internal server error: {str(exc)}'},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
