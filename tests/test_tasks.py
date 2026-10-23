
import pytest

from config import TestingConfig
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.task import Task
from flask_jwt_extended import create_access_token


@pytest.fixture()
def app():
    app = create_app(TestingConfig)

    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def authenticated_client(app):
    with app.app_context():
        user = User(
            username="taskowner",
            email="owner@example.com"
        )
        user.set_password("TestPass123!")
        db.session.add(user)
        db.session.commit()

        token = create_access_token(identity=str(user.id))

    client = app.test_client()
    client.environ_base["HTTP_AUTHORIZATION"] = f"Bearer {token}"
    return client


# 1. Home endpoint
def test_home_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json["status"] == "success"


# 2. Database health
def test_database_health_endpoint(client):
    response = client.get("/health/db")
    assert response.status_code == 200
    assert response.json["database"] == "connected"


# 3. Create task
def test_create_task(authenticated_client):
    response = authenticated_client.post(
        "/api/tasks/",
        json={
            "title": "Test Task",
            "description": "Testing task creation",
            "priority": "high"
        }
    )

    assert response.status_code == 201
    assert response.json["title"] == "Test Task"
    assert response.json["priority"] == "high"
    assert response.json["status"] == "pending"
    assert response.json["user_id"] is not None


# 4. Get all tasks
def test_get_all_tasks(authenticated_client):
    authenticated_client.post(
        "/api/tasks/",
        json={"title": "First Task"}
    )
    authenticated_client.post(
        "/api/tasks/",
        json={"title": "Second Task"}
    )

    response = authenticated_client.get("/api/tasks/")

    assert response.status_code == 200
    assert len(response.json) == 2


# 5. Get task by ID
def test_get_task_by_id(authenticated_client):
    created = authenticated_client.post(
        "/api/tasks/",
        json={"title": "Learn Flask"}
    )
    task_id = created.json["id"]

    response = authenticated_client.get(f"/api/tasks/{task_id}")

    assert response.status_code == 200
    assert response.json["id"] == task_id
    assert response.json["title"] == "Learn Flask"


# 6. Update task
def test_update_task(authenticated_client):
    created = authenticated_client.post(
        "/api/tasks/",
        json={"title": "Old Task"}
    )
    task_id = created.json["id"]

    response = authenticated_client.put(
        f"/api/tasks/{task_id}",
        json={
            "title": "Updated Task",
            "status": "completed"
        }
    )

    assert response.status_code == 200
    assert response.json["title"] == "Updated Task"
    assert response.json["status"] == "completed"


# 7. Delete task
def test_delete_task(authenticated_client):
    created = authenticated_client.post(
        "/api/tasks/",
        json={"title": "Task to Delete"}
    )
    task_id = created.json["id"]

    response = authenticated_client.delete(f"/api/tasks/{task_id}")

    assert response.status_code == 200
    assert response.json["id"] == task_id

    missing = authenticated_client.get(f"/api/tasks/{task_id}")
    assert missing.status_code == 404


# 8. Missing task
def test_get_missing_task(authenticated_client):
    response = authenticated_client.get("/api/tasks/9999")
    assert response.status_code == 404


# 9. Delete missing task
def test_delete_missing_task(authenticated_client):
    response = authenticated_client.delete("/api/tasks/9999")
    assert response.status_code == 404


# 10. Create task without title
def test_create_task_without_title(authenticated_client):
    response = authenticated_client.post(
        "/api/tasks/",
        json={"description": "Missing title"}
    )

    assert response.status_code == 400
    assert response.json["error"] == "Task title is required"


# 11. Invalid status
def test_update_task_invalid_status(authenticated_client):
    created = authenticated_client.post(
        "/api/tasks/",
        json={"title": "Status Test"}
    )
    task_id = created.json["id"]

    response = authenticated_client.put(
        f"/api/tasks/{task_id}",
        json={"status": "unknown"}
    )

    assert response.status_code == 400
    assert response.json["error"] == "Invalid status"


# 12. Register user
def test_register_user(client):
    response = client.post(
        "/api/auth/register",
        json={
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "TestPass123!"
        }
    )

    assert response.status_code == 201
    assert response.json["user"]["username"] == "newuser"
    assert "password_hash" not in response.json["user"]


# 13. Successful login
def test_login_user(client):
    client.post(
        "/api/auth/register",
        json={
            "username": "loginuser",
            "email": "loginuser@example.com",
            "password": "TestPass123!"
        }
    )

    response = client.post(
        "/api/auth/login",
        json={
            "email": "loginuser@example.com",
            "password": "TestPass123!"
        }
    )

    assert response.status_code == 200
    assert "access_token" in response.json


# 14. Incorrect password
def test_login_invalid_password(client):
    client.post(
        "/api/auth/register",
        json={
            "username": "wrongpassuser",
            "email": "wrongpass@example.com",
            "password": "TestPass123!"
        }
    )

    response = client.post(
        "/api/auth/login",
        json={
            "email": "wrongpass@example.com",
            "password": "WrongPass123!"
        }
    )

    assert response.status_code == 401


# 15. Task endpoint requires authentication
def test_tasks_require_authentication(client):
    response = client.get("/api/tasks/")
    assert response.status_code == 401


# 16. A user cannot access another user's task
def test_user_cannot_access_another_users_task(app):
    with app.app_context():
        first_user = User(
            username="firstuser",
            email="first@example.com"
        )
        first_user.set_password("TestPass123!")

        second_user = User(
            username="seconduser",
            email="second@example.com"
        )
        second_user.set_password("TestPass123!")

        db.session.add_all([first_user, second_user])
        db.session.commit()

        first_token = create_access_token(
            identity=str(first_user.id)
        )
        second_token = create_access_token(
            identity=str(second_user.id)
        )

        task = Task(
            user_id=first_user.id,
            title="Private Task"
        )
        db.session.add(task)
        db.session.commit()
        task_id = task.id

    client = app.test_client()
    client.environ_base["HTTP_AUTHORIZATION"] = f"Bearer {second_token}"

    response = client.get(f"/api/tasks/{task_id}")

    assert response.status_code == 404
