"""app/routes/auth.py - Authentication Routes"""
import re
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from app import db
from app.models import User

auth_bp = Blueprint("auth", __name__)

def valid_email(e): return bool(re.match(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", e))
def valid_password(p): return len(p) >= 8 and any(c.isdigit() for c in p)

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    if not data: return jsonify({"error":"Request body required"}), 400
    for f in ["username","email","password"]:
        if not data.get(f): return jsonify({"error":f"Missing field: {f}"}), 400
    if not valid_email(data["email"]): return jsonify({"error":"Invalid email format"}), 400
    if not valid_password(data["password"]): return jsonify({"error":"Password must be 8+ chars with at least one number"}), 400
    if User.query.filter_by(email=data["email"]).first(): return jsonify({"error":"Email already registered"}), 409
    if User.query.filter_by(username=data["username"]).first(): return jsonify({"error":"Username already taken"}), 409
    user = User(username=data["username"].strip(), email=data["email"].strip().lower(),
                full_name=data.get("full_name",""), age=data.get("age"),
                gender=data.get("gender","prefer_not_to_say"),
                institution=data.get("institution",""), course=data.get("course",""),
                year_of_study=data.get("year_of_study"))
    user.set_password(data["password"])
    db.session.add(user); db.session.commit()
    return jsonify({"message":"Registration successful","user":user.to_dict(),
                    "access_token": create_access_token(identity=str(user.id)),
                    "refresh_token": create_refresh_token(identity=str(user.id))}), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data: return jsonify({"error":"Request body required"}), 400
    email = data.get("email","").strip().lower()
    pwd   = data.get("password","")
    if not email or not pwd: return jsonify({"error":"Email and password required"}), 400
    user = User.query.filter_by(email=email, is_active=True).first()
    if not user or not user.check_password(pwd): return jsonify({"error":"Invalid email or password"}), 401
    return jsonify({"message":"Login successful","user":user.to_dict(),
                    "access_token": create_access_token(identity=str(user.id)),
                    "refresh_token": create_refresh_token(identity=str(user.id))})

@auth_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    return jsonify({"user": User.query.get_or_404(int(get_jwt_identity())).to_dict()})

@auth_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    user = User.query.get_or_404(int(get_jwt_identity()))
    data = request.get_json()
    for f in ["full_name","age","gender","institution","course","year_of_study"]:
        if f in data: setattr(user, f, data[f])
    db.session.commit()
    return jsonify({"message":"Profile updated","user":user.to_dict()})

@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    return jsonify({"access_token": create_access_token(identity=get_jwt_identity())})