
# TaskFlow — Task Management REST API

TaskFlow is a task management backend built with Python, Flask, and MySQL. It provides REST API endpoints for managing tasks, user registration, and JWT-based authentication.

## Features

- User registration and login
- Password hashing
- JWT access-token authentication
- Create, read, update, and delete tasks (CRUD)
- User-specific task access
- Input validation and error responses
- MySQL database integration with SQLAlchemy
- Database migrations using Flask-Migrate
- Automated tests using pytest

## Tech Stack

- **Language:** Python
- **Backend:** Flask
- **Database:** MySQL
- **ORM:** Flask-SQLAlchemy
- **Migrations:** Flask-Migrate
- **Authentication:** Flask-JWT-Extended
- **Testing:** pytest
- **Database Driver:** PyMySQL

## Project Structure

```text
TaskFlow/
├── app/
│   ├── models/
│   │   ├── __init__.py
│   │   ├── task.py
│   │   └── user.py
│   ├── routes/
│   │   ├── auth.py
│   │   └── tasks.py
│   ├── extensions.py
│   └── __init__.py
├── migrations/
├── tests/
│   └── test_tasks.py
├── .env.example
├── .gitignore
├── config.py
├── requirements.txt
├── run.py
└── README.md
```

## Prerequisites

Before running TaskFlow, install:

- Python
- MySQL Server
- pip

## Installation

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd TaskFlow
```

Replace the placeholder with your repository URL after uploading the project to GitHub.

### 2. Create and activate a virtual environment

Windows PowerShell:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 3. Install dependencies

```bash
python -m pip install -r requirements.txt
```

### 4. Create the database

Create a MySQL database named `taskflow_db` using MySQL Workbench or the MySQL command line.

```sql
CREATE DATABASE taskflow_db;
```

Use a MySQL account that has permission to access this database.

### 5. Configure environment variables

Create a `.env` file in the project root using `.env.example` as a template.

Set the following variables with your own local values:

```dotenv
SECRET_KEY=your-generated-flask-secret
JWT_SECRET_KEY=your-generated-jwt-secret
DATABASE_URL=mysql+pymysql://username:password@localhost:3306/taskflow_db
```

Replace the placeholders with your own credentials and securely generated secret keys.

**Security:** Never commit `.env` or real passwords and secret keys to GitHub.

### 6. Apply database migrations

```bash
flask --app run db upgrade
```

### 7. Start the application

```bash
python run.py
```

The development server runs at:

`http://127.0.0.1:5000`

## API Endpoints

### General

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Check whether the API is running |
| GET | `/health/db` | Check database connectivity |

### Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Log in and obtain a JWT access token |

### Tasks

All task endpoints require a valid JWT access token.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/tasks/` | Create a task |
| GET | `/api/tasks/` | Retrieve the current user's tasks |
| GET | `/api/tasks/<task_id>` | Retrieve a task by ID |
| PUT | `/api/tasks/<task_id>` | Update a task |
| DELETE | `/api/tasks/<task_id>` | Delete a task |

Send the token in the HTTP request header:

```text
Authorization: Bearer <YOUR_ACCESS_TOKEN>
```

### Example: Register a user

Send a POST request to `/api/auth/register` with JSON:

```json
{
  "username": "demo_user",
  "email": "demo@example.com",
  "password": "use-a-strong-password"
}
```

### Example: Create a task

Send a POST request to `/api/tasks/` with a valid token and JSON:

```json
{
  "title": "Complete Python project",
  "description": "Finish the TaskFlow API",
  "priority": "high"
}
```

Supported priorities are `low`, `medium`, and `high`.

Supported task statuses are `pending`, `in_progress`, and `completed`.

## Running Tests

Run the automated test suite from the project root:

```bash
python -m pytest tests/test_tasks.py -v
```

The test suite covers application health, task CRUD operations, authentication, validation, and user-specific task access.

## Security Notes

- Passwords are stored as hashes rather than plain text.
- Task endpoints require JWT authentication.
- Task operations are scoped to the authenticated user.
- Secret keys and database credentials must be kept out of version control.
- Use a production-ready WSGI server and appropriate production configuration before deployment.

## Project Status

TaskFlow is an ongoing backend portfolio project. Features and tests may evolve as development continues.

## Author

Developed as a Python backend learning and portfolio project.
