# FitTrack — Guide de déploiement en production

Architecture cible :
- **Base de données** : Clever Cloud (add-on MySQL, plan DEV gratuit)
- **Backend** : Render (Docker Web Service)
- **Frontend** : Vercel (build statique Vite)

---

## Variables d'environnement à configurer

### Render (backend)

| Variable | Valeur / Source |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `DB_HOST` | Dashboard Clever Cloud → add-on MySQL → onglet **Dashboard** → champ **Host** |
| `DB_PORT` | Dashboard Clever Cloud → champ **Port** (généralement `3306` ou `20075` selon le plan) |
| `DB_NAME` | Dashboard Clever Cloud → champ **Database** |
| `DB_USER` | Dashboard Clever Cloud → champ **User** |
| `DB_PASSWORD` | Dashboard Clever Cloud → champ **Password** |
| `DB_SSL` | `true` (requis pour la connexion externe Clever Cloud) |
| `JWT_SECRET` | Chaîne aléatoire longue (min 64 caractères). **Linux/macOS :** `openssl rand -base64 64` — **Windows/cross-platform (Node.js) :** `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `JWT_EXPIRES_IN` | `7d` |
| `FRONTEND_URL` | URL Vercel du frontend, ex : `https://fittrack.vercel.app` (sans slash final) |

### Vercel (frontend)

| Variable | Valeur / Source |
|---|---|
| `VITE_API_URL` | URL Render du backend + `/api`, ex : `https://fittrack-backend.onrender.com/api` (sans slash final) |

---

## Étapes manuelles par dashboard

### 1. Clever Cloud — Base de données MySQL

1. Connecte-toi sur [console.clever-cloud.com](https://console.clever-cloud.com)
2. Clique **Create** → **an add-on** → choisis **MySQL**
3. Sélectionne le plan **DEV** (gratuit, 10 MB) — plan de démonstration/formation, pas destiné à un usage production réel
4. Choisis une région (Paris recommandé) → clique **Next** → **Create**
5. Une fois l'add-on créé, ouvre son **Dashboard**
6. Note les valeurs : **Host**, **Port**, **Database**, **User**, **Password** — tu en auras besoin pour Render
7. Dans l'onglet **Settings** de l'add-on, active **"Direct access"** (permet les connexions depuis Render via internet)
8. **Import du schéma** : connecte-toi à MySQL avec un client (DBeaver, TablePlus, ou phpMyAdmin local) en utilisant les credentials Clever Cloud, puis exécute le contenu du fichier `database/init.sql`
   - Avec la CLI MySQL : `mysql -h <HOST> -P <PORT> -u <USER> -p<PASSWORD> <DATABASE> < database/init.sql`
   - Alternative plus sûre (mot de passe non visible dans l'historique shell) : `mysql -h <HOST> -P <PORT> -u <USER> -p <DATABASE> < database/init.sql` (espace après `-p` sans coller le mot de passe — il sera demandé de façon masquée)

---

### 2. Render — Backend Docker Web Service

1. Connecte-toi sur [dashboard.render.com](https://dashboard.render.com)
2. Clique **New** → **Web Service**
3. Connecte ton dépôt GitHub (ou GitLab) et sélectionne le repo FitTrack
4. Configure le service :
   - **Name** : `fittrack-backend` (ou ce que tu veux)
   - **Region** : Frankfurt (le plus proche de Clever Cloud Paris)
   - **Branch** : `main` (ou `master`)
   - **Root Directory** : `backend`
   - **Environment** : **Docker**
   - **Dockerfile Path** : `./Dockerfile.prod`
   - **Plan** : **Free**
5. Dans la section **Environment Variables**, ajoute toutes les variables listées dans le tableau Render ci-dessus
6. Clique **Create Web Service**
7. Attend le premier build (5-10 minutes) — vérifie les logs pour confirmer `MySQL connected successfully`
8. Note l'URL du service (ex: `https://fittrack-backend.onrender.com`) — tu en auras besoin pour Vercel

> **Note plan gratuit Render** : le service s'endort après 15 minutes d'inactivité. La première requête après un idle prend ~30 secondes (cold start).

---

### 3. Vercel — Frontend React/Vite

1. Connecte-toi sur [vercel.com](https://vercel.com)
2. Clique **Add New** → **Project**
3. Importe le dépôt GitHub FitTrack
4. Configure le projet :
   - **Root Directory** : `frontend`
   - **Framework Preset** : **Vite** (détecté automatiquement)
   - **Build Command** : `npm run build` (valeur par défaut Vite)
   - **Output Directory** : `dist` (valeur par défaut Vite)
5. Dans la section **Environment Variables**, ajoute :
   - `VITE_API_URL` = `https://fittrack-backend.onrender.com/api`
6. Clique **Deploy**
7. Une fois déployé, note l'URL Vercel (ex: `https://fittrack.vercel.app`)
8. **Retourne sur Render** et mets à jour la variable `FRONTEND_URL` avec cette URL Vercel
9. Dans Render, clique **Manual Deploy** → **Deploy latest commit** pour redémarrer le backend avec le CORS à jour

---

## Ordre de déploiement recommandé

```
1. Clever Cloud  →  créer add-on + importer init.sql
2. Render        →  déployer backend avec les vars DB_* de Clever Cloud
3. Vercel        →  déployer frontend avec VITE_API_URL pointant vers Render
4. Render        →  mettre à jour FRONTEND_URL avec l'URL Vercel + redéployer
```

> **Étape 2** : au premier déploiement Render, l'URL Vercel n'existe pas encore — laisse `FRONTEND_URL` vide ou mets `http://localhost:3000` comme valeur temporaire. Le CORS ne sera pleinement fonctionnel qu'après l'étape 4 (mise à jour + redéploiement). C'est normal, pas une erreur de configuration.

---

## Vérifications post-déploiement

```bash
# 1. Tester que le backend répond
curl https://fittrack-backend.onrender.com/api
# Réponse attendue : { "message": "FitTrack API is running", ... }

# 2. Créer un compte de test (init.sql ne contient pas d'utilisateur, seulement les exercices)
curl -X POST https://fittrack-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@test.com","password":"Test1234!"}'
# Réponse attendue : { "token": "...", "user": { "id": 1, "username": "testuser", ... } }

# 3. Vérifier le login avec ce compte
curl -X POST https://fittrack-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test1234!"}'
# Réponse attendue : { "token": "...", "user": { ... } }
```

Si le backend répond et que le frontend charge sans erreur CORS dans la console DevTools, le déploiement est fonctionnel.
