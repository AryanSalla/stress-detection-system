"""
app/models/__init__.py - SQLAlchemy ORM Models
AI Student Stress Detection System
"""
from datetime import datetime
from app import db
import bcrypt


class User(db.Model):
    __tablename__ = "users"
    id            = db.Column(db.Integer, primary_key=True)
    username      = db.Column(db.String(50), unique=True, nullable=False)
    email         = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name     = db.Column(db.String(100))
    age           = db.Column(db.Integer)
    gender        = db.Column(db.Enum("male","female","other","prefer_not_to_say"), default="prefer_not_to_say")
    institution   = db.Column(db.String(150))
    course        = db.Column(db.String(100))
    year_of_study = db.Column(db.Integer)
    is_active     = db.Column(db.Boolean, default=True)
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at    = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    quiz_sessions     = db.relationship("QuizSession",     backref="user", lazy="dynamic")
    scenario_sessions = db.relationship("ScenarioSession", backref="user", lazy="dynamic")
    assessments       = db.relationship("Assessment",      backref="user", lazy="dynamic")
    chat_sessions     = db.relationship("ChatSession",     backref="user", lazy="dynamic")
    alerts            = db.relationship("StressAlert",     backref="user", lazy="dynamic")

    def set_password(self, plain_password):
        self.password_hash = bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    def check_password(self, plain_password):
        return bcrypt.checkpw(plain_password.encode("utf-8"), self.password_hash.encode("utf-8"))

    def to_dict(self):
        return {
            "id": self.id, "username": self.username, "email": self.email,
            "full_name": self.full_name, "age": self.age,
            "institution": self.institution, "course": self.course,
            "year_of_study": self.year_of_study,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class QuizQuestion(db.Model):
    __tablename__ = "quiz_questions"
    id            = db.Column(db.Integer, primary_key=True)
    question_text = db.Column(db.Text, nullable=False)
    category      = db.Column(db.Enum("academic","social","physical","emotional","financial"), nullable=False)
    weight        = db.Column(db.Numeric(4,2), default=1.0)
    order_num     = db.Column(db.Integer, nullable=False)
    is_active     = db.Column(db.Boolean, default=True)
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)
    def to_dict(self):
        return {"id": self.id, "question_text": self.question_text,
                "category": self.category, "weight": float(self.weight), "order_num": self.order_num}


class QuizSession(db.Model):
    __tablename__ = "quiz_sessions"
    id               = db.Column(db.Integer, primary_key=True)
    user_id          = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    session_token    = db.Column(db.String(100), unique=True)
    started_at       = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at     = db.Column(db.DateTime)
    raw_score        = db.Column(db.Numeric(6,2))
    normalized_score = db.Column(db.Numeric(5,2))
    stress_level     = db.Column(db.Enum("low","moderate","high"))
    responses        = db.relationship("QuizResponse", backref="session", lazy="dynamic")
    def to_dict(self):
        return {"id": self.id,
                "normalized_score": float(self.normalized_score) if self.normalized_score else None,
                "stress_level": self.stress_level,
                "completed_at": self.completed_at.isoformat() if self.completed_at else None}


class QuizResponse(db.Model):
    __tablename__ = "quiz_responses"
    id             = db.Column(db.Integer, primary_key=True)
    session_id     = db.Column(db.Integer, db.ForeignKey("quiz_sessions.id"), nullable=False)
    question_id    = db.Column(db.Integer, db.ForeignKey("quiz_questions.id"), nullable=False)
    response_value = db.Column(db.Integer, nullable=False)
    weighted_score = db.Column(db.Numeric(5,2))
    responded_at   = db.Column(db.DateTime, default=datetime.utcnow)


class Scenario(db.Model):
    __tablename__ = "scenarios"
    id          = db.Column(db.Integer, primary_key=True)
    title       = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    context     = db.Column(db.Text)
    category    = db.Column(db.Enum("academic","social","family","career","health"), nullable=False)
    difficulty  = db.Column(db.Enum("mild","moderate","severe"), default="moderate")
    order_num   = db.Column(db.Integer, nullable=False)
    is_active   = db.Column(db.Boolean, default=True)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)
    def to_dict(self):
        return {"id": self.id, "title": self.title, "description": self.description,
                "category": self.category, "difficulty": self.difficulty, "order_num": self.order_num}


class ScenarioSession(db.Model):
    __tablename__ = "scenario_sessions"
    id               = db.Column(db.Integer, primary_key=True)
    user_id          = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    started_at       = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at     = db.Column(db.DateTime)
    raw_score        = db.Column(db.Numeric(6,2))
    normalized_score = db.Column(db.Numeric(5,2))
    avg_sentiment    = db.Column(db.Numeric(5,4))
    dominant_emotion = db.Column(db.String(50))
    responses        = db.relationship("ScenarioResponse", backref="session", lazy="dynamic")
    def to_dict(self):
        return {"id": self.id,
                "normalized_score": float(self.normalized_score) if self.normalized_score else None,
                "avg_sentiment": float(self.avg_sentiment) if self.avg_sentiment else None,
                "dominant_emotion": self.dominant_emotion,
                "completed_at": self.completed_at.isoformat() if self.completed_at else None}


class ScenarioResponse(db.Model):
    __tablename__ = "scenario_responses"
    id               = db.Column(db.Integer, primary_key=True)
    session_id       = db.Column(db.Integer, db.ForeignKey("scenario_sessions.id"), nullable=False)
    scenario_id      = db.Column(db.Integer, db.ForeignKey("scenarios.id"), nullable=False)
    response_text    = db.Column(db.Text, nullable=False)
    sentiment_score  = db.Column(db.Numeric(6,4))
    sentiment_label  = db.Column(db.Enum("positive","neutral","negative"), default="neutral")
    emotion_primary  = db.Column(db.String(50))
    emotion_scores   = db.Column(db.JSON)
    keywords         = db.Column(db.JSON)
    stress_indicator = db.Column(db.Numeric(5,2))
    responded_at     = db.Column(db.DateTime, default=datetime.utcnow)


class Assessment(db.Model):
    __tablename__ = "assessments"
    id                  = db.Column(db.Integer, primary_key=True)
    user_id             = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    quiz_session_id     = db.Column(db.Integer, db.ForeignKey("quiz_sessions.id"))
    scenario_session_id = db.Column(db.Integer, db.ForeignKey("scenario_sessions.id"))
    quiz_score          = db.Column(db.Numeric(5,2))
    scenario_score      = db.Column(db.Numeric(5,2))
    final_score         = db.Column(db.Numeric(5,2))
    stress_level        = db.Column(db.Enum("low","moderate","high"), nullable=False)
    confidence          = db.Column(db.Numeric(5,4))
    model_used          = db.Column(db.String(50), default="weighted_formula")
    assessment_date     = db.Column(db.DateTime, default=datetime.utcnow)
    recommendations     = db.relationship("Recommendation", backref="assessment", lazy="dynamic")
    def to_dict(self):
        return {"id": self.id,
                "quiz_score": float(self.quiz_score) if self.quiz_score else None,
                "scenario_score": float(self.scenario_score) if self.scenario_score else None,
                "final_score": float(self.final_score) if self.final_score else None,
                "stress_level": self.stress_level,
                "confidence": float(self.confidence) if self.confidence else None,
                "model_used": self.model_used,
                "date": self.assessment_date.isoformat() if self.assessment_date else None}


class Recommendation(db.Model):
    __tablename__ = "recommendations"
    id              = db.Column(db.Integer, primary_key=True)
    assessment_id   = db.Column(db.Integer, db.ForeignKey("assessments.id"), nullable=False)
    category        = db.Column(db.Enum("immediate","short_term","long_term","professional"), nullable=False)
    title           = db.Column(db.String(200), nullable=False)
    description     = db.Column(db.Text, nullable=False)
    resource_link   = db.Column(db.String(500))
    priority        = db.Column(db.Integer, default=1)
    is_ai_generated = db.Column(db.Boolean, default=False)
    created_at      = db.Column(db.DateTime, default=datetime.utcnow)
    def to_dict(self):
        return {"id": self.id, "category": self.category, "title": self.title,
                "description": self.description, "resource_link": self.resource_link,
                "priority": self.priority, "is_ai_generated": self.is_ai_generated}


class ChatSession(db.Model):
    __tablename__ = "chat_sessions"
    id            = db.Column(db.Integer, primary_key=True)
    user_id       = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    session_token = db.Column(db.String(100), unique=True)
    context       = db.Column(db.JSON)
    started_at    = db.Column(db.DateTime, default=datetime.utcnow)
    last_active   = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    messages      = db.relationship("ChatMessage", backref="session", lazy="dynamic")


class ChatMessage(db.Model):
    __tablename__ = "chat_messages"
    id          = db.Column(db.Integer, primary_key=True)
    session_id  = db.Column(db.Integer, db.ForeignKey("chat_sessions.id"), nullable=False)
    role        = db.Column(db.Enum("user","assistant","system"), nullable=False)
    content     = db.Column(db.Text, nullable=False)
    tokens_used = db.Column(db.Integer)
    sent_at     = db.Column(db.DateTime, default=datetime.utcnow)
    def to_dict(self):
        return {"id": self.id, "role": self.role, "content": self.content,
                "sent_at": self.sent_at.isoformat()}


class StressAlert(db.Model):
    __tablename__ = "stress_alerts"
    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    alert_type = db.Column(db.Enum("high_stress","trend_warning","missed_assessment","improvement"), nullable=False)
    message    = db.Column(db.Text, nullable=False)
    is_read    = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    def to_dict(self):
        return {"id": self.id, "alert_type": self.alert_type, "message": self.message,
                "is_read": self.is_read, "created_at": self.created_at.isoformat()}
