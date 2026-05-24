"""app/routes/scenario.py - Scenario Analysis Routes"""
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Scenario, ScenarioSession, ScenarioResponse
from app.nlp.pipeline import nlp_pipeline

scenario_bp = Blueprint("scenario", __name__)

@scenario_bp.route("/list", methods=["GET"])
@jwt_required()
def get_scenarios():
    ss = Scenario.query.filter_by(is_active=True).order_by(Scenario.order_num).all()
    return jsonify({"scenarios":[s.to_dict() for s in ss],"total":len(ss)})

@scenario_bp.route("/start", methods=["POST"])
@jwt_required()
def start_scenario():
    s = ScenarioSession(user_id=get_jwt_identity())
    db.session.add(s); db.session.commit()
    return jsonify({"session_id":s.id,"message":"Scenario session started"}), 201

@scenario_bp.route("/analyze", methods=["POST"])
@jwt_required()
def analyze_response():
    data = request.get_json()
    if not data: return jsonify({"error":"Request body required"}), 400
    session_id = data.get("session_id"); scenario_id = data.get("scenario_id")
    text = data.get("response_text","").strip()
    if not all([session_id, scenario_id, text]): return jsonify({"error":"session_id, scenario_id, response_text required"}), 400
    if len(text) < 10: return jsonify({"error":"Response too short"}), 400
    if len(text) > 2000: return jsonify({"error":"Response too long (max 2000)"}), 400
    session = ScenarioSession.query.filter_by(id=session_id, user_id=get_jwt_identity()).first_or_404()
    if session.completed_at: return jsonify({"error":"Session already completed"}), 400
    Scenario.query.get_or_404(scenario_id)
    analysis = nlp_pipeline.analyze(text)
    resp = ScenarioResponse(session_id=session.id, scenario_id=scenario_id, response_text=text,
        sentiment_score=analysis["sentiment"]["score"], sentiment_label=analysis["sentiment"]["label"],
        emotion_primary=analysis["emotions"]["dominant"], emotion_scores=analysis["emotions"]["scores"],
        keywords=analysis["keywords"], stress_indicator=analysis["stress_score"])
    db.session.add(resp); db.session.commit()
    return jsonify({"response_id":resp.id,"scenario_id":scenario_id,
        "analysis":{"sentiment":analysis["sentiment"],"emotions":analysis["emotions"],
                    "keywords":analysis["keywords"][:5],"stress_score":analysis["stress_score"],
                    "word_count":analysis["word_count"]},"message":"Response analyzed"})

@scenario_bp.route("/complete", methods=["POST"])
@jwt_required()
def complete_scenario():
    data = request.get_json()
    session = ScenarioSession.query.filter_by(id=data.get("session_id"), user_id=get_jwt_identity()).first_or_404()
    if session.completed_at: return jsonify({"error":"Session already completed"}), 400
    responses = ScenarioResponse.query.filter_by(session_id=session.id).all()
    if not responses: return jsonify({"error":"No responses found"}), 400
    analyses = [{"stress_score":float(r.stress_indicator),"sentiment":{"score":float(r.sentiment_score)},
                 "emotions":{"dominant":r.emotion_primary}} for r in responses]
    agg = nlp_pipeline.aggregate_scenario_scores(analyses)
    session.normalized_score=agg["normalized_score"]; session.avg_sentiment=agg["avg_sentiment"]
    session.dominant_emotion=agg["dominant_emotion"]; session.completed_at=datetime.utcnow()
    db.session.commit()
    return jsonify({"session_id":session.id,"normalized_score":agg["normalized_score"],
        "avg_sentiment":agg["avg_sentiment"],"dominant_emotion":agg["dominant_emotion"],
        "total_responses":len(responses),"message":"Scenario analysis completed"})

@scenario_bp.route("/result/<int:session_id>", methods=["GET"])
@jwt_required()
def get_result(session_id):
    s = ScenarioSession.query.filter_by(id=session_id, user_id=get_jwt_identity()).first_or_404()
    return jsonify({"result": s.to_dict()})
