# Task Manager API

Task Manager API is a full-stack Django project that combines a Django REST Framework backend with a lightweight HTML, CSS, and JavaScript frontend.

## Features

- User registration, login, and logout with JWT authentication
- Task CRUD APIs scoped to the logged-in user
- Owner-only update and delete protection
- Status filtering for `pending` and `completed` tasks
- Page-number pagination for task listing
- SQLite database for simple local development
- Browser-based frontend served directly by Django

## Project Structure

```text
Task Manager Django Project/
|-- manage.py
|-- db.sqlite3
|-- requirements.txt
|-- README.md
|-- task_manager_api/
|-- tasks/
|-- templates/
`-- static/
```

## Installation

1. Make sure Python 3.14 or later is installed.
2. Install project dependencies:

```bash
pip install --user -r requirements.txt
```

Optional virtual environment:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Run The Project

1. Create database tables:

```bash
python manage.py makemigrations
python manage.py migrate
```

2. Start the development server:

```bash
python manage.py runserver
```

3. Open the app in your browser:

```text
http://127.0.0.1:8000/
```

## Sample API Endpoints

- `POST /api/register/`
- `POST /api/login/`
- `POST /api/logout/`
- `POST /api/token/refresh/`
- `GET /api/tasks/`
- `POST /api/tasks/`
- `GET /api/tasks/<id>/`
- `PATCH /api/tasks/<id>/`
- `DELETE /api/tasks/<id>/`

## Example Request Payloads

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
*** Add File: d:\Task Manager Django Project\.gitignore
.venv/
__pycache__/
*.py[cod]
db.sqlite3
