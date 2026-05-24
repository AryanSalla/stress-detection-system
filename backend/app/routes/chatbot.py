"""
============================================================
app/routes/chatbot.py - AI Chatbot Routes
Conversational mental health support using Claude API
AI Student Stress Detection System
============================================================
"""

import os
import uuid
import requests
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import ChatSession, ChatMessage, Assessment

chatbot_bp = Blueprint('chatbot', __name__)

SYSTEM_PROMPT = """You are MindEase, a compassionate AI mental health support assistant 
specifically designed for college students. You help students cope with academic stress, 
anxiety, and emotional challenges.

Your personality:
- Warm, empathetic, non-judgmental
- Evidence-based suggestions (CBT, mindfulness, study strategies)
- Encouraging but realistic
- Know when to recommend professional help

Rules:
- Never diagnose medical or psychiatric conditions
- Always encourage professional help for serious issues
- Keep responses concise (2-3 paragraphs max)
- Ask clarifying questions to understand the student's situation
- If a student mentions self-harm, immediately provide crisis resources:
  iCall: 9152987821, Vandrevala Foundation: 1860-2662-345"""


@chatbot_bp.route('/start', methods=['POST'])
@jwt_required()
def start_chat():
    """Start a new chat session."""
    user_id = get_jwt_identity()
    token   = str(uuid.uuid4())

    # Get latest assessment for context
    latest = (
        Assessment.query
        .filter_by(user_id=user_id)
        .order_by(Assessment.assessment_date.desc())
        .first()
    )

    context = {}
    if latest:
        context['latest_stress_level'] = latest.stress_level
        context['latest_score']        = float(latest.final_score)

    session = ChatSession(
        user_id       = user_id,
        session_token = token,
        context       = context
    )
    db.session.add(session)
    db.session.commit()

    return jsonify({
        'session_id':    session.id,
        'session_token': token,
        'message':       'Chat session started'
    }), 201


@chatbot_bp.route('/message', methods=['POST'])
@jwt_required()
def send_message():
    """
    Send a message and get AI response.

    Body: {"session_id": 1, "message": "I'm feeling anxious about my exams"}
    """
    user_id = get_jwt_identity()
    data    = request.get_json()

    session_id   = data.get('session_id')
    user_message = data.get('message', '').strip()

    if not session_id or not user_message:
        return jsonify({'error': 'session_id and message required'}), 400

    if len(user_message) > 1000:
        return jsonify({'error': 'Message too long (max 1000 chars)'}), 400

    session = ChatSession.query.filter_by(
        id=session_id, user_id=user_id
    ).first_or_404()

    # Save user message
    user_msg = ChatMessage(
        session_id = session.id,
        role       = 'user',
        content    = user_message
    )
    db.session.add(user_msg)
    db.session.flush()

    # Build conversation history (last 10 messages)
    history = (
        ChatMessage.query
        .filter_by(session_id=session.id)
        .order_by(ChatMessage.sent_at.desc())
        .limit(10).all()
    )
    history.reverse()

    messages_payload = [
        {'role': msg.role, 'content': msg.content}
        for msg in history
        if msg.role in ('user', 'assistant')
    ]

    # Call Claude API
    api_key = os.getenv('ANTHROPIC_API_KEY', '')
    ai_response = _get_ai_response(messages_payload, api_key)

    # Save AI response
    ai_msg = ChatMessage(
        session_id  = session.id,
        role        = 'assistant',
        content     = ai_response,
        tokens_used = len(ai_response.split())  # Rough estimate
    )
    db.session.add(ai_msg)
    db.session.commit()

    return jsonify({
        'user_message': user_message,
        'ai_response':  ai_response,
        'session_id':   session.id
    })


def _get_ai_response(messages: list, api_key: str) -> str:
    """Call Claude API and return response text."""
    if not api_key:
        return _fallback_response(messages[-1]['content'] if messages else '')

    try:
        response = requests.post(
            'https://api.anthropic.com/v1/messages',
            headers={
                'x-api-key': api_key,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            },
            json={
                'model':      'claude-sonnet-4-20250514',
                'max_tokens': 500,
                'system':     SYSTEM_PROMPT,
                'messages':   messages
            },
            timeout=20
        )

        if response.status_code == 200:
            return response.json()['content'][0]['text']

    except Exception as e:
        print(f'Chatbot API error: {e}')

    return _fallback_response(messages[-1]['content'] if messages else '')


def _fallback_response(user_message: str) -> str:
    """Rule-based fallback when API is unavailable."""
    msg_lower = user_message.lower()

    if any(w in msg_lower for w in ['anxious', 'anxiety', 'panic']):
        return ("It sounds like you're experiencing anxiety, which is very common among students. "
                "Try the 4-7-8 breathing technique: inhale for 4 counts, hold for 7, exhale for 8. "
                "This activates your parasympathetic nervous system and can provide quick relief. "
                "Would you like to talk about what's causing your anxiety?")

    if any(w in msg_lower for w in ['fail', 'failing', 'exam', 'test']):
        return ("Academic pressure is one of the most common sources of student stress. "
                "Remember that one exam doesn't define your future. Break your studying into "
                "smaller chunks using the Pomodoro technique. "
                "Have you tried creating a study schedule? I can help you organize your time.")

    if any(w in msg_lower for w in ['sad', 'depressed', 'hopeless', 'worthless']):
        return ("I hear that you're going through a really difficult time. These feelings are valid. "
                "Please know that you're not alone, and things can get better. "
                "I'd strongly encourage you to speak with a counselor. "
                "You can reach iCall at 9152987821 - they're free and confidential.")

    return ("Thank you for sharing that with me. I'm here to support you. "
            "Could you tell me more about what you're experiencing? "
            "Understanding your situation better will help me provide more helpful guidance.")


@chatbot_bp.route('/history/<int:session_id>', methods=['GET'])
@jwt_required()
def get_chat_history(session_id):
    """Get chat history for a session."""
    user_id = get_jwt_identity()
    session = ChatSession.query.filter_by(
        id=session_id, user_id=user_id
    ).first_or_404()

    messages = (
        ChatMessage.query
        .filter_by(session_id=session_id)
        .order_by(ChatMessage.sent_at)
        .all()
    )

    return jsonify({'messages': [m.to_dict() for m in messages]})
