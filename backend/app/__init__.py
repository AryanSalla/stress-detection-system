"""
app/__init__.py - Flask Application Factory
AI Student Stress Detection System
"""
from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_migrate import Migrate

db      = SQLAlchemy()
jwt     = JWTManager()
migrate = Migrate()

def create_app(config_object=None):
    app = Flask(__name__)
    if config_object is None:
        from config import get_config
        config_object = get_config()
    app.config.from_object(config_object)

    CORS(app, resources={r"/api/*": {"origins": app.config.get("CORS_ORIGINS", ["*"])}}, supports_credentials=True)

    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({"error": "Token has expired", "code": "TOKEN_EXPIRED"}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({"error": "Invalid token", "code": "TOKEN_INVALID"}), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({"error": "Authorization token required", "code": "TOKEN_MISSING"}), 401

    from app.routes.auth       import auth_bp
    from app.routes.quiz       import quiz_bp
    from app.routes.scenario   import scenario_bp
    from app.routes.assessment import assessment_bp
    from app.routes.history    import history_bp
    from app.routes.chatbot    import chatbot_bp
    from app.routes.alerts     import alerts_bp

    app.register_blueprint(auth_bp,       url_prefix="/api/auth")
    app.register_blueprint(quiz_bp,       url_prefix="/api/quiz")
    app.register_blueprint(scenario_bp,   url_prefix="/api/scenario")
    app.register_blueprint(assessment_bp, url_prefix="/api/assessment")
    app.register_blueprint(history_bp,    url_prefix="/api/history")
    app.register_blueprint(chatbot_bp,    url_prefix="/api/chatbot")
    app.register_blueprint(alerts_bp,     url_prefix="/api/alerts")

    @app.route("/api/health")
    def health_check():
        return jsonify({"status": "healthy", "service": "AI Student Stress Detection API", "version": "1.0.0"})

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Endpoint not found"}), 404

    @app.errorhandler(500)
    def internal_error(e):
        db.session.rollback()
        return jsonify({"error": "Internal server error"}), 500

    return app
