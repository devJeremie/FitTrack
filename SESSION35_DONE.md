# Session 3.5 — Compte rendu : Tests unitaires

## Objectif

Mise en place d'une suite de tests complète pour le backend (Jest + Supertest) et le frontend (Vitest + React Testing Library).

---

## Résultats finaux

```
Backend  → 4 suites | 42 tests | 100% PASS ✅
Frontend → 7 suites | 40 tests | 100% PASS ✅
Total    → 82 tests passent
```

---

## Backend — Jest + Supertest

### Installation et configuration

**Packages ajoutés** (`backend/package.json`) :
- `jest` ^29.7.0
- `supertest` ^6.3.4

**Nouveaux scripts** :
```json
"test": "jest --forceExit",
"test:coverage": "jest --coverage --forceExit"
```

**Fichiers de configuration** :
- `backend/jest.config.js` — testEnvironment: node, setupFiles, coverage sur controllers/middleware/routes
- `backend/tests/setup.js` — JWT_SECRET, JWT_EXPIRES_IN, NODE_ENV=test

**Modification de `server.js`** :
```js
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => { ... })
}
```
→ Évite le bind de port pendant les tests (Supertest gère sa propre connexion).

### Stratégie de mock

- `jest.mock('../config/database', ...)` → empêche toute connexion MySQL réelle
- `jest.mock('../models/user.model', ...)` → contrôle les retours du modèle
- Tokens JWT générés avec la clé de test pour tester les routes protégées
- Chaque fichier de test mock uniquement le model dont il a besoin

### Fichiers de tests backend

| Fichier | Tests | Couverture |
|---------|-------|------------|
| `tests/auth.test.js` | 14 | POST /register (6), POST /login (4), GET /me (3) |
| `tests/exercises.test.js` | 13 | GET (4), POST (4), PUT (3), DELETE (3) |
| `tests/workouts.test.js` | 10 | GET (3), POST (4), DELETE (3) |
| `tests/middleware.test.js` | 5 | Sans token, format invalide, token invalide, expiré, valide |
| **Total** | **42** | |

### Cas testés (backend)

**Auth** :
- ✅ Inscription réussie (201) avec token + user dans la réponse
- ✅ Username manquant (400)
- ✅ Email manquant (400)
- ✅ Mot de passe < 6 chars (400)
- ✅ Email déjà utilisé (409)
- ✅ Username déjà pris (409)
- ✅ Connexion réussie (200) sans `password` dans la réponse
- ✅ Champs login manquants (400)
- ✅ Email inexistant (401)
- ✅ Mot de passe incorrect (401)
- ✅ GET /me avec token valide (200)
- ✅ GET /me sans token (401)
- ✅ GET /me avec token invalide (401)

**Exercices** :
- ✅ Liste avec auth (200), sans auth (401)
- ✅ Catégorie invalide en filtre (400)
- ✅ Toutes les catégories valides acceptées (Musculation, Cardio, Flexibilité)
- ✅ Création réussie (201)
- ✅ Name manquant (400), category manquante (400)
- ✅ Catégorie invalide à la création (400)
- ✅ Modification réussie (200)
- ✅ Modification exercice inexistant (404)
- ✅ Catégorie invalide à la modification (400)
- ✅ Suppression réussie (200)
- ✅ Suppression inexistant (404)
- ✅ Contrainte FK (exercice utilisé dans une séance) → 409

**Séances** :
- ✅ Liste des séances (200), sans auth (401)
- ✅ Liste vide (200)
- ✅ Création avec titre + date (201)
- ✅ Title manquant (400), date manquante (400)
- ✅ Création avec exercices (addExercise appelé une fois)
- ✅ Suppression réussie (200)
- ✅ Séance inexistante (404)
- ✅ Suppression sans auth (401)

**Middleware** :
- ✅ Sans header Authorization → 401 "Access denied. No token provided."
- ✅ Format invalide (pas de "Bearer") → 401
- ✅ Token invalide → 401 "Invalid token."
- ✅ Token expiré → 401 "Token expired. Please log in again."
- ✅ Token valide → 200 + `req.user` attaché avec id/email/username

---

## Frontend — Vitest + React Testing Library

### Installation et configuration

**Packages ajoutés** (`frontend/package.json`) :
- `vitest` ^1.6.0
- `@testing-library/react` ^14.3.0
- `@testing-library/user-event` ^14.5.0
- `@testing-library/jest-dom` ^6.4.0
- `@vitest/coverage-v8` ^1.6.0
- `jsdom` ^24.1.0

**Nouveaux scripts** :
```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

**Fichiers de configuration** :
- `frontend/vitest.config.ts` — séparé de vite.config.ts, `globals: true`, environment: jsdom, setupFiles
- `frontend/src/tests/setup.ts` — import @testing-library/jest-dom

**Note importante sur `globals: true`** : `@testing-library/jest-dom` a besoin que `expect` soit disponible globalement. Avec `globals: false`, l'import `'@testing-library/jest-dom'` dans setup.ts lève une `ReferenceError`. Le flag `globals: true` est requis pour que la suite de tests fonctionne.

**Note** : `vitest.config.ts` est séparé de `vite.config.ts` (pattern recommandé par Vitest pour éviter les conflits de types Vite/Vitest).

### Stratégie de mock

- `vi.mock('react-router-dom', async () => ...)` avec `vi.importActual` → mockNavigate pour tester les redirections
- `vi.mock('react-hot-toast', ...)` → toast.error, toast.success
- `vi.mock('../services/api', ...)` → api.get, api.post pour simuler les appels HTTP
- `vi.mock('recharts', ...)` → composants chart mockés pour compatibilité jsdom (pas de SVG renderer)
- `AuthContext.Provider` → fourni directement avec des valeurs contrôlées (pas d'AuthProvider réel)
- `MemoryRouter` → contexte de routage pour les composants qui utilisent Link/NavLink

### Fichiers de tests frontend

| Fichier | Tests | Composant/Hook |
|---------|-------|----------------|
| `tests/Login.test.tsx` | 6 | Page Login |
| `tests/Register.test.tsx` | 7 | Page Register |
| `tests/Sidebar.test.tsx` | 6 | Composant Sidebar |
| `tests/PrivateRoute.test.tsx` | 4 | Composant PrivateRoute |
| `tests/useAuth.test.tsx` | 5 | Hook useAuth |
| `tests/useFetch.test.tsx` | 6 | Hook useFetch |
| `tests/Dashboard.test.tsx` | 6 | Page Dashboard |
| **Total** | **40** | |

### Cas testés (frontend)

**Login** :
- ✅ Affichage du formulaire (email, password, bouton)
- ✅ Lien vers la page d'inscription
- ✅ Appel de `login()` avec les bons identifiants
- ✅ Redirection vers /dashboard après succès
- ✅ Toast d'erreur en cas d'échec
- ✅ Bouton désactivé pendant le loading

**Register** :
- ✅ Affichage de tous les champs (username, email, password, poids, objectif)
- ✅ Sélecteur d'objectif avec valeur par défaut "Maintenir"
- ✅ 3 options d'objectif (Perdre, Maintenir, Prendre)
- ✅ Appel de `register()` avec les données correctes
- ✅ Redirection vers /dashboard après succès
- ✅ Lien vers la page de connexion
- ✅ Toast d'erreur en cas d'échec

**Sidebar** :
- ✅ Affichage des liens nav (Dashboard, Exercices, Déconnexion)
- ✅ Nom d'utilisateur et email affichés
- ✅ Initiales calculées (2 premières lettres du username en majuscules)
- ✅ "FT" affiché si pas d'utilisateur
- ✅ `logout()` appelé + redirection /login au clic Déconnexion
- ✅ Logo "FitTrack" présent

**PrivateRoute** :
- ✅ Spinner affiché pendant loading: true
- ✅ Redirection vers /login si user: null
- ✅ Contenu protégé rendu si user défini
- ✅ Contenu non affiché pendant le chargement

**useAuth** :
- ✅ Erreur si utilisé hors AuthProvider
- ✅ Retourne les valeurs du contexte
- ✅ user: null si non connecté
- ✅ loading: true pendant le chargement
- ✅ Expose les références exactes de login, logout, register

**useFetch** :
- ✅ loading: true au démarrage, data: null, error: null
- ✅ Données retournées après succès + loading: false
- ✅ Erreur "Impossible de charger les données" en cas d'échec + data: null
- ✅ refetch() déclenche un nouvel appel API
- ✅ loading remis à true lors du refetch
- ✅ URL correcte passée à api.get

**Dashboard** :
- ✅ Spinner pendant le chargement
- ✅ Message de bienvenue avec username
- ✅ 4 labels de cards de stats (Séances totales, Minutes, Durée moyenne, Exercices différents)
- ✅ 4 valeurs de stats (12, 720, "45 min", 9)
- ✅ Dernières séances affichées ("Séance du lundi")
- ✅ État vide ("Aucune séance.")
- ✅ Objectif de l'utilisateur ("Maintien du poids")

---

## Comment lancer les tests

```bash
# Démarrer les containers si ce n'est pas déjà fait
docker-compose up -d

# Tests backend
docker exec -it fittrack-backend npm test
docker exec -it fittrack-backend npm run test:coverage

# Tests frontend
docker exec -it fittrack-frontend npm test
docker exec -it fittrack-frontend npm run test:coverage
```

> **Note** : Après modification de `package.json`, reconstruire les containers :
> ```bash
> docker-compose up -d --build backend frontend
> ```

---

## Total

| Périmètre | Suites | Tests | Framework |
|-----------|--------|-------|-----------|
| Backend routes + controllers | 4 | 42 | Jest + Supertest |
| Frontend composants + hooks | 7 | 40 | Vitest + RTL |
| **Total** | **11** | **82** | |
