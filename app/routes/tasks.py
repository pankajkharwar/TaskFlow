
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models.task import Task


tasks_bp = Blueprint("tasks", __name__, url_prefix="/api/tasks")


# Create a new task
@tasks_bp.route("/", methods=["POST"])
@jwt_required()
def create_task():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "A valid JSON body is required"}), 400

    title = data.get("title")

    if not isinstance(title, str) or not title.strip():
        return jsonify({"error": "Task title is required"}), 400

    title = title.strip()

    if len(title) > 150:
        return jsonify({"error": "Title must not exceed 150 characters"}), 400

    description = data.get("description")

    if description is not None and not isinstance(description, str):
        return jsonify({"error": "Description must be a string or null"}), 400

    priority = data.get("priority", "medium")

    if not isinstance(priority, str) or priority not in ["low", "medium", "high"]:
        return jsonify({"error": "Invalid priority"}), 400

    user_id = int(get_jwt_identity())

    task = Task(
        user_id=user_id,
        title=title,
        description=description,
        priority=priority,
        status="pending"
    )

    db.session.add(task)
    db.session.commit()

    return jsonify(task.to_dict()), 201


# Get all tasks belonging to the logged-in user
@tasks_bp.route("/", methods=["GET"])
@jwt_required()
def get_tasks():
    user_id = int(get_jwt_identity())

    tasks = (
        Task.query
        .filter_by(user_id=user_id)
        .order_by(Task.id.asc())
        .all()
    )

    return jsonify([task.to_dict() for task in tasks]), 200


# Get one task by ID
@tasks_bp.route("/<int:task_id>", methods=["GET"])
@jwt_required()
def get_task(task_id):
    user_id = int(get_jwt_identity())

    task = Task.query.filter_by(
        id=task_id,
        user_id=user_id
    ).first()

    if task is None:
        return jsonify({"error": "Task not found"}), 404

    return jsonify(task.to_dict()), 200


# Update a task
@tasks_bp.route("/<int:task_id>", methods=["PUT"])
@jwt_required()
def update_task(task_id):
    user_id = int(get_jwt_identity())

    task = Task.query.filter_by(
        id=task_id,
        user_id=user_id
    ).first()

    if task is None:
        return jsonify({"error": "Task not found"}), 404

    data = request.get_json(silent=True)

    if not isinstance(data, dict) or not data:
        return jsonify({"error": "Valid JSON request body is required"}), 400

    if "title" in data:
        title = data["title"]

        if not isinstance(title, str) or not title.strip():
            return jsonify({"error": "Title cannot be empty"}), 400

        title = title.strip()

        if len(title) > 150:
            return jsonify({"error": "Title must not exceed 150 characters"}), 400

        task.title = title

    if "description" in data:
        description = data["description"]

        if description is not None and not isinstance(description, str):
            return jsonify({"error": "Description must be a string or null"}), 400

        task.description = description

    if "priority" in data:
        priority = data["priority"]

        if not isinstance(priority, str) or priority not in ["low", "medium", "high"]:
            return jsonify({"error": "Invalid priority"}), 400

        task.priority = priority

    if "status" in data:
        status = data["status"]

        if not isinstance(status, str) or status not in [
            "pending", "in_progress", "completed"
        ]:
            return jsonify({"error": "Invalid status"}), 400

        task.status = status

    db.session.commit()

    return jsonify(task.to_dict()), 200


# Delete a task
@tasks_bp.route("/<int:task_id>", methods=["DELETE"])
@jwt_required()
def delete_task(task_id):
    user_id = int(get_jwt_identity())

    task = Task.query.filter_by(
        id=task_id,
        user_id=user_id
    ).first()

    if task is None:
        return jsonify({"error": "Task not found"}), 404

    db.session.delete(task)
    db.session.commit()

    return jsonify({
        "message": "Task deleted successfully",
        "id": task_id
    }), 200
