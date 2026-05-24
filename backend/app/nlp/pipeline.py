"""
app/nlp/pipeline.py - NLP Analysis Pipeline
Sentiment analysis, emotion detection, keyword extraction
AI Student Stress Detection System
"""
import re
from typing import Dict, List
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from textblob import TextBlob
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

def _download_nltk():
    for r in ["punkt","stopwords","wordnet","averaged_perceptron_tagger","punkt_tab"]:
        try: nltk.download(r, quiet=True)
        except: pass
_download_nltk()

EMOTION_LEXICONS = {
    "anxiety":  ["anxious","worried","nervous","panic","afraid","overwhelmed","dread","uneasy","restless"],
    "sadness":  ["sad","depressed","unhappy","hopeless","miserable","grief","sorrow","despair","lonely","disappointed"],
    "anger":    ["angry","frustrated","furious","irritated","annoyed","rage","resentful","bitter","hostile","mad"],
    "fear":     ["scared","terrified","afraid","petrified","frightened","fearful","timid"],
    "joy":      ["happy","excited","joyful","delighted","cheerful","thrilled","elated","content","grateful","optimistic"],
    "disgust":  ["disgusted","revolted","appalled","loathe","detest","hate"],
    "surprise": ["surprised","shocked","amazed","astonished","stunned","bewildered","confused"]
}
STRESS_KEYWORDS = ["cant cope","no way out","give up","fail","hopeless","worthless","overwhelmed",
                   "breaking down","panic attack","cant sleep","exhausted","burned out","anxious"]
COPING_KEYWORDS = ["manage","plan","organize","seek help","talk to","take a break","exercise",
                   "meditate","prioritize","ask for help","reach out","problem-solve"]

class NLPPipeline:
    def __init__(self):
        self.vader      = SentimentIntensityAnalyzer()
        self.lemmatizer = WordNetLemmatizer()
        try:
            self.stop_words = set(stopwords.words("english"))
        except:
            self.stop_words = set()

    def preprocess(self, text):
        text = text.lower().strip()
        text = re.sub(r"http\S+|www\S+", "", text)
        text = re.sub(r"[^\w\s\'-]", " ", text)
        return re.sub(r"\s+", " ", text)

    def tokenize_and_lemmatize(self, text):
        try:
            tokens = word_tokenize(text)
        except:
            tokens = text.split()
        return [self.lemmatizer.lemmatize(t) for t in tokens
                if t.isalpha() and t not in self.stop_words and len(t) > 2]

    def analyze_sentiment(self, text):
        scores   = self.vader.polarity_scores(text)
        compound = scores["compound"]
        label    = "positive" if compound >= 0.05 else "negative" if compound <= -0.05 else "neutral"
        return {"score": round(compound,4), "label": label,
                "positive": round(scores["pos"],4), "negative": round(scores["neg"],4), "neutral": round(scores["neu"],4)}

    def detect_emotions(self, tokens, raw_text):
        text_lower = raw_text.lower()
        token_set  = set(tokens)
        scores = {}
        for emotion, keywords in EMOTION_LEXICONS.items():
            matches = sum(1 for kw in keywords if kw in token_set or kw in text_lower)
            scores[emotion] = round(min(matches / 5.0, 1.0), 4)
        dominant = max(scores, key=scores.get) if max(scores.values()) > 0 else "neutral"
        return {"scores": scores, "dominant": dominant}

    def extract_keywords(self, tokens, top_n=10):
        from collections import Counter
        return [w for w,_ in Counter(tokens).most_common(top_n)]

    def calculate_stress_score(self, sentiment, emotions, raw_text):
        text_lower = raw_text.lower()
        sentiment_component = -sentiment["score"] * 30
        stress_weights = {"anxiety":0.35,"sadness":0.25,"anger":0.20,"fear":0.15,"disgust":0.05,"joy":-0.30,"surprise":0.0}
        emotion_component   = sum(emotions["scores"].get(e,0)*w for e,w in stress_weights.items()) * 30
        stress_count  = sum(1 for kw in STRESS_KEYWORDS if kw in text_lower)
        coping_count  = sum(1 for kw in COPING_KEYWORDS if kw in text_lower)
        keyword_component = (stress_count - coping_count) * 3
        score = 50 + sentiment_component + emotion_component + keyword_component
        return round(max(0.0, min(100.0, score)), 2)

    def analyze(self, text):
        if not text or len(text.strip()) < 5:
            return self._empty()
        clean     = self.preprocess(text)
        tokens    = self.tokenize_and_lemmatize(clean)
        sentiment = self.analyze_sentiment(text)
        emotions  = self.detect_emotions(tokens, clean)
        keywords  = self.extract_keywords(tokens)
        stress    = self.calculate_stress_score(sentiment, emotions, clean)
        return {"sentiment": sentiment, "emotions": emotions, "keywords": keywords,
                "stress_score": stress, "word_count": len(text.split())}

    def _empty(self):
        return {"sentiment": {"score":0,"label":"neutral","positive":0,"negative":0,"neutral":1},
                "emotions":  {"scores":{e:0 for e in EMOTION_LEXICONS},"dominant":"neutral"},
                "keywords":  [], "stress_score": 50.0, "word_count": 0}

    def aggregate_scenario_scores(self, analyses):
        if not analyses:
            return {"normalized_score":50.0,"avg_sentiment":0.0,"dominant_emotion":"neutral"}
        from collections import Counter
        stress_scores = [a["stress_score"] for a in analyses]
        sentiments    = [a["sentiment"]["score"] for a in analyses]
        emotions_list = [a["emotions"]["dominant"] for a in analyses]
        dominant      = Counter(emotions_list).most_common(1)[0][0]
        return {"normalized_score": round(sum(stress_scores)/len(stress_scores),2),
                "avg_sentiment":    round(sum(sentiments)/len(sentiments),4),
                "dominant_emotion": dominant}

nlp_pipeline = NLPPipeline()
