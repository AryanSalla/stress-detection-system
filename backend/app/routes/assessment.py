"""app/routes/assessment.py - Final Assessment Routes"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Assessment, Recommendation, QuizSession, ScenarioSession, StressAlert, User
from app.ml.stress_model import stress_classifier
from app.services.recommendation_service import recommendation_service

assessment_bp = Blueprint("assessment", __name__)

@assessment_bp.route("/final", methods=["POST"])
@jwt_required()
def get_final_assessment():
    user_id = get_jwt_identity()
    data = request.get_json()
    qid = data.get("quiz_session_id"); sid = data.get("scenario_session_id")
    if not qid or not sid: return jsonify({"error":"Both quiz_session_id and scenario_session_id required"}), 400
    qs = QuizSession.query.filter_by(id=qid, user_id=user_id).first_or_404()
    ss = ScenarioSession.query.filter_by(id=sid, user_id=user_id).first_or_404()
    if not qs.completed_at or not ss.completed_at: return jsonify({"error":"Both sessions must be completed first"}), 400
    quiz_score = float(qs.normalized_score); scenario_score = float(ss.normalized_score)
    sentiment = float(ss.avg_sentiment or 0); emotion = ss.dominant_emotion or "neutral"
    result = stress_classifier.predict(quiz_score=quiz_score, scenario_score=scenario_score,
                                       sentiment_score=sentiment, dominant_emotion=emotion)
    assessment = Assessment(user_id=user_id, quiz_session_id=qid, scenario_session_id=sid,
        quiz_score=quiz_score, scenario_score=scenario_score, final_score=result["final_score"],
        stress_level=result["stress_level"], confidence=result["confidence"], model_used=result["model_used"])
    db.session.add(assessment); db.session.flush()
    user = User.query.get(user_id)
    recs = recommendation_service.generate(stress_level=result["stress_level"],
        quiz_score=quiz_score, scenario_score=scenario_score, dominant_emotion=emotion,
        user_context=user.to_dict() if user else {})
    for rec in recs:
        db.session.add(Recommendation(assessment_id=assessment.id,
            category=rec.get("category","immediate"), title=rec.get("title",""),
            description=rec.get("description",""), resource_link=rec.get("resource_link",""),
            priority=rec.get("priority",1), is_ai_generated=rec.get("is_ai_generated",False)))
    if result["stress_level"] == "high":
        db.session.add(StressAlert(user_id=user_id, alert_type="high_stress",
            message="Your recent assessment shows HIGH stress. Please review recommendations and consider reaching out to a counselor."))
    db.session.commit()
    return jsonify({"assessment_id":assessment.id,
        "scores":{"quiz_score":quiz_score,"scenario_score":scenario_score,"final_score":result["final_score"]},
        "stress_level":result["stress_level"],"confidence":result["confidence"],"model_used":result["model_used"],
        "recommendations":[r.to_dict() for r in assessment.recommendations.all()],
        "message":"Assessment completed successfully"})

@assessment_bp.route("/<int:assessment_id>", methods=["GET"])
@jwt_required()
def get_assessment(assessment_id):
    a = Assessment.query.filter_by(id=assessment_id, user_id=get_jwt_identity()).first_or_404()
    return jsonify({"assessment":a.to_dict(),"recommendations":[r.to_dict() for r in a.recommendations.all()]})
