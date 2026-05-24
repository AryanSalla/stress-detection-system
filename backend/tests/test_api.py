"""
============================================================
backend/tests/test_api.py - Unit & Integration Tests
AI Student Stress Detection System
============================================================
Run: cd backend && pytest tests/ -v
"""

import pytest
import json
from app import create_app, db
from config import TestingConfig


@pytest.fixture(scope='module')
def app():
    app = create_app(TestingConfig)
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()


@pytest.fixture(scope='module')
def client(app):
    return app.test_client()


@pytest.fixture(scope='module')
def auth_headers(client):
    """Register + login, return JWT headers."""
    client.post('/api/auth/register', json={
        'username': 'testuser', 'email': 'test@test.com',
        'password': 'Test@1234', 'full_name': 'Test User'
    })
    r = client.post('/api/auth/login', json={
        'email': 'test@test.com', 'password': 'Test@1234'
    })
    token = r.get_json()['access_token']
    return {'Authorization': f'Bearer {token}'}


# ── Auth tests ────────────────────────────────────────────────

def test_health(client):
    r = client.get('/api/health')
    assert r.status_code == 200
    assert r.get_json()['status'] == 'healthy'


def test_register(client):
    r = client.post('/api/auth/register', json={
        'username': 'newuser', 'email': 'new@test.com',
        'password': 'Pass@1234'
    })
    assert r.status_code == 201
    data = r.get_json()
    assert 'access_token' in data


def test_register_duplicate(client):
    client.post('/api/auth/register', json={
        'username': 'dupuser', 'email': 'dup@test.com', 'password': 'Pass@1234'
    })
    r = client.post('/api/auth/register', json={
        'username': 'dupuser2', 'email': 'dup@test.com', 'password': 'Pass@1234'
    })
    assert r.status_code == 409


def test_login_success(client):
    r = client.post('/api/auth/login', json={
        'email': 'test@test.com', 'password': 'Test@1234'
    })
    assert r.status_code == 200
    assert 'access_token' in r.get_json()


def test_login_wrong_password(client):
    r = client.post('/api/auth/login', json={
        'email': 'test@test.com', 'password': 'wrongpassword'
    })
    assert r.status_code == 401


def test_profile_authenticated(client, auth_headers):
    r = client.get('/api/auth/profile', headers=auth_headers)
    assert r.status_code == 200
    assert 'user' in r.get_json()


def test_profile_unauthenticated(client):
    r = client.get('/api/auth/profile')
    assert r.status_code == 401


# ── NLP Pipeline tests ────────────────────────────────────────

def test_nlp_positive_sentiment():
    from app.nlp.pipeline import nlp_pipeline
    result = nlp_pipeline.analyze("I feel happy and confident. I will manage this well.")
    assert result['sentiment']['label'] == 'positive'
    assert result['stress_score'] < 50


def test_nlp_negative_sentiment():
    from app.nlp.pipeline import nlp_pipeline
    result = nlp_pipeline.analyze("I am overwhelmed, anxious, and feel hopeless about everything.")
    assert result['sentiment']['label'] == 'negative'
    assert result['stress_score'] > 50


def test_nlp_empty_text():
    from app.nlp.pipeline import nlp_pipeline
    result = nlp_pipeline.analyze("")
    assert result['stress_score'] == 50.0


def test_nlp_keyword_extraction():
    from app.nlp.pipeline import nlp_pipeline
    result = nlp_pipeline.analyze("Studying for exams causes stress and anxiety in students.")
    assert len(result['keywords']) > 0


# ── ML Model tests ────────────────────────────────────────────

def test_weighted_formula_low():
    from app.ml.stress_model import StressClassifier
    clf = StressClassifier()
    r = clf.weighted_formula(20.0, 25.0)
    assert r['stress_level'] == 'low'
    assert r['final_score'] < 40


def test_weighted_formula_moderate():
    from app.ml.stress_model import StressClassifier
    clf = StressClassifier()
    r = clf.weighted_formula(55.0, 58.0)
    assert r['stress_level'] == 'moderate'


def test_weighted_formula_high():
    from app.ml.stress_model import StressClassifier
    clf = StressClassifier()
    r = clf.weighted_formula(85.0, 80.0)
    assert r['stress_level'] == 'high'
    assert r['final_score'] > 70


def test_score_fusion_weights():
    from app.ml.stress_model import StressClassifier
    clf = StressClassifier()
    r = clf.weighted_formula(40.0, 80.0)
    expected = (0.4 * 40.0) + (0.6 * 80.0)
    assert abs(r['final_score'] - expected) < 0.1


# ── Recommendation tests ──────────────────────────────────────

def test_recommendations_low():
    from app.services.recommendation_service import RecommendationService
    svc  = RecommendationService()
    recs = svc.get_static_recommendations('low')
    assert len(recs) > 0
    assert all('title' in r for r in recs)


def test_recommendations_high_has_crisis():
    from app.services.recommendation_service import RecommendationService
    svc  = RecommendationService()
    recs = svc.get_static_recommendations('high')
    # High stress should include counseling recommendation
    titles = [r['title'].lower() for r in recs]
    assert any('counsel' in t or 'support' in t or 'crisis' in t for t in titles)
