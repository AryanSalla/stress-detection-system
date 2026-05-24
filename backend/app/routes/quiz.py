"""app/routes/quiz.py - Quiz Assessment Routes"""
import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import QuizQuestion, QuizSession, QuizResponse

quiz_bp = Blueprint("quiz", __name__)
MAX_RAW = 5 * 1.5 * 15

def normalize(raw): return round(min(max((raw/MAX_RAW)*100, 0), 100), 2)
def classify(s): return "low" if s<=40 else "moderate" if s<=70 else "high"

@quiz_bp.route("/questions", methods=["GET"])
@jwt_required()
def get_questions():
    qs = QuizQuestion.query.filter_by(is_active=True).order_by(QuizQuestion.order_num).all()
    return jsonify({"questions":[q.to_dict() for q in qs],"total":len(qs),
                    "scale_info":{"min":1,"max":5,"labels":{"1":"Never","2":"Rarely","3":"Sometimes","4":"Often","5":"Always"}}})

@quiz_bp.route("/start", methods=["POST"])
@jwt_required()
def start_quiz():
    s = QuizSession(user_id=get_jwt_identity(), session_token=str(uuid.uuid4()))
    db.session.add(s); db.session.commit()
    return jsonify({"session_id":s.id,"session_token":s.session_token,"message":"Quiz session started"}), 201

@quiz_bp.route("/submit", methods=["POST"])
@jwt_required()
def submit_quiz():
    data = request.get_json()
    if not data: return jsonify({"error":"Request body required"}), 400
    session_id = data.get("session_id")
    responses  = data.get("responses",[])
    if not session_id or not responses: return jsonify({"error":"session_id and responses required"}), 400
    session = QuizSession.query.filter_by(id=session_id, user_id=get_jwt_identity()).first_or_404()
    if session.completed_at: return jsonify({"error":"Session already completed"}), 400
    qids = [r["question_id"] for r in responses]
    questions = {q.id: q for q in QuizQuestion.query.filter(QuizQuestion.id.in_(qids)).all()}
    raw_score = 0.0
    saved = []
    for resp in responses:
        qid = resp.get("question_id"); val = resp.get("response_value")
        if not qid or not val: return jsonify({"error":"Each response needs question_id and response_value"}), 400
        if not (1 <= int(val) <= 5): return jsonify({"error":f"response_value must be 1-5"}), 400
        q = questions.get(qid)
        if not q: return jsonify({"error":f"Question {qid} not found"}), 404
        w = float(val)*float(q.weight); raw_score += w
        saved.append(QuizResponse(session_id=session.id, question_id=qid, response_value=int(val), weighted_score=round(w,2)))
    db.session.bulk_save_objects(saved)
    norm = normalize(raw_score); level = classify(norm)
    session.raw_score=round(raw_score,2); session.normalized_score=norm
    session.stress_level=level; session.completed_at=datetime.utcnow()
    db.session.commit()
    return jsonify({"session_id":session.id,"raw_score":float(session.raw_score),
                    "normalized_score":float(session.normalized_score),"stress_level":session.stress_level,"message":"Quiz completed"})

@quiz_bp.route("/result/<int:session_id>", methods=["GET"])
@jwt_required()
def get_result(session_id):
    s = QuizSession.query.filter_by(id=session_id, user_id=get_jwt_identity()).first_or_404()
    return jsonify({"result": s.to_dict()})
