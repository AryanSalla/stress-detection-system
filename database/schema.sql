CREATE DATABASE IF NOT EXISTS stress_detection
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE stress_detection;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    age INT,
    gender ENUM('male','female','other','prefer_not_to_say') DEFAULT 'prefer_not_to_say',
    institution VARCHAR(150),
    course VARCHAR(100),
    year_of_study INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE quiz_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_text TEXT NOT NULL,
    category ENUM('academic','social','physical','emotional','financial') NOT NULL,
    weight DECIMAL(4,2) NOT NULL DEFAULT 1.0,
    order_num INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE quiz_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_token VARCHAR(100) UNIQUE,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    raw_score DECIMAL(6,2),
    normalized_score DECIMAL(5,2),
    stress_level ENUM('low','moderate','high') DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE quiz_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    question_id INT NOT NULL,
    response_value INT NOT NULL,
    weighted_score DECIMAL(5,2),
    responded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES quiz_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES quiz_questions(id)
);

CREATE TABLE scenarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    context TEXT,
    category ENUM('academic','social','family','career','health') NOT NULL,
    difficulty ENUM('mild','moderate','severe') DEFAULT 'moderate',
    order_num INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE scenario_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    raw_score DECIMAL(6,2),
    normalized_score DECIMAL(5,2),
    avg_sentiment DECIMAL(5,4),
    dominant_emotion VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE scenario_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    scenario_id INT NOT NULL,
    response_text TEXT NOT NULL,
    sentiment_score DECIMAL(6,4),
    sentiment_label ENUM('positive','neutral','negative') DEFAULT 'neutral',
    emotion_primary VARCHAR(50),
    emotion_scores JSON,
    keywords JSON,
    stress_indicator DECIMAL(5,2),
    responded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES scenario_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (scenario_id) REFERENCES scenarios(id)
);

CREATE TABLE assessments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    quiz_session_id INT,
    scenario_session_id INT,
    quiz_score DECIMAL(5,2),
    scenario_score DECIMAL(5,2),
    final_score DECIMAL(5,2),
    stress_level ENUM('low','moderate','high') NOT NULL,
    confidence DECIMAL(5,4),
    model_used VARCHAR(50) DEFAULT 'weighted_formula',
    assessment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (quiz_session_id) REFERENCES quiz_sessions(id),
    FOREIGN KEY (scenario_session_id) REFERENCES scenario_sessions(id)
);

CREATE TABLE recommendations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assessment_id INT NOT NULL,
    category ENUM('immediate','short_term','long_term','professional') NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    resource_link VARCHAR(500),
    priority INT DEFAULT 1,
    is_ai_generated BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
);

CREATE TABLE chat_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_token VARCHAR(100) UNIQUE,
    context JSON,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_active DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    role ENUM('user','assistant','system') NOT NULL,
    content TEXT NOT NULL,
    tokens_used INT,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
);

CREATE TABLE stress_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    alert_type ENUM('high_stress','trend_warning','missed_assessment','improvement') NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);