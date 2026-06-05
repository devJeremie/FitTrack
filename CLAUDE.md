# FitTrack — Documentation du projet

Application de suivi de fitness fullstack (Node.js + React + MySQL + Docker).

## Architecture générale

```
FitTrack/
├── docker-compose.yml          # Orchestration des 5 containers
├── .env                        # Variables d'environnement (ne pas committer)
├── .env.example                # Template des variables
├── .gitignore
├── CLAUDE.md                   # Ce fichier
├── SESSION1_DONE.md            # Suivi des sessions
│
├── backend/                    # API REST Node.js + Express
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js               # Point d'entrée, configuration Express + CORS
│   ├── config/
│   │   └── database.js         # Pool de connexions MySQL2
│   ├── middleware/
│   │   └── auth.middleware.js  # Vérification JWT Bearer token
│   ├── models/                 # Couche données (SQL via mysql2/promise)
│   │   ├── user.model.js
│   │   ├── exercise.model.js
│   │   └── workout.model.js
│   ├── controllers/            # Logique métier
│   │   ├── auth.controller.js
│   │   ├── exercise.controller.js
│   │   ├── workout.controller.js
│   │   └── stats.controller.js
│   └── routes/                 # Définition des routes Express
│       ├── auth.routes.js
│       ├── exercise.routes.js
│       ├── workout.routes.js
│       └── stats.routes.js
│
├── frontend/                   # React + Vite (Session 2)
│   ├── Dockerfile
│   └── index.html              # Page placeholder en attendant Session 2
│
├── nginx/
│   └── nginx.conf              # Proxy inverse : /api → backend:5000, / → frontend:3000
│
└── database/
    └── init.sql                # Schéma + données de test (exécuté au premier démarrage MySQL)
```

## Containers Docker

| Container           | Image            | Port externe | Port interne | Rôle                        |
|---------------------|------------------|--------------|--------------|-----------------------------|
| fittrack-mysql      | mysql:8.0        | 3306         | 3306         | Base de données principale  |
| fittrack-backend    | node:20-alpine   | 5000         | 5000         | API REST                    |
| fittrack-frontend   | node:20-alpine   | 3000         | 3000         | SPA React (Session 2)       |
| fittrack-nginx      | nginx:alpine     | 80           | 80           | Proxy inverse               |
| fittrack-phpmyadmin | phpmyadmin       | 8081         | 80           | Interface admin MySQL       |

Réseau Docker : `fittrack-network` (bridge)

## Base de données MySQL — `fittrack`

### Tables

**User**
- `id` INT PK AUTO_INCREMENT
- `username` VARCHAR(50) UNIQUE
- `email` VARCHAR(100) UNIQUE
- `password` VARCHAR(255) — hash bcrypt
- `weight` DECIMAL(5,2) — poids en kg
- `goal` ENUM('lose', 'maintain', 'gain')
- `created_at`, `updated_at` TIMESTAMP

**Exercise**
- `id` INT PK AUTO_INCREMENT
- `name` VARCHAR(100)
- `category` ENUM('Musculation', 'Cardio', 'Flexibilité')
- `muscle_group` VARCHAR(100)
- `description` TEXT
- `created_at` TIMESTAMP

**Workout**
- `id` INT PK AUTO_INCREMENT
- `user_id` FK → User.id (CASCADE DELETE)
- `title` VARCHAR(150)
- `date` DATE
- `duration` INT — minutes
- `notes` TEXT
- `created_at`, `updated_at` TIMESTAMP

**WorkoutExercise** (table de jointure)
- `id` INT PK AUTO_INCREMENT
- `workout_id` FK → Workout.id (CASCADE DELETE)
- `exercise_id` FK → Exercise.id (RESTRICT DELETE)
- `sets` INT
- `reps` INT
- `weight_used` DECIMAL(6,2) — kg
- `duration` INT — secondes (pour cardio)

## API REST

### Auth — `/api/auth`
| Méthode | Route              | Auth | Description          |
|---------|--------------------|------|----------------------|
| POST    | `/register`        | Non  | Créer un compte      |
| POST    | `/login`           | Non  | Connexion + token    |
| GET     | `/me`              | JWT  | Profil utilisateur   |

### Exercices — `/api/exercises`
| Méthode | Route     | Auth | Description                              |
|---------|-----------|------|------------------------------------------|
| GET     | `/`       | JWT  | Liste (filtres: ?category=, ?search=)    |
| GET     | `/:id`    | JWT  | Détail d'un exercice                     |
| POST    | `/`       | JWT  | Créer un exercice                        |
| PUT     | `/:id`    | JWT  | Modifier un exercice                     |
| DELETE  | `/:id`    | JWT  | Supprimer un exercice                    |

### Séances — `/api/workouts`
| Méthode | Route     | Auth | Description                              |
|---------|-----------|------|------------------------------------------|
| GET     | `/`       | JWT  | Séances de l'utilisateur connecté        |
| GET     | `/:id`    | JWT  | Détail (avec exercices)                  |
| POST    | `/`       | JWT  | Créer une séance (+ exercices optionnels)|
| PUT     | `/:id`    | JWT  | Modifier une séance                      |
| DELETE  | `/:id`    | JWT  | Supprimer une séance                     |

### Statistiques — `/api/stats`
| Méthode | Route          | Auth | Description                            |
|---------|----------------|------|----------------------------------------|
| GET     | `/progression` | JWT  | Stats: total, mensuel, par catégorie   |

## Authentification

- JWT Bearer token dans le header `Authorization: Bearer <token>`
- Token valide 7 jours
- Passwords hashés avec bcrypt (10 salt rounds)
- Middleware `auth.middleware.js` appliqué sur toutes les routes sauf `/api/auth/register` et `/api/auth/login`

## Variables d'environnement

```env
DB_HOST=mysql          # Nom du service Docker
DB_PORT=3306
DB_NAME=fittrack
DB_USER=fittrack_user
DB_PASSWORD=fittrack_pass
DB_ROOT_PASSWORD=rootpassword
PORT=5000
NODE_ENV=development
JWT_SECRET=...         # Clé secrète longue et aléatoire
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
```

## Commandes utiles

```bash
# Démarrer tous les containers
docker-compose up -d

# Voir les logs
docker-compose logs -f backend
docker-compose logs -f mysql

# Reconstruire un container spécifique
docker-compose up -d --build backend

# Accéder au shell MySQL
docker exec -it fittrack-mysql mysql -u fittrack_user -pfittrack_pass fittrack

# Arrêter et supprimer les volumes (reset DB)
docker-compose down -v

# Vérifier l'état des containers
docker-compose ps
```

## URLs de développement

- **API** : http://localhost:5000/api
- **Frontend** : http://localhost:3000
- **phpMyAdmin** : http://localhost:8081
- **Via Nginx** : http://localhost (proxy vers frontend/backend)

## Sessions de développement

- **Session 1** (actuelle) : Docker + MySQL + Backend Node.js — COMPLÈTE
- **Session 2** : Frontend React + Vite (composants, routing, Axios)
- **Session 3** : Finalisation (déploiement, tests, optimisations)
