# FitTrack — Documentation du projet
# Url du projet en ligne : https://fit-track-hbs3.vercel.app/dashboard

Application de suivi de fitness fullstack (Node.js + React + MySQL + Docker).

## Architecture générale

```
FitTrack/
├── docker-compose.yml          # Orchestration des 5 containers
├── .env                        # Variables d'environnement (ne pas committer)
├── .env.example                # Template des variables
├── .gitignore
├── CLAUDE.md                   # Ce fichier
├── SESSION1_DONE.md            # Compte rendu Session 1
├── SESSION2_DONE.md            # Compte rendu Session 2
├── SESSION3_DONE.md            # Compte rendu Session 3
├── SESSION4_DONE.md            # Compte rendu Session 4 (app mobile)
├── SESSION5_DONE.md            # Compte rendu Session 5 (déploiement prod)
├── DEPLOYMENT.md                # Guide de déploiement prod (Clever Cloud + Render + Vercel)
├── render.yaml                  # Blueprint Render (backend Docker)
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
├── frontend/                   # React + Vite — SPA complète, volume monté (dev)
│   ├── Dockerfile
│   ├── index.html
│   ├── vite.config.ts          # Proxy /api → backend:5000, host 0.0.0.0, port 3000
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── package.json            # Vite + React 18 + TS + Tailwind + Recharts + Axios
│   └── src/
│       ├── main.tsx
│       ├── App.tsx             # React Router v6 + Toaster dark theme
│       ├── index.css           # Tailwind + dark theme + scrollbar custom
│       ├── types/
│       │   └── index.ts        # User, Exercise, Workout, WorkoutExercise, ProgressionStats
│       ├── services/
│       │   └── api.ts          # Axios instance + intercepteur JWT Bearer + redirect 401
│       ├── context/
│       │   └── AuthContext.tsx # AuthProvider : login / register / logout
│       ├── hooks/
│       │   ├── useAuth.ts
│       │   └── useFetch.ts     # Hook générique useFetch<T>
│       ├── components/
│       │   ├── LoadingSpinner.tsx
│       │   ├── PrivateRoute.tsx
│       │   └── Layout/
│       │       ├── Sidebar.tsx # Dark sidebar, nav indigo, avatar initiales
│       │       └── Layout.tsx
│       └── pages/
│           ├── Login.tsx
│           ├── Register.tsx
│           ├── Dashboard.tsx   # 4 stat cards + BarChart Recharts + dernières séances
│           ├── Exercises.tsx   # Grille cards + filtres + search + modal CRUD
│           ├── Workouts.tsx    # Liste + créer/éditer avec gestion exercices complète
│           ├── WorkoutDetail.tsx  # Détail + ajout/édition inline/suppression exercices
│           └── Profile.tsx     # Infos user + graphique activité mensuelle
│
├── nginx/
│   └── nginx.conf              # Proxy inverse : /api → backend:5000, / → frontend:3000
│
├── database/
│   └── init.sql                # Schéma + données de test (exécuté au premier démarrage MySQL)
│
└── mobile/                     # App React Native + Expo
    ├── App.tsx                 # Point d'entrée : Stack + BottomTabs + AuthProvider + Toast
    ├── app.json                # Configuration Expo
    ├── babel.config.js         # babel-preset-expo
    ├── tsconfig.json           # extends expo/tsconfig.base + strict + baseUrl + paths @/*
    ├── package.json            # Expo 52 + React Native 0.76 + React Navigation + Axios
    └── src/
        ├── config.ts           # API_URL — IP locale à configurer
        ├── types/
        │   └── index.ts        # User, Exercise, Workout, WorkoutExercise, ProgressionStats, RootStackParamList, TabParamList
        ├── constants/
        │   └── colors.ts       # Design tokens calqués sur le frontend web
        ├── services/
        │   └── api.ts          # Axios + intercepteurs JWT Bearer + suppression token 401
        ├── context/
        │   └── AuthContext.tsx # AuthProvider : login / register / logout + AsyncStorage
        ├── components/
        │   └── LoadingSpinner.tsx
        └── screens/
            ├── LoginScreen.tsx
            ├── RegisterScreen.tsx
            ├── DashboardScreen.tsx     # 4 stat cards + BarChart + répartition catégories + dernières séances
            ├── ExercisesScreen.tsx     # FlatList + recherche debounce + filtres + Modal CRUD
            ├── WorkoutsScreen.tsx      # FlatList + Modal création/édition + navigation WorkoutDetail
            ├── WorkoutDetailScreen.tsx # Exercices séance + Modal ajout/édition + picker imbriqué
            └── ProfileScreen.tsx       # Avatar initiales + stats + activité mensuelle + déconnexion
```

## Containers Docker

| Container           | Image            | Port externe | Port interne | Rôle                        |
|---------------------|------------------|--------------|--------------|-----------------------------|
| fittrack-mysql      | mysql:8.0        | 3306         | 3306         | Base de données principale  |
| fittrack-backend    | node:20-alpine   | 5000         | 5000         | API REST                    |
| fittrack-frontend   | node:20-alpine   | 3000         | 3000         | SPA React (Vite dev server) |
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
| Méthode | Route                    | Auth | Description                              |
|---------|--------------------------|------|------------------------------------------|
| GET     | `/`                      | JWT  | Séances de l'utilisateur connecté        |
| GET     | `/:id`                   | JWT  | Détail (avec exercices)                  |
| POST    | `/`                      | JWT  | Créer une séance (+ exercices optionnels)|
| PUT     | `/:id`                   | JWT  | Modifier séance + remplacer exercices    |
| DELETE  | `/:id`                   | JWT  | Supprimer une séance                     |
| POST    | `/:id/exercises`         | JWT  | Ajouter un exercice à une séance         |
| PATCH   | `/:id/exercises/:weId`   | JWT  | Modifier les stats d'un exercice         |
| DELETE  | `/:id/exercises/:weId`   | JWT  | Retirer un exercice d'une séance         |

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

## Points d'attention / correctifs appliqués

- **Encodage MySQL** : `database/init.sql` commence par `SET NAMES utf8mb4` pour éviter le double-encodage des accents (ex. `Flexibilité` → `FlexibilitÃ©`). `backend/config/database.js` spécifie aussi `charset: 'utf8mb4'`.
- **Volume frontend** : `docker-compose.yml` monte `./frontend:/app` pour que Vite HMR détecte les modifications de code sans rebuild.
- **Reset DB** : si les containers MySQL ont été créés avec d'anciens credentials, faire `docker-compose down -v && docker-compose up -d` pour réinitialiser le volume.
- **Mobile — IP API** : `mobile/src/config.ts` contient `API_URL = 'http://192.168.1.X:5000/api'`. Remplacer `X` par l'IP WiFi réelle de la machine (commande `ipconfig` sur Windows). Ne pas utiliser `localhost` (Expo tourne sur le téléphone, pas le PC).
- **Mobile — node_modules** : si `npm install` échoue avec `Invalid Version`, supprimer `node_modules` via `robocopy` (les chemins dépassent 260 chars sur Windows, `Remove-Item` PowerShell échoue) puis relancer `npm install`.

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

### App mobile (depuis `mobile/`)
```bash
# Lancer le serveur Expo (scanner le QR code avec Expo Go)
npx expo start

# Cibler un OS spécifique
npx expo start --android
npx expo start --ios

# Réinstaller les dépendances (si node_modules corrompu)
# Sur Windows : supprimer node_modules via robocopy (chemins > 260 chars)
robocopy _empty_tmp node_modules /MIR && rmdir /s /q node_modules
npm install
```

## URLs de développement

- **API** : http://localhost:5000/api
- **Frontend** : http://localhost:3000
- **phpMyAdmin** : http://localhost:8081
- **Via Nginx** : http://localhost (proxy vers frontend/backend)

## Tests

### Backend — Jest + Supertest (`backend/`)
```bash
# Dans le container
docker exec -it fittrack-backend npm test
docker exec -it fittrack-backend npm run test:coverage
```
- `jest.config.js` — config Jest (testEnvironment: node, setupFiles, coverage)
- `tests/setup.js` — variables d'environnement de test (JWT_SECRET, NODE_ENV=test)
- `tests/auth.test.js` — 14 tests : register, login, GET /me
- `tests/exercises.test.js` — 13 tests : CRUD exercices + erreurs FK
- `tests/workouts.test.js` — 10 tests : CRUD séances
- `tests/middleware.test.js` — 5 tests : token absent/invalide/expiré/valide

Stratégie : mock `config/database` (pas de connexion MySQL) + mock des models.
`server.js` ne bind pas le port si `NODE_ENV=test`.

### Frontend — Vitest + React Testing Library (`frontend/`)
```bash
# Dans le container
docker exec -it fittrack-frontend npm test
docker exec -it fittrack-frontend npm run test:coverage
```
- `vitest.config.ts` — config Vitest (environment: jsdom, setupFiles)
- `src/tests/setup.ts` — import @testing-library/jest-dom
- `src/tests/Login.test.tsx` — 6 tests : affichage, soumission, redirection, erreur, loading
- `src/tests/Register.test.tsx` — 7 tests : champs, objectif, soumission, redirection
- `src/tests/Sidebar.test.tsx` — 6 tests : nav, user info, initiales, logout
- `src/tests/PrivateRoute.test.tsx` — 4 tests : spinner, redirect, accès autorisé
- `src/tests/useAuth.test.tsx` — 5 tests : erreur hors provider, contexte, states
- `src/tests/useFetch.test.tsx` — 6 tests : loading, data, error, refetch
- `src/tests/Dashboard.test.tsx` — 6 tests : spinner, stats cards, séances récentes

## Sessions de développement

- **Session 1** — COMPLÈTE : Docker + MySQL + Backend Node.js (API REST complète)
- **Session 2** — COMPLÈTE : Frontend React + Vite + TypeScript + Tailwind (SPA fullstack fonctionnelle)
- **Session 3** — COMPLÈTE : Audit routes, vérification intégration, nettoyage, documentation
- **Session 3.5** — COMPLÈTE : Tests unitaires Jest (backend) + Vitest/RTL (frontend)
- **Session 4** — COMPLÈTE : App mobile React Native + Expo (9 écrans, navigation, commentaires pédagogiques, corrections tsconfig + node_modules)
- **Session 5** — COMPLÈTE : Déploiement production (Clever Cloud + Render + Vercel), correctifs SSL/CORS/VITE_API_URL
