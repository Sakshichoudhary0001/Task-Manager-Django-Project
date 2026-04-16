from django.contrib import admin
from django.urls import include, path

from tasks.views import FrontendAppView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('tasks.urls')),
    path('', FrontendAppView.as_view(), name='frontend'),
]
