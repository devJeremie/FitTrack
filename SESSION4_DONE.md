# Session 4 — Compte rendu

## Objectif

Création de l'application mobile **FitTrack** en React Native avec Expo, couvrant l'intégralité des fonctionnalités de la version web : authentification, dashboard, exercices, séances et profil. Ajout de commentaires pédagogiques détaillés sur tous les fichiers pour faciliter l'apprentissage React Native. Correction des problèmes de configuration TypeScript et de dépendances.

---

## Architecture mobile créée

### Structure du dossier `mobile/`

```
mobile/
├── App.tsx                     # Point d'entrée : NavigationContainer + Stack + BottomTabs + AuthProvider + Toast
├── app.json                    # Configuration Expo (nom, slug, icône, splash)
├── babel.config.js             # babel-preset-expo
├── tsconfig.json               # extends expo/tsconfig.base + strict + baseUrl + paths @/*
├── package.json                # Dépendances Expo 52 + React Native 0.76
└── src/
    ├── config.ts               # API_URL — IP locale à configurer (http://192.168.x.x:5000/api)
    ├── types/
    │   └── index.ts            # User, Exercise, Workout, WorkoutExercise, ProgressionStats, RootStackParamList, TabParamList
    ├── constants/
    │   └── colors.ts           # Design tokens calqués sur le frontend web (dark/surface/primary indigo/amber/emerald)
    ├── services/
    │   └── api.ts              # Instance Axios + intercepteur JWT Bearer + suppression token 401
    ├── context/
    │   └── AuthContext.tsx     # AuthProvider : login / register / logout + AsyncStorage + vérification token au démarrage
    ├── components/
    │   └── LoadingSpinner.tsx  # ActivityIndicator centré plein écran
    └── screens/
        ├── LoginScreen.tsx         # Formulaire email + mot de passe + KeyboardAvoidingView
        ├── RegisterScreen.tsx      # Formulaire complet + objectif (boutons radio custom) + poids optionnel
        ├── DashboardScreen.tsx     # 4 stat cards + BarChart (react-native-chart-kit) + répartition catégories + dernières séances
        ├── ExercisesScreen.tsx     # FlatList + recherche debounce 350ms + filtres catégorie + Modal CRUD
        ├── WorkoutsScreen.tsx      # FlatList + Modal création/édition + navigation vers WorkoutDetail
        ├── WorkoutDetailScreen.tsx # Exercices de la séance + Modal ajout/édition + picker exercice imbriqué
        └── ProfileScreen.tsx       # Avatar initiales + stats globales + activité mensuelle + déconnexion
```

---

## Navigation

```
App
└── AuthProvider
    └── RootNavigator
        ├── [non connecté]
        │   ├── LoginScreen
        │   └── RegisterScreen
        └── [connecté]
            ├── AppTabs (BottomTabNavigator)
            │   ├── DashboardScreen
            │   ├── ExercisesScreen
            │   ├── WorkoutsScreen
            │   └── ProfileScreen
            └── WorkoutDetailScreen (Stack, hors onglets — avec header natif)
```

La redirection login ↔ onglets est **automatique** : le `RootNavigator` surveille `user` dans `AuthContext`. Pas de `navigate()` manuel après login/logout.

---

## Écrans — détail des fonctionnalités

### LoginScreen
- Champs email + mot de passe avec validation avant appel API
- `KeyboardAvoidingView` : `'padding'` sur iOS, `'height'` sur Android
- Spinner dans le bouton pendant l'appel API
- Toast d'erreur avec message renvoyé par l'API

### RegisterScreen
- Champs : username, email, mot de passe, objectif (boutons radio custom), poids (optionnel)
- 3 boutons objectif côte à côte (`flex: 1` sur chacun)
- `parseFloat` pour convertir le poids string → number

### DashboardScreen
- `useFocusEffect` : recharge à chaque retour sur l'écran (≠ `useEffect` qui ne se lance qu'au montage)
- 4 `StatCard` (composant local) : séances, minutes, durée moy., exercices uniques
- `BarChart` : 6 derniers mois, `[...monthly].reverse().slice(-6)` pour ordre chronologique
- Barres de progression par catégorie avec pourcentage calculé
- 5 dernières séances cliquables → `WorkoutDetailScreen`

### ExercisesScreen
- `FlatList` (virtualisation) à la place de `ScrollView + map`
- Recherche avec debounce 350ms via `useRef` (pas de state → pas de re-render inutile)
- Filtres catégorie : `ScrollView horizontal` avec `useFocusEffect` + `useEffect` séparés
- Modal `pageSheet` : création ET édition du même formulaire (`editTarget` null = création)
- Mise à jour locale optimiste : `filter()` / `map()` sans rechargement API
- FAB (`position: 'absolute'`) avec ombre portée iOS + `elevation` Android

### WorkoutsScreen
- `FlatList` + `RefreshControl` (pull to refresh)
- Après création → navigation immédiate vers `WorkoutDetail` pour ajouter des exercices
- Préservation de `exercise_count` lors de l'édition (l'API PUT ne le renvoie pas)
- `hitSlop={8}` sur les petits boutons icônes pour agrandir la zone de clic

### WorkoutDetailScreen
- `Promise.all` : charge la séance et la liste des exercices en parallèle
- Formulaire adaptatif : Cardio → durée (secondes) / Musculation+Flexibilité → séries+reps+poids
- Modal imbriqué (React Native le supporte) : formulaire exercice + picker exercice en cascade
- `PATCH` pour modifier les stats d'un exercice existant

### ProfileScreen
- Avatar avec initiales : `username.slice(0, 2).toUpperCase()`
- `[...monthly].reverse().slice(0, 4)` : 4 mois les plus récents
- Pluriel JS : `séance${count !== 1 ? 's' : ''}`
- Confirmation `Alert.alert` avant déconnexion

---

## Dépendances

```json
{
  "dependencies": {
    "expo": "~52.0.0",
    "expo-status-bar": "~2.0.0",
    "@expo/vector-icons": "^14.0.4",
    "@react-native-async-storage/async-storage": "1.23.1",
    "@react-navigation/bottom-tabs": "^6.6.1",
    "@react-navigation/native": "^6.1.18",
    "@react-navigation/native-stack": "^6.10.1",
    "axios": "^1.7.9",
    "react": "18.3.1",
    "react-native": "0.76.3",
    "react-native-chart-kit": "^6.12.0",
    "react-native-safe-area-context": "4.12.0",
    "react-native-screens": "~4.4.0",
    "react-native-svg": "15.8.0",
    "react-native-toast-message": "^2.2.1"
  },
  "devDependencies": {
    "@babel/core": "^7.24.0",
    "@types/node": "^20.0.0",
    "@types/react": "~18.3.12",
    "typescript": "^5.3.0"
  }
}
```

---

## Commentaires pédagogiques

Tous les fichiers sources ont été documentés avec des commentaires détaillés pour débutants React Native, expliquant :

| Concept | Fichier(s) concerné(s) |
|---|---|
| `ActivityIndicator`, `StyleSheet.create`, `flex: 1` | `LoadingSpinner.tsx` |
| Instance Axios, intercepteurs requête/réponse, `AsyncStorage` | `api.ts` |
| `createContext`, `Provider`, `useContext`, `useEffect []` | `AuthContext.tsx` |
| `KeyboardAvoidingView`, `Platform`, formulaire contrôlé, `secureTextEntry` | `LoginScreen.tsx` |
| Boutons radio custom, `parseFloat`, `as const`, champs optionnels | `RegisterScreen.tsx` |
| `useFocusEffect` vs `useEffect`, `BarChart`, composant local | `DashboardScreen.tsx` |
| `FlatList`, `Modal`, `useRef` debounce, `useCallback`, CRUD local | `ExercisesScreen.tsx` |
| `FlatList` CRUD, `hitSlop`, préservation d'état local après PUT | `WorkoutsScreen.tsx` |
| `Promise.all`, formulaire adaptatif, modal imbriqué, `PATCH` | `WorkoutDetailScreen.tsx` |
| `reverse().slice()`, pluriel JS, composant local `StatTile` | `ProfileScreen.tsx` |

---

## Corrections techniques

### tsconfig.json
- **Problème** : commentaires `//` invalides en JSON + `paths` sans `baseUrl` → alias `@/*` non résolus
- **Fix** : suppression des commentaires + ajout de `"baseUrl": "."`

### node_modules corrompu + @types/node manquant
- **Symptôme** : erreur VSCode *"Cannot find type definition file for 'node'"* sur la 1ère accolade de `tsconfig.json` + `npm install` crashait avec `TypeError: Invalid Version:`
- **Cause** : `node_modules` installé partiellement — des dizaines de paquets sans `package.json` (dont `@types/node` avec seulement 3 fichiers). `semver` lisait une version vide et plantait lors de la déduplication.
- **Fix** :
  1. Ajout de `"@types/node": "^20.0.0"` dans `devDependencies`
  2. Suppression de `node_modules` via `robocopy` (chemins Windows > 260 chars — `Remove-Item` PowerShell échouait)
  3. `npm install` → 1000+ packages réinstallés proprement

---

## Commandes pour lancer l'app mobile

```bash
# Depuis le dossier mobile/
cd mobile

# Démarrer le serveur Expo
npx expo start

# Scanner le QR code avec l'app Expo Go (iOS/Android)
# OU appuyer sur 'a' pour Android emulator, 'i' pour iOS simulator
```

**Prérequis** : configurer l'IP locale dans `src/config.ts`
```ts
export const API_URL = 'http://192.168.x.x:5000/api'
// Remplacer x.x par l'IP WiFi de ta machine (ipconfig sur Windows)
```

Le backend Docker doit tourner : `docker-compose up -d`

---

## Stack complète du projet

| Couche | Technologies |
|--------|-------------|
| Base de données | MySQL 8.0, 4 tables, FK avec CASCADE/RESTRICT |
| Backend | Node.js 20, Express, mysql2/promise, bcrypt, jsonwebtoken |
| Frontend web | React 18, TypeScript 5, Vite 5, Tailwind CSS 3, React Router v6, Recharts |
| App mobile | React Native 0.76, Expo 52, TypeScript 5, React Navigation v6, Axios, react-native-chart-kit |
| HTTP | Axios + intercepteurs JWT (web et mobile) |
| Infrastructure | Docker Compose (5 containers), Nginx reverse proxy |
