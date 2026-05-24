"""
============================================================
app/routes/alerts.py - Stress Alerts Routes
AI Student Stress Detection System
============================================================
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import StressAlert

alerts_bp = Blueprint('alerts', __name__)


@alerts_bp.route('/', methods=['GET'])
@jwt_required()
def get_alerts():
    """Get all alerts for the current user."""
    user_id  = get_jwt_identity()
    unread_only = request.args.get('unread', 'false').lower() == 'true'

    query = StressAlert.query.filter_by(user_id=user_id)
    if unread_only:
        query = query.filter_by(is_read=False)

    alerts = query.order_by(StressAlert.created_at.desc()).limit(20).all()
    unread_count = StressAlert.query.filter_by(user_id=user_id, is_read=False).count()

    return jsonify({
        'alerts':       [a.to_dict() for a in alerts],
        'unread_count': unread_count
    })


@alerts_bp.route('/mark-read', methods=['POST'])
@jwt_required()
def mark_read():
    """Mark alerts as read."""
    user_id    = get_jwt_identity()
    data       = request.get_json()
    alert_ids  = data.get('alert_ids', [])

    if alert_ids:
        StressAlert.query.filter(
            StressAlert.id.in_(alert_ids),
            StressAlert.user_id == user_id
        ).update({'is_read': True}, synchronize_session=False)
    else:
        # Mark all as read
        StressAlert.query.filter_by(user_id=user_id, is_read=False).update({'is_read': True})

    db.session.commit()
    return jsonify({'message': 'Alerts marked as read'})
