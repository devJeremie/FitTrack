import { Link } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { Activity, Clock, Dumbbell, TrendingUp, ChevronRight } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useFetch } from '../hooks/useFetch'
import { ProgressionStats } from '../types'
import LoadingSpinner from '../components/LoadingSpinner'

const GOAL_LABELS: Record<string, string> = {
  lose: 'Perte de poids',
  maintain: 'Maintien du poids',
  gain: 'Prise de masse',
}

const MONTH_LABELS: Record<string, string> = {
  '01': 'Jan', '02': 'Fév', '03': 'Mar', '04': 'Avr',
  '05': 'Mai', '06': 'Juin', '07': 'Juil', '08': 'Août',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Déc',
}

function formatMonth(m: string) {
  const [year, month] = m.split('-')
  return `${MONTH_LABELS[month] ?? month} ${year.slice(2)}`
}

function formatDate(d: string) {
  const [y, mo, day] = d.slice(0, 10).split('-').map(Number)
  return new Date(y, mo - 1, day).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const tooltipStyle = {
  backgroundColor: '#1E293B',
  border: '1px solid #334155',
  borderRadius: '8px',
  color: '#F1F5F9',
}

export default function Dashboard() {
  const { user } = useAuth()
  const { data, loading } = useFetch<ProgressionStats>('/stats/progression')

  if (loading) return <LoadingSpinner />

  const stats = data?.stats
  const chartData = stats
    ? [...stats.monthly].reverse().map((m) => ({
        name: formatMonth(m.month),
        Séances: m.workout_count,
        Minutes: m.total_minutes,
      }))
    : []

  const totalCategory = stats?.byCategory.reduce((acc, c) => acc + c.exercise_count, 0) || 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">
          Bonjour, {user?.username} 👋
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Objectif : {GOAL_LABELS[user?.goal ?? 'maintain']}
          {user?.weight ? ` · ${user.weight} kg` : ''}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Activity size={18} className="text-indigo-400" />}
          label="Séances totales"
          value={stats?.summary.total_workouts ?? 0}
          iconBg="bg-indigo-500/10"
        />
        <StatCard
          icon={<Clock size={18} className="text-violet-400" />}
          label="Minutes d'entraînement"
          value={stats?.summary.total_minutes ?? 0}
          iconBg="bg-violet-500/10"
        />
        <StatCard
          icon={<TrendingUp size={18} className="text-emerald-400" />}
          label="Durée moyenne"
          value={`${Math.round(stats?.summary.avg_duration ?? 0)} min`}
          iconBg="bg-emerald-500/10"
        />
        <StatCard
          icon={<Dumbbell size={18} className="text-amber-400" />}
          label="Exercices différents"
          value={stats?.summary.unique_exercises ?? 0}
          iconBg="bg-amber-500/10"
        />
      </div>

      {/* Chart + Categories */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Monthly bar chart */}
        <div className="lg:col-span-2 bg-[#1E293B] border border-slate-700/50 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Séances par mois</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
                <Bar dataKey="Séances" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500 text-sm text-center py-16">
              Aucune donnée — commence ta première séance !
            </p>
          )}
        </div>

        {/* By category */}
        <div className="bg-[#1E293B] border border-slate-700/50 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Par catégorie</h2>
          {stats?.byCategory.length ? (
            <div className="space-y-4">
              {stats.byCategory.map((cat) => {
                const pct = Math.min(100, (cat.exercise_count / totalCategory) * 100)
                const colors: Record<string, string> = {
                  Musculation: '#6366F1',
                  Cardio: '#F59E0B',
                  Flexibilité: '#10B981',
                }
                const color = colors[cat.category] ?? '#94A3B8'
                return (
                  <div key={cat.category}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-400">{cat.category}</span>
                      <span className="text-slate-300 font-medium">{cat.exercise_count}</span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">Aucune donnée</p>
          )}
        </div>
      </div>

      {/* Recent workouts */}
      <div className="bg-[#1E293B] border border-slate-700/50 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-200">Dernières séances</h2>
          <Link to="/workouts" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
            Voir tout →
          </Link>
        </div>
        {stats?.recent.length ? (
          <div className="divide-y divide-slate-700/50">
            {stats.recent.map((w) => (
              <Link
                key={w.id}
                to={`/workouts/${w.id}`}
                className="flex items-center justify-between py-3 group"
              >
                <div>
                  <p className="text-sm font-medium text-slate-200 group-hover:text-indigo-300 transition-colors">
                    {w.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{formatDate(w.date)}</p>
                </div>
                <div className="flex items-center gap-3">
                  {w.duration && (
                    <span className="text-xs text-slate-500">{w.duration} min</span>
                  )}
                  <ChevronRight size={15} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm text-center py-8">
            Aucune séance.{' '}
            <Link to="/workouts" className="text-indigo-400 hover:underline">
              Commence maintenant →
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  iconBg,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  iconBg: string
}) {
  return (
    <div className="bg-[#1E293B] border border-slate-700/50 rounded-2xl p-5">
      <div className={`inline-flex p-2 rounded-lg ${iconBg} mb-3`}>{icon}</div>
      <p className="text-xl font-bold text-slate-100">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  )
}
