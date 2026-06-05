-- FitTrack Database Initialization
-- Session 1: Schema + Test Data

CREATE DATABASE IF NOT EXISTS fittrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fittrack;

-- =============================================
-- TABLE: User
-- =============================================
CREATE TABLE IF NOT EXISTS User (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    weight DECIMAL(5,2) DEFAULT NULL COMMENT 'Weight in kg',
    goal ENUM('lose', 'maintain', 'gain') NOT NULL DEFAULT 'maintain',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- TABLE: Exercise
-- =============================================
CREATE TABLE IF NOT EXISTS Exercise (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category ENUM('Musculation', 'Cardio', 'Flexibilité') NOT NULL,
    muscle_group VARCHAR(100) DEFAULT NULL,
    description TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- TABLE: Workout
-- =============================================
CREATE TABLE IF NOT EXISTS Workout (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    date DATE NOT NULL,
    duration INT DEFAULT NULL COMMENT 'Duration in minutes',
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE
);

-- =============================================
-- TABLE: WorkoutExercise
-- =============================================
CREATE TABLE IF NOT EXISTS WorkoutExercise (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workout_id INT NOT NULL,
    exercise_id INT NOT NULL,
    sets INT DEFAULT NULL,
    reps INT DEFAULT NULL,
    weight_used DECIMAL(6,2) DEFAULT NULL COMMENT 'Weight in kg',
    duration INT DEFAULT NULL COMMENT 'Duration in seconds for cardio',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workout_id) REFERENCES Workout(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES Exercise(id) ON DELETE RESTRICT
);

-- =============================================
-- TEST DATA: Exercises
-- =============================================
INSERT INTO Exercise (name, category, muscle_group, description) VALUES
-- Musculation
('Développé couché', 'Musculation', 'Pectoraux', 'Exercice de base pour les pectoraux, réalisé avec une barre ou des haltères allongé sur un banc.'),
('Squat', 'Musculation', 'Quadriceps, Fessiers', 'Exercice fondamental pour les jambes, debout avec barre sur les épaules ou au poids du corps.'),
('Soulevé de terre', 'Musculation', 'Dos, Ischio-jambiers, Fessiers', 'Exercice polyarticulaire de tirage au sol, excellent pour le développement du dos et des jambes.'),
('Tractions', 'Musculation', 'Dos, Biceps', 'Exercice au poids du corps suspendu à une barre, tirage vertical.'),
('Développé militaire', 'Musculation', 'Épaules, Triceps', 'Développé épaules avec barre ou haltères depuis la position debout ou assis.'),
('Curl biceps', 'Musculation', 'Biceps', 'Flexion du coude avec haltères ou barre pour isoler les biceps.'),
('Extension triceps', 'Musculation', 'Triceps', 'Extension du coude pour isoler les triceps, réalisable à la poulie ou avec haltère.'),
('Rowing barre', 'Musculation', 'Dos, Biceps', 'Tirage horizontal avec barre pour développer le dos et les biceps.'),
('Fentes', 'Musculation', 'Quadriceps, Fessiers, Ischio-jambiers', 'Exercice unijambiste pour les jambes, excellent pour la stabilité et l équilibre.'),
('Pompes', 'Musculation', 'Pectoraux, Triceps, Épaules', 'Exercice au poids du corps pour le haut du corps, réalisable partout.'),
-- Cardio
('Course à pied', 'Cardio', 'Corps entier', 'Exercice cardio fondamental, peut être réalisé en extérieur ou sur tapis de course.'),
('Vélo stationnaire', 'Cardio', 'Jambes, Corps entier', 'Cardio à faible impact articulaire, idéal pour une récupération active.'),
('Corde à sauter', 'Cardio', 'Corps entier, Coordination', 'Cardio intense qui améliore la coordination et brûle beaucoup de calories.'),
('Rameur', 'Cardio', 'Corps entier', 'Exercice cardio complet sollicitant le dos, les jambes et les bras.'),
('HIIT', 'Cardio', 'Corps entier', 'Entraînement par intervalles à haute intensité, alternance effort maximal et récupération.'),
-- Flexibilité
('Étirement ischio-jambiers', 'Flexibilité', 'Ischio-jambiers', 'Étirement statique des muscles à l arrière de la cuisse pour améliorer la mobilité.'),
('Yoga - Chien tête en bas', 'Flexibilité', 'Corps entier', 'Posture yoga classique qui étire les mollets, les ischio-jambiers et renforce les bras.'),
('Étirement des épaules', 'Flexibilité', 'Épaules, Dos supérieur', 'Étirement pour soulager les tensions au niveau des épaules et du haut du dos.'),
('Rotation du tronc', 'Flexibilité', 'Colonne vertébrale, Obliques', 'Mobilité de la colonne vertébrale, peut être réalisée assis ou debout.'),
('Foam roller dos', 'Flexibilité', 'Dos, Fascias', 'Auto-massage avec rouleau de mousse pour détendre les muscles du dos et les fascias.');

-- =============================================
-- TEST DATA: Users (passwords pre-hashed for test — real hash done by bcrypt in the app)
-- Note: The passwords below are bcrypt hashes of 'Password123!'
-- =============================================
INSERT INTO User (username, email, password, weight, goal) VALUES
('jean_dupont', 'jean.dupont@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 82.5, 'lose'),
('marie_martin', 'marie.martin@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 65.0, 'maintain'),
('alex_bernard', 'alex.bernard@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 70.0, 'gain');

-- =============================================
-- TEST DATA: Workouts
-- =============================================
INSERT INTO Workout (user_id, title, date, duration, notes) VALUES
(1, 'Full Body - Lundi', '2026-05-26', 65, 'Bonne séance, augmenter le poids au squat la prochaine fois'),
(1, 'Cardio - Mercredi', '2026-05-28', 40, 'Course à allure modérée, bon rythme cardiaque'),
(1, 'Upper Body - Vendredi', '2026-05-30', 55, 'Pectoraux et dos, bonne pompe'),
(2, 'Yoga Matin', '2026-05-27', 45, 'Séance relaxante, focus sur la respiration'),
(2, 'Cardio HIIT', '2026-05-29', 30, 'Très intense, 8 séries de 20s effort / 10s repos'),
(3, 'Prise de masse - Push', '2026-05-25', 70, 'Développé couché : PR à 100kg !'),
(3, 'Prise de masse - Pull', '2026-05-27', 65, 'Tractions lestées, focus sur l étirement en bas');

-- =============================================
-- TEST DATA: WorkoutExercises
-- =============================================
INSERT INTO WorkoutExercise (workout_id, exercise_id, sets, reps, weight_used, duration) VALUES
-- Workout 1: Full Body (jean_dupont)
(1, 2, 4, 8, 80.0, NULL),   -- Squat 4x8 à 80kg
(1, 1, 3, 10, 60.0, NULL),  -- Développé couché 3x10 à 60kg
(1, 8, 3, 10, 50.0, NULL),  -- Rowing barre 3x10 à 50kg
(1, 16, 1, NULL, NULL, 300), -- Étirement ischio-jambiers 5min

-- Workout 2: Cardio (jean_dupont)
(2, 11, NULL, NULL, NULL, 2400), -- Course 40min

-- Workout 3: Upper Body (jean_dupont)
(3, 1, 4, 8, 65.0, NULL),   -- Développé couché 4x8 à 65kg
(3, 4, 3, 8, NULL, NULL),   -- Tractions 3x8 au poids du corps
(3, 5, 3, 10, 40.0, NULL),  -- Développé militaire 3x10 à 40kg
(3, 6, 3, 12, 12.0, NULL),  -- Curl biceps 3x12 à 12kg

-- Workout 4: Yoga (marie_martin)
(4, 17, 1, NULL, NULL, 120), -- Chien tête en bas 2min
(4, 18, 1, NULL, NULL, 60),  -- Étirement épaules 1min
(4, 19, 1, NULL, NULL, 90),  -- Rotation tronc 1.5min

-- Workout 5: HIIT (marie_martin)
(5, 15, 8, NULL, NULL, 20),  -- HIIT 8 rounds
(5, 13, 3, NULL, NULL, 60),  -- Corde à sauter 3x1min

-- Workout 6: Push (alex_bernard)
(6, 1, 5, 5, 100.0, NULL),  -- Développé couché 5x5 à 100kg - PR!
(6, 5, 4, 8, 60.0, NULL),   -- Développé militaire 4x8 à 60kg
(6, 7, 4, 10, 35.0, NULL),  -- Extension triceps 4x10 à 35kg
(6, 10, 3, 15, NULL, NULL), -- Pompes 3x15

-- Workout 7: Pull (alex_bernard)
(7, 4, 5, 6, 20.0, NULL),   -- Tractions lestées 5x6 à +20kg
(7, 8, 4, 8, 70.0, NULL),   -- Rowing barre 4x8 à 70kg
(7, 6, 3, 10, 20.0, NULL),  -- Curl biceps 3x10 à 20kg
(7, 16, 1, NULL, NULL, 180); -- Étirement ischio-jambiers 3min
