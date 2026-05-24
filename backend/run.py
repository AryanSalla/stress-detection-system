"""
============================================================
run.py - Application Entry Point
AI Student Stress Detection System
============================================================
"""

from app import create_app, db
from app.models import (
    User, QuizQuestion, QuizSession, QuizResponse,
    Scenario, ScenarioSession, ScenarioResponse,
    Assessment, Recommendation, ChatSession, ChatMessage, StressAlert
)

app = create_app()


@app.shell_context_processor
def make_shell_context():
    """Makes db and models available in flask shell."""
    return {
        'db': db,
        'User': User,
        'Assessment': Assessment,
        'QuizQuestion': QuizQuestion,
    }


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        print("✅ Database tables ready")
    app.run(host='0.0.0.0', port=5000, debug=True)
