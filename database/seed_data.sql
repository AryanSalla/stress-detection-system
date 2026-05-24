USE stress_detection;

INSERT INTO quiz_questions (question_text, category, weight, order_num) VALUES
('How often do you feel overwhelmed by your academic workload?', 'academic', 1.5, 1),
('Do you frequently worry about failing exams or assignments?', 'academic', 1.5, 2),
('How often do you miss deadlines due to stress or anxiety?', 'academic', 1.4, 3),
('How difficult is it for you to concentrate while studying?', 'academic', 1.3, 4),
('How often do you feel socially isolated or lonely?', 'social', 1.2, 5),
('Do you find it hard to communicate your problems to friends or family?', 'social', 1.1, 6),
('How often do conflicts with peers or classmates bother you?', 'social', 1.0, 7),
('How frequently do you experience physical symptoms like headache or fatigue?', 'physical', 1.3, 8),
('How often does stress affect your sleep quality?', 'physical', 1.4, 9),
('How often do you skip meals or eat poorly due to stress?', 'physical', 1.2, 10),
('How often do you feel hopeless or helpless about your situation?', 'emotional', 1.5, 11),
('How frequently do you experience sudden mood swings or irritability?', 'emotional', 1.3, 12),
('How often do you feel anxious or have panic attacks?', 'emotional', 1.5, 13),
('How much does financial pressure contribute to your daily stress?', 'financial', 1.2, 14),
('How often does worry about future career prospects cause you stress?', 'financial', 1.1, 15);

INSERT INTO scenarios (title, description, context, category, difficulty, order_num) VALUES
('The Exam Pressure', 'You have three major exams scheduled within the same week. You have barely covered 40% of the syllabus for the most important one. Your study group has disbanded, and you cannot focus at home due to noise. What would you do and how do you feel about this situation?', 'Tests academic stress response and coping mechanisms.', 'academic', 'severe', 1),
('Social Rejection', 'You submitted a project proposal you worked on for weeks. Your professor publicly criticized it in front of the class, saying it was below standard. Your classmates seemed to agree. How do you feel and what would be your next steps?', 'Tests response to public criticism, self-esteem, and resilience.', 'social', 'moderate', 2),
('Family Expectations', 'Your parents have high expectations for you to pursue a career path you do not enjoy. They are funding your education, and every conversation ends in an argument about your future. You feel trapped between your passion and family duty. How do you handle this?', 'Tests conflict between personal goals and family pressure.', 'family', 'severe', 3),
('Financial Crisis', 'Your scholarship has been unexpectedly cancelled mid-semester. You have rent due next week, your laptop broke down, and you are not sure if you can continue your studies. You do not want to burden your parents. What do you think and do?', 'Tests financial stress response and problem-solving under pressure.', 'career', 'severe', 4),
('Burnout Moment', 'You have been working part-time while attending full-time college for 6 months. You feel exhausted, have not had a proper break, and your grades are slipping. Your manager just asked you to work extra shifts this weekend. How do you respond?', 'Tests burnout recognition and self-advocacy.', 'health', 'moderate', 5),
('Relationship Conflict', 'Your closest friend at college suddenly stopped talking to you after a minor disagreement. You tried reaching out multiple times but received no response. This person was your main support system. How are you coping with this situation?', 'Tests social support and emotional coping strategies.', 'social', 'moderate', 6),
('Career Uncertainty', 'You are in your final year and everyone around you seems to have job offers or clear career plans. You have had 5 rejection emails this month. Your confidence is at an all-time low and graduation is 3 months away. How do you feel and what are you doing about it?', 'Tests future anxiety and career-related stress.', 'career', 'severe', 7);

INSERT INTO users (username, email, password_hash, full_name, age, institution, course, year_of_study) VALUES
('demo_student', 'demo@stressdetect.ai', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8zB.ywA9v5j6m0ViXKu', 'Demo Student', 21, 'National Institute of Technology', 'Computer Science', 3);
```

---

### Step 4 — Run both files in MySQL Workbench

1. Open MySQL Workbench → click your **db** connection
2. **File → Open SQL Script** → open `schema.sql` → click ⚡
3. **File → Open SQL Script** → open `seed_data.sql` → click ⚡

Then run the backend:
```
venv\Scripts\activate
python backend/run.py