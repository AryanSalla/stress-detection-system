"""
app/services/recommendation_service.py
Generates personalized recommendations
AI Student Stress Detection System
"""
import os, json, requests
from typing import List, Dict

RECOMMENDATIONS = {
    "low": [
        {"category":"immediate","title":"Maintain Your Routine","description":"You are managing stress well! Keep your current daily schedule and healthy habits. Consistency is key to maintaining low stress levels.","priority":1},
        {"category":"short_term","title":"Light Physical Exercise","description":"Engage in 30 minutes of light exercise like walking, yoga, or cycling 3-4 times a week. Exercise releases endorphins that reduce stress.","priority":2},
        {"category":"short_term","title":"Social Connection","description":"Spend quality time with friends and family. Positive social interactions serve as a protective buffer against future stress.","priority":2},
        {"category":"long_term","title":"Continue Journaling","description":"Maintain a daily gratitude or reflective journal to stay grounded and mindful of your progress.","priority":3},
    ],
    "moderate": [
        {"category":"immediate","title":"Time Management Plan","description":"Create a structured weekly schedule. Use the Pomodoro Technique (25 min focus, 5 min break) for study sessions. Prioritize tasks using the Eisenhower Matrix.","priority":1},
        {"category":"immediate","title":"Scheduled Breaks","description":"Take mandatory 15-minute breaks every 90 minutes. Step away from screens. Do light stretching or deep breathing exercises.","priority":1},
        {"category":"short_term","title":"Mindfulness & Meditation","description":"Practice guided meditation for 10-15 minutes daily. Apps like Headspace or Calm can help. The 4-7-8 breathing technique provides quick relief.","priority":2},
        {"category":"short_term","title":"Sleep Hygiene","description":"Aim for 7-8 hours of sleep. Avoid screens 30 minutes before bed. Maintain consistent sleep and wake times, even on weekends.","priority":2},
        {"category":"long_term","title":"Academic Support","description":"Visit your college academic support center or speak with a trusted faculty member. Don't hesitate to ask for extensions when genuinely overwhelmed.","priority":3},
    ],
    "high": [
        {"category":"immediate","title":"Seek Counseling Support","description":"Your stress level is high. Please speak with a counselor or mental health professional as soon as possible. Most universities offer free counseling services.","resource_link":"https://www.nimh.nih.gov/health/find-help","priority":1},
        {"category":"immediate","title":"Talk to Someone You Trust","description":"Reach out to a trusted friend, family member, or mentor. Verbalizing your stress is the first step to managing it. You do not have to face this alone.","priority":1},
        {"category":"immediate","title":"Reduce Academic Workload","description":"Speak to your academic advisor about reducing your course load, requesting deadline extensions, or taking medical leave if needed. Your health comes first.","priority":1},
        {"category":"short_term","title":"Crisis Hotline Resources","description":"iCall: 9152987821 | Vandrevala Foundation: 1860-2662-345 (24/7) | These services are confidential and free.","resource_link":"https://icallhelpline.org/","priority":1},
        {"category":"short_term","title":"Physical Activity for Relief","description":"Even a 20-minute walk outdoors significantly reduces cortisol (stress hormone) levels. Start small — even 5 minutes of movement counts.","priority":2},
        {"category":"long_term","title":"Professional Mental Health Support","description":"Consider regular therapy sessions with a licensed psychologist. Cognitive Behavioral Therapy (CBT) has strong evidence for managing academic stress.","priority":2},
    ]
}

class RecommendationService:
    def __init__(self):
        self.api_key = os.getenv("ANTHROPIC_API_KEY", "")

    def get_static_recommendations(self, stress_level):
        recs = RECOMMENDATIONS.get(stress_level, RECOMMENDATIONS["moderate"])
        return [{**r, "is_ai_generated": False} for r in recs]

    def get_ai_recommendations(self, stress_level, quiz_score, scenario_score, dominant_emotion, user_context=None):
        if not self.api_key:
            return self.get_static_recommendations(stress_level)
        ctx = ""
        if user_context:
            ctx = f"Course: {user_context.get('course','Unknown')}, Year: {user_context.get('year_of_study','Unknown')}"
        prompt = f"""You are a mental health counselor for college students.
Student assessment: Stress={stress_level.upper()}, Quiz={quiz_score:.1f}/100, Behavior={scenario_score:.1f}/100, Emotion={dominant_emotion}. {ctx}
Generate 4 specific, actionable, compassionate recommendations.
Return ONLY a JSON array with objects: category (immediate/short_term/long_term/professional), title, description.
No markdown, no extra text."""
        try:
            r = requests.post("https://api.anthropic.com/v1/messages",
                headers={"x-api-key":self.api_key,"anthropic-version":"2023-06-01","content-type":"application/json"},
                json={"model":"claude-sonnet-4-20250514","max_tokens":1000,"messages":[{"role":"user","content":prompt}]},
                timeout=15)
            if r.status_code == 200:
                text = r.json()["content"][0]["text"].strip().replace("```json","").replace("```","").strip()
                recs = json.loads(text)
                return [{**rec,"is_ai_generated":True,"priority":i+1} for i,rec in enumerate(recs[:4])]
        except Exception as e:
            print(f"AI recommendation error: {e}")
        return self.get_static_recommendations(stress_level)

    def generate(self, stress_level, quiz_score=50, scenario_score=50, dominant_emotion="neutral", user_context=None, use_ai=True):
        if use_ai and self.api_key:
            return self.get_ai_recommendations(stress_level, quiz_score, scenario_score, dominant_emotion, user_context)
        return self.get_static_recommendations(stress_level)

recommendation_service = RecommendationService()
