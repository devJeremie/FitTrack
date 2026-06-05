# Session 1 — Compte rendu

## Ce qui a été fait

### Infrastructure Docker
- [x] `docker-compose.yml` avec 5 containers orchestrés
- [x] Container MySQL 8 (port 3306) avec healthcheck
- [x] Container Node.js backend (port 5000) — attend que MySQL soit healthy
- [x] Container React frontend (port 3000) — placeholder, page "Coming Soon"
- [x] Container Nginx (port 80) — proxy inverse vers backend et frontend
- [x] Container phpMyAdmin (port 8081) — interface admin MySQL
- [x] Réseau Docker bridge `fittrack-network`
- [x] Volume persistant pour les données MySQL

### Base de données MySQL
- [x] Script `database/init.sql` exécuté automatiquement au premier démarrage
- [x] Table `User` (id, username, email, password, weight, goal, created_at)
- [x] Table `Exercise` (id, name, category, muscle_group, description)
- [x] Table `Workout` (id, user_id, title, date, duration, notes)
- [x] Table `WorkoutExercise` (id, workout_id, exercise_id, sets, reps, weight_used, duration)
- [x] Clés étrangères avec CASCADE DELETE (Workout → User, WorkoutExercise → Workout)
- [x] 20 exercices de test (Musculation, Cardio, Flexibilité)
- [x] 3 utilisateurs de test
- [x] 7 séances de test avec exercices associés

### Backend Node.js + Express
- [x] Architecture MVC : `routes/`, `controllers/`, `models/`
- [x] Fichier `.env` avec toutes les variables d'environnement
- [x] Pool de connexions MySQL2 (`config/database.js`)
- [x] Middleware d'authentification JWT (`middleware/auth.middleware.js`)
- [x] CORS configuré pour le frontend (port 3000)
- [x] Gestion des erreurs globale

#### Authentification JWT
- [x] `POST /api/auth/register` — Inscription avec validation
- [x] `POST /api/auth/login` — Connexion + token JWT 7 jours
- [x] `GET /api/auth/me` — Profil (protégé)
- [x] Passwords hashés avec bcrypt (10 salt rounds)

#### CRUD Exercices
- [x] `GET /api/exercises` — Liste (filtres: ?category=, ?search=)
- [x] `GET /api/exercises/:id` — Détail
- [x] `POST /api/exercises` — Créer
- [x] `PUT /api/exercises/:id` — Modifier
- [x] `DELETE /api/exercises/:id` — Supprimer (avec protection FK)

#### CRUD Séances
- [x] `GET /api/workouts` — Liste des séances de l'utilisateur
- [x] `GET /api/workouts/:id` — Détail avec exercices joints
- [x] `POST /api/workouts` — Créer séance + exercices en une requête
- [x] `PUT /api/workouts/:id` — Modifier
- [x] `DELETE /api/workouts/:id` — Supprimer (cascade sur WorkoutExercise)

#### Statistiques
- [x] `GET /api/stats/progression` — Stats globales :
  - Total séances, minutes, durée moyenne, exercices uniques
  - Stats mensuelles (6 derniers mois)
  - Répartition par catégorie d'exercice
  - 5 dernières séances

### Documentation
- [x] `CLAUDE.md` — Architecture complète du projet
- [x] `SESSION1_DONE.md` — Ce fichier
- [x] `.env.example` — Template des variables d'environnement
- [x] `.gitignore` — Exclusion de .env et node_modules

---

## Comment tester les routes (exemples curl)

### 1. Inscription
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@test.com","password":"Password123","weight":75,"goal":"lose"}'
```

### 2. Connexion
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Password123"}'
# → Récupérer le token dans la réponse
```

### 3. Liste des exercices (avec token)
```bash
curl http://localhost:5000/api/exercises \
  -H "Authorization: Bearer <TOKEN>"

# Avec filtre catégorie
curl "http://localhost:5000/api/exercises?category=Musculation" \
  -H "Authorization: Bearer <TOKEN>"
```

### 4. Créer une séance avec exercices
```bash
curl -X POST http://localhost:5000/api/workouts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "title": "Ma séance du jour",
    "date": "2026-06-04",
    "duration": 60,
    "notes": "Super séance !",
    "exercises": [
      {"exercise_id": 1, "sets": 4, "reps": 8, "weight_used": 80},
      {"exercise_id": 11, "duration": 1800}
    ]
  }'
```

### 5. Statistiques de progression
```bash
curl http://localhost:5000/api/stats/progression \
  -H "Authorization: Bearer <TOKEN>"
```

### 6. Vérifier API Health
```bash
curl http://localhost:5000/api
```

---

## Ce qui reste pour les Sessions 2 et 3

### Session 2 — Frontend React + Vite
- [ ] Scaffolding Vite + React + TypeScript
- [ ] Configuration React Router v6 (routes: login, register, dashboard, exercises, workouts)
- [ ] Axios avec intercepteur JWT (ajout auto du header)
- [ ] Page d'authentification (Register/Login)
- [ ] Dashboard avec stats visuelles (Chart.js ou Recharts)
- [ ] Page Exercices (liste, filtres, création, modification)
- [ ] Page Séances (liste, création avec sélection d'exercices)
- [ ] Détail d'une séance
- [ ] Gestion d'état (Context API ou Zustand)
- [ ] Notifications toast (succès/erreur)
- [ ] Design responsive (Tailwind CSS)

### Session 3 — Finalisation
- [ ] Tests unitaires backend (Jest + Supertest)
- [ ] Tests de composants React (Vitest + Testing Library)
- [ ] Optimisations Docker (multi-stage builds)
- [ ] Variables d'environnement de production
- [ ] Monitoring des performances (logs structurés)
- [ ] README complet avec screenshots
- [ ] Déploiement (VPS ou cloud)

---

## Commandes pour démarrer

```bash
# Premier démarrage (construit les images + init DB)
docker-compose up --build -d

# Démarrages suivants
docker-compose up -d

# Vérifier que tout tourne
docker-compose ps

# Voir les logs en temps réel
docker-compose logs -f
```
