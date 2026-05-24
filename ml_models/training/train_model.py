"""
============================================================
ml_models/training/train_model.py
Trains Random Forest Stress Classifier
Saves model + scaler to backend/app/ml/saved_models/
AI Student Stress Detection System
============================================================

Run:
    cd ml_models/training
    python train_model.py
"""

import os
import sys
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import joblib

# ── Output paths ─────────────────────────────────────────────
SAVE_DIR = os.path.join(
    os.path.dirname(__file__),
    '..', '..', 'backend', 'app', 'ml', 'saved_models'
)
os.makedirs(SAVE_DIR, exist_ok=True)

MODEL_PATH  = os.path.join(SAVE_DIR, 'stress_classifier.pkl')
SCALER_PATH = os.path.join(SAVE_DIR, 'scaler.pkl')
DATA_PATH   = os.path.join(os.path.dirname(__file__), '..', 'data', 'stress_dataset.csv')


# ============================================================
# STEP 1: Generate / Load Training Data
# ============================================================

def generate_synthetic_data(n_samples: int = 1200) -> pd.DataFrame:
    """
    Generate a realistic synthetic dataset for training.
    Features: quiz_score, scenario_score, sentiment_score, emotion_encoded
    Label: stress_level (0=low, 1=moderate, 2=high)
    """
    np.random.seed(42)
    records = []

    emotion_map = {
        'anxiety': 0, 'sadness': 1, 'anger': 2, 'fear': 3,
        'joy': 4, 'disgust': 5, 'surprise': 6, 'neutral': 7
    }
    emotions = list(emotion_map.keys())

    for _ in range(n_samples):
        # Randomly assign a true stress level with realistic distribution
        level = np.random.choice([0, 1, 2], p=[0.35, 0.40, 0.25])

        if level == 0:  # Low stress
            quiz_score     = np.random.normal(25, 8)
            scenario_score = np.random.normal(28, 10)
            sentiment      = np.random.normal(0.4, 0.2)
            emotion        = np.random.choice(['joy', 'neutral', 'surprise'], p=[0.5, 0.4, 0.1])

        elif level == 1:  # Moderate stress
            quiz_score     = np.random.normal(55, 10)
            scenario_score = np.random.normal(52, 12)
            sentiment      = np.random.normal(0.0, 0.25)
            emotion        = np.random.choice(['neutral', 'anxiety', 'sadness'], p=[0.4, 0.35, 0.25])

        else:  # High stress
            quiz_score     = np.random.normal(80, 8)
            scenario_score = np.random.normal(78, 9)
            sentiment      = np.random.normal(-0.45, 0.2)
            emotion        = np.random.choice(['anxiety', 'sadness', 'anger', 'fear'], p=[0.35, 0.30, 0.20, 0.15])

        records.append({
            'quiz_score':      np.clip(quiz_score, 0, 100),
            'scenario_score':  np.clip(scenario_score, 0, 100),
            'sentiment_score': np.clip(sentiment, -1, 1),
            'emotion_encoded': emotion_map[emotion],
            'stress_level':    level
        })

    df = pd.DataFrame(records)
    print(f"✅ Generated {len(df)} synthetic training samples")
    print(f"   Class distribution:\n{df['stress_level'].value_counts().to_string()}")
    return df


def load_or_generate_data() -> pd.DataFrame:
    """Load CSV if exists, else generate synthetic data."""
    if os.path.exists(DATA_PATH):
        print(f"📂 Loading dataset from {DATA_PATH}")
        df = pd.read_csv(DATA_PATH)
        # Map string labels to int if needed
        if df['stress_level'].dtype == object:
            label_map = {'low': 0, 'moderate': 1, 'high': 2}
            df['stress_level'] = df['stress_level'].map(label_map)
        return df
    else:
        print("⚠️  Dataset not found. Generating synthetic data...")
        df = generate_synthetic_data(1200)
        os.makedirs(os.path.dirname(DATA_PATH), exist_ok=True)
        df.to_csv(DATA_PATH, index=False)
        print(f"💾 Synthetic dataset saved to {DATA_PATH}")
        return df


# ============================================================
# STEP 2: Train Models
# ============================================================

def train(df: pd.DataFrame):
    """Train Random Forest + Logistic Regression and save best model."""

    FEATURES = ['quiz_score', 'scenario_score', 'sentiment_score', 'emotion_encoded']
    TARGET   = 'stress_level'

    X = df[FEATURES].values
    y = df[TARGET].values

    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Scale features
    scaler  = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_test  = scaler.transform(X_test)

    print("\n" + "=" * 50)
    print("TRAINING MODELS")
    print("=" * 50)

    # ── Random Forest ─────────────────────────────────────────
    rf = RandomForestClassifier(
        n_estimators     = 150,
        max_depth        = 8,
        min_samples_leaf = 3,
        random_state     = 42,
        class_weight     = 'balanced'
    )
    rf.fit(X_train, y_train)
    rf_acc   = accuracy_score(y_test, rf.predict(X_test))
    rf_cv    = cross_val_score(rf, X_train, y_train, cv=5, scoring='accuracy').mean()

    print(f"\n📊 Random Forest:")
    print(f"   Test Accuracy:  {rf_acc:.4f}")
    print(f"   CV Accuracy:    {rf_cv:.4f}")

    # ── Logistic Regression ───────────────────────────────────
    lr = LogisticRegression(max_iter=1000, random_state=42, class_weight='balanced')
    lr.fit(X_train, y_train)
    lr_acc = accuracy_score(y_test, lr.predict(X_test))
    lr_cv  = cross_val_score(lr, X_train, y_train, cv=5, scoring='accuracy').mean()

    print(f"\n📊 Logistic Regression:")
    print(f"   Test Accuracy:  {lr_acc:.4f}")
    print(f"   CV Accuracy:    {lr_cv:.4f}")

    # ── Choose best model ─────────────────────────────────────
    best_model      = rf if rf_acc >= lr_acc else lr
    best_model_name = "Random Forest" if rf_acc >= lr_acc else "Logistic Regression"
    best_acc        = max(rf_acc, lr_acc)

    print(f"\n🏆 Best Model: {best_model_name} (Accuracy: {best_acc:.4f})")

    # ── Classification Report ─────────────────────────────────
    y_pred   = best_model.predict(X_test)
    label_names = ['Low', 'Moderate', 'High']
    print("\n📋 Classification Report:")
    print(classification_report(y_test, y_pred, target_names=label_names))

    print("\n🔢 Confusion Matrix:")
    cm = confusion_matrix(y_test, y_pred)
    cm_df = pd.DataFrame(cm, index=label_names, columns=label_names)
    print(cm_df)

    # Feature importances (for Random Forest)
    if hasattr(best_model, 'feature_importances_'):
        importances = dict(zip(FEATURES, best_model.feature_importances_))
        print("\n🔍 Feature Importances:")
        for feat, imp in sorted(importances.items(), key=lambda x: -x[1]):
            print(f"   {feat:<20}: {imp:.4f}")

    # ── Save model + scaler ───────────────────────────────────
    joblib.dump(best_model, MODEL_PATH)
    joblib.dump(scaler,     SCALER_PATH)

    print(f"\n💾 Model saved  → {MODEL_PATH}")
    print(f"💾 Scaler saved → {SCALER_PATH}")
    print("\n✅ Training complete!")

    return best_model, scaler, best_acc


# ============================================================
# MAIN
# ============================================================

if __name__ == '__main__':
    print("=" * 50)
    print("AI Student Stress Detection System")
    print("ML Model Training Script")
    print("=" * 50)

    df          = load_or_generate_data()
    model, scaler, acc = train(df)

    print(f"\n🎯 Final Model Accuracy: {acc * 100:.2f}%")
    print("\nTo use this model, ensure the backend's .env file points to:")
    print(f"  ML_MODEL_PATH={MODEL_PATH}")
    print(f"  SCALER_PATH={SCALER_PATH}")
