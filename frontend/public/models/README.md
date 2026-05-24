# Face-API.js Model Files

This folder must contain the face-api.js pre-trained model files
for the Facial Emotion Recognition feature to work.

## Download Instructions

1. Go to: https://github.com/justadudewhohacks/face-api.js/tree/master/weights

2. Download these files and place them in THIS folder:

   - tiny_face_detector_model-weights_manifest.json
   - tiny_face_detector_model-shard1
   - face_expression_recognition_model-weights_manifest.json
   - face_expression_recognition_model-shard1

## Quick Download (using curl or wget)

BASE=https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights

curl -O $BASE/tiny_face_detector_model-weights_manifest.json
curl -O $BASE/tiny_face_detector_model-shard1
curl -O $BASE/face_expression_recognition_model-weights_manifest.json
curl -O $BASE/face_expression_recognition_model-shard1

## Note
- The app works WITHOUT these files (emotion detection panel will show a setup notice)
- Voice input works independently of these files
- These files are NOT included in the zip due to size (~2MB each)
