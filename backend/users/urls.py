from django.urls import path
from .views import LoginView, SendSMSCodeView, VerifyCodeView, SMSLoginView, SMSRegisterView

urlpatterns = [
    path('auth/login', LoginView.as_view(), name='login'),
    path('auth/send-sms-code', SendSMSCodeView.as_view(), name='send_sms_code'),
    path('auth/verify-code', VerifyCodeView.as_view(), name='verify_code'),
    path('auth/sms-login', SMSLoginView.as_view(), name='sms_login'),
    path('auth/sms-register', SMSRegisterView.as_view(), name='sms_register'),
]