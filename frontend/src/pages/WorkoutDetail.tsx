import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Calendar, Clock, FileText, Dumbbell } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import { Workout } from '../types'
import LoadingSpinner from '../components/LoadingSpinner'

const CAT_COLORS: Record<string, string> = {
  Musculation: 'bg-indigo-500/15 text-indigo-300',
  Cardio: 'bg-amber-500/15 text-amber-300',
  Flexibilité: 'bg-emerald-500/15 text-emerald-300',
}

function formatDate(d: string) {
  const [y, mo, day] = d.slice(0, 10).split('-').map(Number)
  return new Date(y, mo - 1, day).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatDuration(secs: number) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return m > 0 ? `${m} min${s > 0 ? ` ${s}s` : ''}` : `${s}s`
}

export default function WorkoutDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    api
      .get(`/workouts/${id}`)
      .then((res) => setWorkout(res.data.workout))
      .catch(() => {
        toast.error('Séance introuvable')
        navigate('/workouts')
      })
      .finally(() => setLoading(false))
  }, [id, navigate])

  if (loading) return <LoadingSpinner />
  if (!workout) return null

  return (
    <div className="space-y-5 max-w-2xl">
      <Link
        to="/workouts"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors"
      >
        <ArrowLeft size={15} />
        Retour aux séances
      </Link>

      {/* Header card */}
      <div className="bg-[#1E293B] border border-slate-700/50 rounded-2xl p-6 space-y-4">
        <h1 className="text-xl font-bold text-slate-100">{workout.title}</h1>
        <div className="flex flex-wrap gap-4">
          <span className="flex items-center gap-2 text-sm text-slate-400">
            <Calendar size={14} className="text-slate-500" />
            {formatDate(workout.date)}
          </span>
          {workout.duration && (
            <span className="flex items-center gap-2 text-sm text-slate-400">
              <Clock size={14} className="text-slate-500" />
              {workout.duration} minutes
            </span>
          )}
        </div>
        {workout.notes && (
          <div className="flex items-start gap-2 pt-3 border-t border-slate-700/50">
            <FileText size={14} className="text-slate-500 mt-0.5 shrink-0" />
            <p className="text-sm text-slate-400">{workout.notes}</p>
          </div>
        )}
      </div>

      {/* Exercises */}
      <div className="bg-[#1E293B] border border-slate-700/50 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Dumbbell size={16} className="text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-200">Exercices</h2>
          </div>
          {workout.exercises && (
            <span className="text-xs text-slate-500">
              {workout.exercises.length} exercice{workout.exercises.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {workout.exercises && workout.exercises.length > 0 ? (
          <div className="divide-y divide-slate-700/50">
            {workout.exercises.map((ex) => (
              <div key={ex.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-sm text-slate-200">{ex.name}</span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      CAT_COLORS[ex.category] ?? 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {ex.category}
                  </span>
                </div>
                {ex.muscle_group && (
                  <p className="text-xs text-slate-500 mb-2">{ex.muscle_group}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {ex.sets && (
                    <span className="text-xs bg-slate-800 border border-slate-700 text-slate-400 px-2.5 py-1 rounded-md">
                      {ex.sets} séries
                    </span>
                  )}
                  {ex.reps && (
                    <span className="text-xs bg-slate-800 border border-slate-700 text-slate-400 px-2.5 py-1 rounded-md">
                      {ex.reps} reps
                    </span>
                  )}
                  {ex.weight_used && (
                    <span className="text-xs bg-slate-800 border border-slate-700 text-slate-400 px-2.5 py-1 rounded-md">
                      {ex.weight_used} kg
                    </span>
                  )}
                  {ex.duration && (
                    <span className="text-xs bg-slate-800 border border-slate-700 text-slate-400 px-2.5 py-1 rounded-md">
                      {formatDuration(ex.duration)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center py-8">Aucun exercice dans cette séance</p>
        )}
      </div>
    </div>
  )
}
