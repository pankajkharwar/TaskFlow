# TaskFlow — Full-Stack Task Management System

TaskFlow is a full-stack task management application I built while learning Python backend development and web development.

It allows users to create an account, log in, and manage their own tasks through a dashboard. The application combines a Flask REST API with a web interface built using HTML, CSS, and JavaScript.

I am building this project to improve my programming skills, practise debugging and problem-solving, and understand how a complete web application works.

## Features

### User Authentication
- User registration and login
- Password hashing
- JWT-based authentication
- Protected task endpoints
- User-specific task access

### Task Management
- Create, view, edit, and delete tasks
- Set task priorities: Low, Medium, and High
- Update task status: Pending, In Progress, and Completed
- Search tasks by title or description
- Filter tasks by status and priority
- View task statistics on the dashboard

### Backend and Database
- REST API built with Flask
- MySQL database integration using SQLAlchemy
- Database migrations with Flask-Migrate
- Input validation and error handling
- Automated tests using pytest

### Frontend
- Dashboard interface built with HTML and CSS
- JavaScript integration with the Flask API
- Login and registration forms
- Task list, filters, and dashboard statistics
- Responsive layout for different screen sizes

## Technologies Used

**Backend**
- Python
- Flask
- Flask-SQLAlchemy
- MySQL
- Flask-Migrate
- Flask-JWT-Extended
- PyMySQL
- python-dotenv

**Frontend**
- HTML
- CSS
- JavaScript

**Testing and Tools**
- pytest
- Git and GitHub

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
│   ├── static/
│   │   ├── css/
│   │   │   └── style.css
│   │   └── js/
│   │       └── app.js
│   ├── templates/
│   │   └── index.html
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

### 2. Create and activate a virtual environment

On Windows PowerShell:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 3. Install dependencies

```bash
python -m pip install -r requirements.txt
```

### 4. Set up MySQL

Create a database in MySQL:

```sql
CREATE DATABASE taskflow_db;
```

### 5. Configure environment variables

Create a `.env` file in the project root using `.env.example` as a template.

Configure these variables with your own values:

- `SECRET_KEY`
- `JWT_SECRET_KEY`
- `DATABASE_URL`

Use your local MySQL credentials and securely generated secret keys. Never commit your actual `.env` file or expose database passwords and secret keys.

### 6. Apply database migrations

```bash
flask --app run db upgrade
```

### 7. Start the application

```bash
python run.py
```

Open the dashboard in your browser:

http://127.0.0.1:5000/dashboard

The API root endpoint is available at:

http://127.0.0.1:5000/

The database health endpoint is available at:

http://127.0.0.1:5000/health/db

## API Endpoints

### General

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Check API status |
| GET | `/health/db` | Check database connectivity |
| GET | `/dashboard` | Open the web dashboard |

### Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Log in and receive a JWT |

### Tasks

All task endpoints require a valid JWT access token.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/tasks/` | Create a task |
| GET | `/api/tasks/` | List your tasks |
| GET | `/api/tasks/<task_id>` | Get a task by ID |
| PUT | `/api/tasks/<task_id>` | Update a task |
| DELETE | `/api/tasks/<task_id>` | Delete a task |

Send the access token in the `Authorization` header:

```text
Authorization: Bearer <YOUR_ACCESS_TOKEN>
```

## Running the Tests

Run the automated tests from the project root:

```bash
python -m pytest -v
```

The current test suite covers the main API endpoints, user registration and login, authentication requirements, input validation, and task ownership.

## What I Learned

While building TaskFlow, I practised:

- Designing REST APIs with Flask
- Connecting Python applications to MySQL
- Using SQLAlchemy models and database migrations
- Implementing password hashing and JWT authentication
- Connecting a JavaScript frontend to backend APIs
- Managing application state and handling API errors
- Writing automated tests with pytest
- Debugging issues and using Git for version control

## Future Improvements

- Improve automated test coverage
- Expand API documentation
- Review authentication and frontend security for production use
- Deploy the application online
- Add further task management features

## Author

**Pankaj Kharwar**

GitHub: https://github.com/pankajkharwar

---

This project is part of my ongoing learning journey in Python, backend development, and full-stack web development.