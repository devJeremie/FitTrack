// ============================================================
// types/index.ts — Interfaces TypeScript partagées de FitTrack
//
// Ce fichier centralise tous les types métier de l'application.
// Chaque interface reflète exactement la structure retournée par l'API REST,
// ce qui garantit la cohérence entre le backend et le frontend.
// Importez ces types dans n'importe quel composant ou service avec :
//   import { User, Workout, ... } from '../types'
// ============================================================

// ---- User ----
// Correspond à la table `User` en base (sans le champ password, jamais exposé)
export interface User {
  id: number
  username: string
  email: string
  weight: number | null      // null si l'utilisateur n'a pas renseigné son poids
  goal: 'lose' | 'maintain' | 'gain'  // Objectif fitness (union littérale = valeurs fixes)
  created_at: string         // ISO 8601, ex : "2024-01-15T10:30:00.000Z"
}

// ---- Exercise ----
// Exercice de la bibliothèque partagée (accessible à tous les utilisateurs)
export interface Exercise {
  id: number
  name: string
  category: 'Musculation' | 'Cardio' | 'Flexibilité'  // ENUM côté MySQL
  muscle_group: string | null    // null si non renseigné (ex : exercice cardio global)
  description: string | null
  created_at: string
}

// ---- WorkoutExercise ----
// Représente un exercice tel qu'il a été réalisé dans une séance spécifique.
// C'est la table de jointure WorkoutExercise enrichie des infos de l'exercice source.
// Les champs sets/reps/weight_used/duration sont tous optionnels (null) selon le type :
//   - Musculation : sets + reps + weight_used
//   - Cardio      : duration (secondes)
export interface WorkoutExercise {
  id: number
  workout_id: number       // Clé étrangère vers Workout.id
  exercise_id: number      // Clé étrangère vers Exercise.id
  name: string             // Dénormalisé depuis Exercise pour affichage immédiat
  category: string         // Idem
  muscle_group: string | null
  sets: number | null
  reps: number | null
  weight_used: number | null  // Poids en kg
  duration: number | null     // Durée en secondes (cardio)
}

// ---- Workout ----
// Séance d'entraînement appartenant à un utilisateur.
// Les champs marqués ? sont optionnels : ils ne sont présents que dans certains
// endpoints (ex : exercises est inclus dans GET /workouts/:id mais pas dans GET /workouts)
export interface Workout {
  id: number
  user_id: number
  title: string
  date: string               // Format DATE MySQL : "YYYY-MM-DD"
  duration: number | null    // Durée totale en minutes
  notes: string | null
  created_at: string
  updated_at: string
  exercise_count?: number    // Nombre d'exercices, fourni par la liste (agrégat SQL)
  exercises?: WorkoutExercise[]  // Détail complet, fourni uniquement par GET /:id
}

// ---- ProgressionStats ----
// Réponse complète de GET /api/stats/progression.
// Regroupe le profil utilisateur et quatre jeux de statistiques calculées côté backend.
export interface ProgressionStats {
  user: {
    username: string
    weight: number | null
    goal: 'lose' | 'maintain' | 'gain'
    member_since: string     // Date d'inscription (created_at du User)
  }
  stats: {
    // Totaux globaux depuis la création du compte
    summary: {
      total_workouts: number
      total_minutes: number
      avg_duration: number     // Moyenne en minutes par séance
      unique_exercises: number // Nombre d'exercices distincts réalisés
    }
    // Activité par mois (12 derniers mois), utilisée pour le graphique du Dashboard
    monthly: Array<{
      month: string            // Format "YYYY-MM", ex : "2024-03"
      workout_count: number
      total_minutes: number
    }>
    // Répartition par catégorie d'exercice (Musculation / Cardio / Flexibilité)
    byCategory: Array<{
      category: string
      exercise_count: number
      total_reps: number       // Total des répétitions sur toutes les séances
    }>
    // Dernières séances (pour la section "Activité récente" du Dashboard)
    recent: Array<{
      id: number
      title: string
      date: string
      duration: number | null
    }>
  }
}
