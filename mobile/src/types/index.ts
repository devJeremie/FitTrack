// Types partagés entre les écrans — miroir du frontend web (frontend/src/types/index.ts)

export interface User {
  id: number
  username: string
  email: string
  weight?: number
  goal: 'lose' | 'maintain' | 'gain'
  created_at: string
}

export interface Exercise {
  id: number
  name: string
  category: 'Musculation' | 'Cardio' | 'Flexibilité'
  muscle_group?: string
  description?: string
  created_at: string
}

export interface WorkoutExercise {
  id: number
  workout_id: number
  exercise_id: number
  exercise_name?: string
  category?: string
  muscle_group?: string
  sets?: number
  reps?: number
  weight_used?: number
  duration?: number
}

export interface Workout {
  id: number
  user_id: number
  title: string
  date: string
  duration?: number
  notes?: string
  exercise_count?: number
  exercises?: WorkoutExercise[]
  created_at: string
}

export interface ProgressionStats {
  stats: {
    summary: {
      total_workouts: number
      total_minutes: number
      avg_duration: number
      unique_exercises: number
    }
    monthly: Array<{
      month: string
      workout_count: number
      total_minutes: number
    }>
    byCategory: Array<{
      category: string
      exercise_count: number
    }>
    recent: Array<{
      id: number
      title: string
      date: string
      duration?: number
    }>
  }
}

// Types navigation React Navigation
export type RootStackParamList = {
  Login: undefined
  Register: undefined
  AppTabs: undefined
  WorkoutDetail: { workoutId: number; title?: string }
}

export type TabParamList = {
  Dashboard: undefined
  Exercises: undefined
  Workouts: undefined
  Profile: undefined
}
