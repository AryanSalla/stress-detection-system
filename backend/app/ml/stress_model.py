"""
app/ml/stress_model.py - ML Stress Classifier
AI Student Stress Detection System
"""
import os, numpy as np
try:
    import joblib
    JOBLIB_OK = True
except ImportError:
    JOBLIB_OK = False

LOW_MAX, MODERATE_MAX = 40, 70

class StressClassifier:
    def __init__(self):
        self.model = None
        self.scaler = None
        self._load_model()

    def _load_model(self):
        if not JOBLIB_OK:
            return
        mp = os.getenv("ML_MODEL_PATH", "app/ml/saved_models/stress_classifier.pkl")
        sp = os.getenv("SCALER_PATH",   "app/ml/saved_models/scaler.pkl")
        try:
            if os.path.exists(mp) and os.path.exists(sp):
                self.model  = joblib.load(mp)
                self.scaler = joblib.load(sp)
                print("ML model loaded successfully")
        except Exception as e:
            print(f"ML model not found, using formula fallback: {e}")

    def weighted_formula(self, quiz_score, scenario_score):
        final = round(max(0, min(100, (0.40*quiz_score) + (0.60*scenario_score))), 2)
        level = self._classify(final)
        conf  = self._estimate_confidence(final, level)
        return {"final_score": final, "stress_level": level, "confidence": conf, "model_used": "weighted_formula"}

    def ml_predict(self, quiz_score, scenario_score, sentiment_score=0.0, dominant_emotion="neutral"):
        if self.model is None:
            return self.weighted_formula(quiz_score, scenario_score)
        emotion_map = {"anxiety":0,"sadness":1,"anger":2,"fear":3,"joy":4,"disgust":5,"surprise":6,"neutral":7}
        features = np.array([[quiz_score, scenario_score, sentiment_score, emotion_map.get(dominant_emotion, 7)]])
        try:
            fs = self.scaler.transform(features)
            pred  = self.model.predict(fs)[0]
            proba = self.model.predict_proba(fs)[0]
            level_map = {0:"low",1:"moderate",2:"high"}
            return {
                "final_score":  round((0.40*quiz_score)+(0.60*scenario_score), 2),
                "stress_level": level_map.get(int(pred), "moderate"),
                "confidence":   round(float(max(proba)), 4),
                "model_used":   "random_forest"
            }
        except Exception as e:
            print(f"ML prediction error: {e}")
            return self.weighted_formula(quiz_score, scenario_score)

    def _classify(self, score):
        if score <= LOW_MAX: return "low"
        elif score <= MODERATE_MAX: return "moderate"
        return "high"

    def _estimate_confidence(self, score, level):
        if level == "low":
            return round(min(0.5 + ((LOW_MAX-score)/LOW_MAX)*0.5, 0.99), 4)
        elif level == "moderate":
            center = (LOW_MAX+MODERATE_MAX)/2
            return round(min(0.5 + (abs(score-center)/30)*0.45, 0.95), 4)
        return round(min(0.5 + ((score-MODERATE_MAX)/30)*0.45, 0.95), 4)

    def predict(self, quiz_score, scenario_score, sentiment_score=0.0, dominant_emotion="neutral", use_ml=True):
        if use_ml and self.model is not None:
            return self.ml_predict(quiz_score, scenario_score, sentiment_score, dominant_emotion)
        return self.weighted_formula(quiz_score, scenario_score)

stress_classifier = StressClassifier()
