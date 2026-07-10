# Session 5 — Compte rendu

## Objectif

Déploiement de FitTrack en production sur une architecture 3 services : base de données MySQL managée (Clever Cloud), backend Docker (Render), frontend statique (Vercel). Rédaction du guide `DEPLOYMENT.md`, ajout des fichiers de configuration nécessaires, et correction des problèmes rencontrés lors du premier déploiement.

---

## Architecture de production

```
Clever Cloud (MySQL, add-on DEV gratuit)
        ↑ connexion SSL "Direct access"
Render (Docker Web Service — backend Node.js/Express)
        ↑ requêtes HTTPS /api/*
Vercel (build statique Vite — frontend React)
```

Contrairement à l'environnement de dev (`docker-compose`, 5 containers sur le même réseau Docker), chaque service tourne sur son propre hébergeur et communique via internet.

---

## Fichiers ajoutés / modifiés

| Fichier | Rôle |
|---|---|
| `DEPLOYMENT.md` | Guide pas-à-pas : variables d'env par service, étapes dashboard Clever Cloud/Render/Vercel, ordre de déploiement, commandes `curl` de vérification post-déploiement |
| `render.yaml` | Blueprint Render : service Docker, `rootDir: backend`, `dockerfilePath: ./Dockerfile.prod`, déclaration des variables d'env (`sync: false` pour les secrets à saisir manuellement) |
| `backend/Dockerfile.prod` | Image de prod légère : `npm install --omit=dev`, pas de volume monté (contrairement au `Dockerfile` de dev) |
| `backend/config/database.js` | `DB_HOST` par défaut passe de `mysql` (nom du service Docker) à `localhost` ; ajout conditionnel de `ssl: { rejectUnauthorized: false }` quand `DB_SSL=true` (requis par Clever Cloud en connexion externe) |
| `frontend/vercel.json` | Rewrite SPA : toutes les routes non-fichier renvoient vers `index.html` (nécessaire pour que React Router fonctionne sur les URLs directes) |
| `frontend/src/services/api.ts` | `baseURL` utilise `VITE_API_URL` si défini (prod), sinon `/api` (dev, proxié par Vite) |
| `frontend/src/vite-env.d.ts` | Ajout de `/// <reference types="vite/client" />`, manquant → `import.meta.env` non typé par TypeScript |
| `database/init.sql` | Commentaire ajouté sur `USE fittrack;` (non nécessaire lors de l'import via Clever Cloud, la base cible étant déjà sélectionnée par la connexion) |
| `.gitignore` | Ajout de `database/init-clevercloud.sql` (export ponctuel utilisé pour l'import manuel, propre à une machine, pas versionné) |

---

## Variables d'environnement de production

### Render (backend)
`NODE_ENV`, `PORT`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL=true`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `FRONTEND_URL`

### Vercel (frontend)
`VITE_API_URL` — URL Render du backend + `/api`, ex : `https://fittrack-backend.onrender.com/api`

---

## Ordre de déploiement

```
1. Clever Cloud  →  créer add-on MySQL + importer database/init.sql
2. Render        →  déployer backend avec les vars DB_* de Clever Cloud
3. Vercel        →  déployer frontend avec VITE_API_URL pointant vers Render
4. Render        →  mettre à jour FRONTEND_URL avec l'URL Vercel + redéployer (CORS)
```

Le détail complet (dashboards, captures des champs à remplir, commandes de vérification `curl`) est dans `DEPLOYMENT.md`.

---

## Problèmes rencontrés et corrections

### 405 Method Not Allowed sur `/api/auth/register`
- **Symptôme** : en prod, le POST d'inscription échouait avec `405 Method Not Allowed`, requête visible dans les DevTools vers `https://<app>.vercel.app/api/auth/register` (le domaine Vercel lui-même, pas Render).
- **Cause racine** : `VITE_API_URL` n'était pas encore défini/pris en compte au moment du build Vercel. `baseURL: import.meta.env.VITE_API_URL || '/api'` retombait donc sur `/api`, résolu par rapport à l'origine courante. Vercel ne servant que le frontend statique, et `vercel.json` réécrivant toutes les routes vers `index.html` (fichier statique, GET/HEAD uniquement), le POST recevait un 405.
- **Fix** : ajout de `VITE_API_URL` dans les variables d'environnement Vercel + redéploiement (Vite injecte les variables au build, un simple restart ne suffit pas).

### Type `import.meta.env` non reconnu par TypeScript
- **Symptôme** : erreur TS sur `import.meta.env.VITE_API_URL` dans `api.ts`.
- **Cause** : `frontend/src/vite-env.d.ts` absent du repo.
- **Fix** : ajout du fichier avec `/// <reference types="vite/client" />`.

### Connexion SSL Clever Cloud
- **Symptôme** : le pool MySQL2 refusait la connexion externe à Clever Cloud.
- **Cause** : Clever Cloud exige TLS sur les connexions "Direct access" depuis l'extérieur de son réseau, non requis en dev (connexion interne au réseau Docker).
- **Fix** : ajout conditionnel de `ssl: { rejectUnauthorized: false }` dans `database.js`, activé via la variable `DB_SSL=true` (absente en dev, donc pas d'impact sur `docker-compose`).

---

## Vérifications post-déploiement

```bash
# Backend accessible
curl https://fittrack-backend.onrender.com/api

# Inscription
curl -X POST https://fittrack-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@test.com","password":"Test1234!"}'

# Connexion
curl -X POST https://fittrack-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test1234!"}'
```

Déploiement fonctionnel confirmé : backend qui répond, inscription/connexion opérationnelles, pas d'erreur CORS dans la console.

---

## Points d'attention pour la suite

- **Plan gratuit Render** : le service s'endort après 15 min d'inactivité (cold start ~30s sur la requête suivante).
- **Redéploiement Vercel requis** après tout changement de variable d'environnement (`VITE_API_URL` notamment), car Vite les injecte au build et non au runtime.
- **`database/init-clevercloud.sql`** est un export local ponctuel, volontairement ignoré par git — ne pas s'appuyer dessus, utiliser `database/init.sql` comme source de vérité du schéma.

---

## Stack complète du projet

| Couche | Technologies / Hébergement |
|--------|-------------|
| Base de données | MySQL 8.0 — Docker local (dev) / Clever Cloud (prod) |
| Backend | Node.js 20, Express, mysql2/promise, bcrypt, jsonwebtoken — Docker local (dev) / Render (prod) |
| Frontend web | React 18, TypeScript 5, Vite 5, Tailwind CSS 3, React Router v6, Recharts — Docker local (dev) / Vercel (prod, build statique) |
| App mobile | React Native 0.76, Expo 52, TypeScript 5, React Navigation v6, Axios |
| Infrastructure dev | Docker Compose (5 containers), Nginx reverse proxy |
| Infrastructure prod | Clever Cloud + Render + Vercel, 3 services indépendants communiquant via HTTPS |
