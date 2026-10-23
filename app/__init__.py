
from flask import Flask
from sqlalchemy import text
from config import Config, TestingConfig
from app.extensions import db, migrate, jwt
from app.models.task import Task
from app.routes.tasks import tasks_bp
from app.models.user import User
from app.routes.auth import auth_bp


def create_app(test_config=None):
    app = Flask(__name__)

    if test_config is None:
        app.config.from_object(Config)
    else:
        app.config.from_object(test_config)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    app.register_blueprint(tasks_bp)
    app.register_blueprint(auth_bp)

    @app.get("/health/db")
    def database_health():
        try:
            db.session.execute(text("SELECT 1"))
            return {
                "database": "connected",
                "status": "success"
            }, 200
        except Exception:
            app.logger.exception("Database health check failed")
            return {
                "database": "disconnected",
                "status": "error"
            }, 500

    @app.get("/")
    def home():
        return {
            "message": "TaskFlow API is running!",
            "status": "success"
        }

    return app
