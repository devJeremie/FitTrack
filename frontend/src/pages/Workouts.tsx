import { useEffect, useState, FormEvent, ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Calendar, Clock, Dumbbell, ChevronRight, Pencil, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import { Workout, Exercise } from '../types'

const inputCls =
  'w-full px-4 py-2.5 bg-slate-900/60 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors'

const labelCls = 'block text-xs font-medium text-slate-400 mb-1.5'

type WorkoutForm = {
  title: string
  date: string
  duration: string
  notes: string
  exercises: Array<{
    exercise_id: number
    sets: string
    reps: string
    weight_used: string
    duration: string
  }>
}

const today = new Date().toISOString().slice(0, 10)

const EMPTY_FORM: WorkoutForm = {
  title: '',
  date: today,
  duration: '',
  notes: '',
  exercises: [],
}

function formatDate(d: string) {
  const [y, mo, day] = d.slice(0, 10).split('-').map(Number)
  return new Date(y, mo - 1, day).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function Workouts() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Workout | null>(null)
  const [form, setForm] = useState<WorkoutForm>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  useEffect(() => {
    api
      .get('/workouts')
      .then((res: { data: { workouts: Workout[] } }) => setWorkouts(res.data.workouts))
      .catch(() => toast.error('Impossible de charger les séances'))
      .finally(() => setLoading(false))
    api
      .get('/exercises')
      .then((res: { data: { exercises: Exercise[] } }) => setExercises(res.data.exercises))
      .catch(() => { /* silent */ })
  }, [])

  const openCreate = () => {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (w: Workout) => {
    setEditTarget(w)
    setForm({
      title: w.title,
      date: w.date.slice(0, 10),
      duration: w.duration ? String(w.duration) : '',
      notes: w.notes ?? '',
      exercises: [],
    })
    setModalOpen(true)
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const addExRow = () => {
    if (!exercises.length) return
    setForm({
      ...form,
      exercises: [
        ...form.exercises,
        { exercise_id: exercises[0].id, sets: '', reps: '', weight_used: '', duration: '' },
      ],
    })
  }

  const updateExRow = (idx: number, field: string, value: string) => {
    const updated = [...form.exercises]
    updated[idx] = {
      ...updated[idx],
      [field]: field === 'exercise_id' ? Number(value) : value,
    }
    setForm({ ...form, exercises: updated })
  }

  const removeExRow = (idx: number) => {
    setForm({ ...form, exercises: form.exercises.filter((_ex: WorkoutForm['exercises'][number], i: number) => i !== idx) })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        title: form.title,
        date: form.date,
        duration: form.duration ? Number(form.duration) : undefined,
        notes: form.notes || undefined,
        exercises: form.exercises.map((ex) => ({
          exercise_id: ex.exercise_id,
          sets: ex.sets ? Number(ex.sets) : undefined,
          reps: ex.reps ? Number(ex.reps) : undefined,
          weight_used: ex.weight_used ? Number(ex.weight_used) : undefined,
          duration: ex.duration ? Number(ex.duration) : undefined,
        })),
      }

      if (editTarget) {
        const res = await api.put(`/workouts/${editTarget.id}`, payload)
        setWorkouts(workouts.map((w) => (w.id === editTarget.id ? { ...w, ...res.data.workout } : w)))
        toast.success('Séance modifiée')
      } else {
        const res = await api.post('/workouts', payload)
        setWorkouts([res.data.workout, ...workouts])
        toast.success('Séance créée')
      }
      setModalOpen(false)
    } catch (err: unknown) {
      const msg =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined
      toast.error(msg || 'Erreur')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/workouts/${id}`)
      setWorkouts(workouts.filter((w) => w.id !== id))
      toast.success('Séance supprimée')
    } catch {
      toast.error('Impossible de supprimer')
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">Séances</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus size={15} />
          Nouvelle séance
        </button>
      </div>

      {loading ? (
        <p className="text-slate-500 text-sm">Chargement...</p>
      ) : workouts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate-500 text-sm">Aucune séance pour le moment.</p>
          <button onClick={openCreate} className="mt-3 text-indigo-400 text-sm hover:underline">
            Créer ta première séance →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {workouts.map((w) => (
            <div
              key={w.id}
              className="bg-[#1E293B] border border-slate-700/50 rounded-2xl p-5 flex items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-200 text-sm truncate">{w.title}</p>
                <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Calendar size={11} />
                    {formatDate(w.date)}
                  </span>
                  {w.duration && (
                    <span className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock size={11} />
                      {w.duration} min
                    </span>
                  )}
                  {(w.exercise_count ?? 0) > 0 && (
                    <span className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Dumbbell size={11} />
                      {w.exercise_count} exercice{(w.exercise_count ?? 0) > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => openEdit(w)}
                  className="p-2 text-slate-600 hover:text-indigo-400 transition-colors"
                  title="Modifier"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => setDeleteId(w.id)}
                  className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 size={14} />
                </button>
                <Link
                  to={`/workouts/${w.id}`}
                  className="p-2 text-slate-600 hover:text-slate-300 transition-colors"
                  title="Voir le détail"
                >
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg my-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <h2 className="text-base font-semibold text-slate-100">
                {editTarget ? 'Modifier la séance' : 'Nouvelle séance'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 overflow-y-auto max-h-[72vh]">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={labelCls}>Titre *</label>
                  <input
                    name="title"
                    required
                    value={form.title}
                    onChange={handleChange}
                    className={inputCls}
                    placeholder="Séance force haut corps"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Date *</label>
                    <input
                      name="date"
                      type="date"
                      required
                      value={form.date}
                      onChange={handleChange}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Durée (min)</label>
                    <input
                      name="duration"
                      type="number"
                      min="1"
                      value={form.duration}
                      onChange={handleChange}
                      className={inputCls}
                      placeholder="60"
                    />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Notes</label>
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    rows={2}
                    className={`${inputCls} resize-none`}
                    placeholder="Super séance !"
                  />
                </div>

                {/* Exercises (create only) */}
                {!editTarget && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className={labelCls}>Exercices</label>
                      {exercises.length > 0 && (
                        <button
                          type="button"
                          onClick={addExRow}
                          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                        >
                          <Plus size={11} /> Ajouter
                        </button>
                      )}
                    </div>
                    <div className="space-y-3">
                      {form.exercises.map((row, idx) => {
                        const selEx = exercises.find((e) => e.id === row.exercise_id)
                        const isCardio = selEx?.category === 'Cardio'
                        return (
                          <div key={idx} className="bg-slate-900/40 border border-slate-700 rounded-lg p-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <select
                                value={row.exercise_id}
                                onChange={(e) => updateExRow(idx, 'exercise_id', e.target.value)}
                                className="flex-1 px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              >
                                {exercises.map((ex) => (
                                  <option key={ex.id} value={ex.id}>
                                    {ex.name} ({ex.category})
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => removeExRow(idx)}
                                className="text-slate-600 hover:text-red-400 transition-colors"
                              >
                                <X size={14} />
                              </button>
                            </div>
                            {isCardio ? (
                              <div>
                                <label className="text-xs text-slate-500">Durée (secondes)</label>
                                <input
                                  type="number"
                                  value={row.duration}
                                  onChange={(e) => updateExRow(idx, 'duration', e.target.value)}
                                  placeholder="1800"
                                  className="mt-1 w-full px-3 py-1.5 bg-slate-900/60 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              </div>
                            ) : (
                              <div className="grid grid-cols-3 gap-2">
                                {[
                                  { field: 'sets', label: 'Séries', placeholder: '4' },
                                  { field: 'reps', label: 'Reps', placeholder: '8' },
                                  { field: 'weight_used', label: 'Poids (kg)', placeholder: '80' },
                                ].map(({ field, label, placeholder }) => (
                                  <div key={field}>
                                    <label className="text-xs text-slate-500">{label}</label>
                                    <input
                                      type="number"
                                      value={(row as unknown as Record<string, string>)[field]}
                                      onChange={(e) => updateExRow(idx, field, e.target.value)}
                                      placeholder={placeholder}
                                      className="mt-1 w-full px-3 py-1.5 bg-slate-900/60 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 border border-slate-600 text-slate-300 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-700/40 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    {submitting ? 'Enregistrement...' : editTarget ? 'Enregistrer' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-base font-semibold text-slate-100 mb-2">Supprimer la séance</h2>
            <p className="text-sm text-slate-400 mb-6">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 border border-slate-600 text-slate-300 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-700/40 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
