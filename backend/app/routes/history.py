"""app/routes/history.py - History Routes"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Assessment

history_bp = Blueprint("history", __name__)

@history_bp.route("/", methods=["GET"])
@jwt_required()
def get_history():
    user_id = get_jwt_identity()
    limit = int(request.args.get("limit",10)); offset = int(request.args.get("offset",0))
    assessments = Assessment.query.filter_by(user_id=user_id).order_by(
        Assessment.assessment_date.desc()).limit(limit).offset(offset).all()
    trend = [{"date":a.assessment_date.strftime("%Y-%m-%d"),"final_score":float(a.final_score),
              "stress_level":a.stress_level,"quiz_score":float(a.quiz_score) if a.quiz_score else 0,
              "scenario_score":float(a.scenario_score) if a.scenario_score else 0}
             for a in reversed(assessments)]
    total = Assessment.query.filter_by(user_id=user_id).count()
    avg_score = sum(float(a.final_score) for a in assessments)/len(assessments) if assessments else 0
    from collections import Counter
    levels = [a.stress_level for a in assessments]
    most_common = Counter(levels).most_common(1)[0][0] if levels else None
    return jsonify({"assessments":[a.to_dict() for a in assessments],"trend":trend,
        "summary":{"total_assessments":total,"average_score":round(avg_score,2),"most_common_level":most_common},
        "pagination":{"limit":limit,"offset":offset,"total":total}})
