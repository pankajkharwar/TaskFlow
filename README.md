# TaskFlow — Task Management API

TaskFlow is a Python backend project I developed to practise building REST APIs using Flask and MySQL.

The API allows users to register, log in, and manage their own tasks. I also added JWT authentication and automated tests to check that the main features work as expected.

## Features

- User registration and login
- Password hashing
- JWT-based authentication
- Create, view, update, and delete tasks
- Each user can access their own tasks
- Input validation and error handling
- MySQL database integration
- Database migrations
- Automated tests using pytest

## Technologies Used

- Python
- Flask
- Flask-SQLAlchemy
- MySQL
- Flask-Migrate
- Flask-JWT-Extended
- PyMySQL
- python-dotenv
- pytest

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

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/pankajkharwar/TaskFlow.git
cd TaskFlow
```

### 2. Create a virtual environment

On Windows PowerShell:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 3. Install the dependencies

```bash
python -m pip install -r requirements.txt
```

### 4. Set up MySQL

Create a database named `taskflow_db` in MySQL:

```sql
CREATE DATABASE taskflow_db;
```

### 5. Configure environment variables

Create a `.env` file in the project root using `.env.example` as a template.

Set your own values for:

- `SECRET_KEY`
- `JWT_SECRET_KEY`
- `DATABASE_URL`

Use your local MySQL credentials and securely generated secret keys. Do not upload your `.env` file to GitHub.

### 6. Apply database migrations

```bash
flask --app run db upgrade
```

### 7. Start the application

```bash
python run.py
```

The API will be available locally at:

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
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Log in and receive an access token |

### Tasks

All task endpoints require a valid JWT access token.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/tasks/` | Create a task |
| GET | `/api/tasks/` | View your tasks |
| GET | `/api/tasks/<task_id>` | View a task by ID |
| PUT | `/api/tasks/<task_id>` | Update a task |
| DELETE | `/api/tasks/<task_id>` | Delete a task |

For task requests, send your token in the `Authorization` header:

```text
Authorization: Bearer <YOUR_ACCESS_TOKEN>
```

## Running the Tests

Run the tests from the project root:

```bash
python -m pytest tests/test_tasks.py -v
```

The current test suite covers the main API endpoints, registration, login, authentication, input validation, and task ownership.

## What I Learned

While working on TaskFlow, I practised:

- Building REST APIs with Flask
- Connecting Python applications to MySQL
- Working with SQLAlchemy models and database migrations
- Implementing password hashing and JWT authentication
- Writing automated tests with pytest
- Managing environment variables and GitHub repositories

## Future Improvements

I plan to improve the project further by adding more validation, expanding the test suite, and improving the API documentation.

---

**Author:** Pankaj Kharwar
