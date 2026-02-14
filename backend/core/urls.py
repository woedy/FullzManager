from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PersonViewSet, CreditCardViewSet

router = DefaultRouter()
router.register(r'people', PersonViewSet)
router.register(r'credit-cards', CreditCardViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
