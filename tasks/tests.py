from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Task

User = get_user_model()


class TaskManagerApiTests(APITestCase):
    """High-value API tests for auth, scoping, validation, and filtering."""

    def setUp(self):
        self.owner_password = 'OwnerPass123!'
        self.other_password = 'OtherPass123!'
        self.owner = User.objects.create_user(
            username='owner',
            email='owner@example.com',
            password=self.owner_password,
        )
        self.other_user = User.objects.create_user(
            username='other',
            email='other@example.com',
            password=self.other_password,
        )

    def authenticate(self, username='owner', password=None):
        password = password or self.owner_password
        response = self.client.post(
            reverse('login'),
            {'username': username, 'password': password},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {response.data['access']}"
        )
        return response.data

    def test_register_creates_user(self):
        response = self.client.post(
            reverse('register'),
            {
                'username': 'new-user',
                'email': 'new-user@example.com',
                'password': 'StrongPass123!',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='new-user').exists())

    def test_login_returns_tokens_and_user_data(self):
        response = self.client.post(
            reverse('login'),
            {'username': 'owner', 'password': self.owner_password},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['username'], 'owner')

    def test_task_list_is_paginated_and_scoped_to_authenticated_user(self):
        Task.objects.create(user=self.owner, title='Write docs')
        Task.objects.create(
            user=self.owner,
            title='Ship feature',
            status=Task.Status.COMPLETED,
        )
        Task.objects.create(user=self.other_user, title='Hidden task')

        self.authenticate()
        response = self.client.get(reverse('task-list'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)
        self.assertEqual(response.data['current_page'], 1)
        self.assertEqual(len(response.data['results']), 2)
        titles = {task['title'] for task in response.data['results']}
        self.assertSetEqual(titles, {'Write docs', 'Ship feature'})

    def test_task_filter_returns_only_matching_status(self):
        Task.objects.create(user=self.owner, title='Pending work')
        Task.objects.create(
            user=self.owner,
            title='Finished work',
            status=Task.Status.COMPLETED,
        )

        self.authenticate()
        response = self.client.get(
            reverse('task-list'),
            {'status': Task.Status.COMPLETED},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(
            response.data['results'][0]['status'],
            Task.Status.COMPLETED,
        )

    def test_blank_task_title_is_rejected(self):
        self.authenticate()
        response = self.client.post(
            reverse('task-list'),
            {
                'title': '   ',
                'description': 'Missing a real title',
                'status': Task.Status.PENDING,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('title', response.data)

    def test_only_owner_can_modify_a_task(self):
        task = Task.objects.create(user=self.other_user, title='Protected task')

        self.authenticate()
        update_response = self.client.patch(
            reverse('task-detail', args=[task.id]),
            {'title': 'Changed title'},
            format='json',
        )
        delete_response = self.client.delete(reverse('task-detail', args=[task.id]))

        self.assertEqual(update_response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(delete_response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Task.objects.filter(id=task.id).exists())
