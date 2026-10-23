
from datetime import timedelta

from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError
from flask_jwt_extended import create_access_token

from app.extensions import db
from app.models.user import User


auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


# Register a new user
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "A valid JSON body is required"}), 400

    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not all(isinstance(value, str) for value in (username, email, password)):
        return jsonify({
            "error": "Username, email and password are required"
        }), 400

    username = username.strip()
    email = email.strip().lower()

    if not username or len(username) > 80:
        return jsonify({"error": "Username must be 1–80 characters"}), 400

    if not email or len(email) > 120 or "@" not in email:
        return jsonify({"error": "A valid email is required"}), 400

    if len(password) < 8:
        return jsonify({
            "error": "Password must be at least 8 characters"
        }), 400

    user = User(
        username=username,
        email=email
    )
    user.set_password(password)

    try:
        db.session.add(user)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({
            "error": "Username or email already exists"
        }), 409

    return jsonify({
        "message": "User registered successfully",
        "user": user.to_dict()
    }), 201


# Log in an existing user
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "A valid JSON body is required"}), 400

    email = data.get("email")
    password = data.get("password")

    if not isinstance(email, str) or not isinstance(password, str):
        return jsonify({"error": "Email and password are required"}), 400

    user = User.query.filter_by(email=email.strip().lower()).first()

    if user is None or not user.check_password(password):
        return jsonify({"error": "Invalid email or password"}), 401

    access_token = create_access_token(
        identity=str(user.id),
        expires_delta=timedelta(hours=1)
    )

    return jsonify({
        "message": "Login successful",
        "access_token": access_token,
        "user": user.to_dict()
    }), 200
