# Task Manager API

A full-stack Django project with a Django REST Framework backend and a lightweight HTML, CSS, and JavaScript frontend.

## Features

- User registration, login, and logout with JWT authentication
- Task CRUD APIs scoped to the logged-in user
- Owner-only update and delete protection
- Status filtering for `pending` and `completed` tasks
- Page-number pagination for task lists
- SQLite database for local development
- Frontend served by Django templates and static assets

## Repository Structure

```text
Task Manager Django Project/
├── manage.py
├── README.md
├── requirements.txt
├── .gitignore
├── db.sqlite3
├── task_manager_api/
├── tasks/
├── templates/
└── static/
```

## Requirements

- Python 3.14+
- Django 6.0+
- Django REST Framework
- Django Filter
- djangorestframework-simplejwt

## Setup

1. Create and activate a virtual environment:

```bash
python -m venv .venv
.venv\Scripts\activate
```

2. Install project dependencies:

```bash
pip install -r requirements.txt
```

3. Create the database tables:

```bash
python manage.py makemigrations
python manage.py migrate
```

4. Start the development server:

```bash
python manage.py runserver
```

5. Open the app in your browser:

```text
http://127.0.0.1:8000/
```

## Testing

Run the built-in test suite:

```bash
python manage.py test
```

## API Endpoints

- `POST /api/register/`
- `POST /api/login/`
- `POST /api/logout/`
- `GET /api/tasks/`
- `POST /api/tasks/`
- `GET /api/tasks/<id>/`
- `PATCH /api/tasks/<id>/`
- `DELETE /api/tasks/<id>/`

## Example Payloads

Register:

```json
{
  "username": "sakshi",
  "email": "sakshi@example.com",
  "password": "StrongPass123!"
}
```

Login:

```json
{
  "username": "sakshi",
  "password": "StrongPass123!"
}
```

Create task:

```json
{
  "title": "Finish backend API",
  "description": "Implement serializers, JWT auth, and CRUD endpoints.",
  "status": "pending"
}
```

## Notes

- The project uses `db.sqlite3` for local development.
- Do not commit secret keys or environment files in production.
- For production, set `DEBUG = False`, provide a secure `SECRET_KEY`, and use a production database.
*** Add File: d:\Task Manager Django Project\.gitignore
.venv/
__pycache__/
*.py[cod]
db.sqlite3

http://127.0.0.1:8000/
