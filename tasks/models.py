from django.conf import settings
from django.db import models


class Task(models.Model):
    """Represents a task owned by a single authenticated user."""

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        COMPLETED = 'completed', 'Completed'

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tasks',
    )

    class Meta:
        ordering = ['-created_at', '-id']

    def __str__(self) -> str:
        return f'{self.title} ({self.user})'
