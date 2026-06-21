import React, { useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, RefreshControl,
} from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { BarChart } from 'react-native-chart-kit'
import { Ionicons } from '@expo/vector-icons'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { Colors } from '../constants/colors'
import { ProgressionStats, RootStackParamList } from '../types'

const screenWidth = Dimensions.get('window').width

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
  const [, month] = m.split('-')
  return MONTH_LABELS[month] ?? month
}

function formatDate(d: string) {
  const [y, mo, day] = d.slice(0, 10).split('-').map(Number)
  return new Date(y, mo - 1, day).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short',
  })
}

const CAT_COLORS: Record<string, string> = {
  Musculation: Colors.indigo,
  Cardio: Colors.amber,
  Flexibilité: Colors.emerald,
}

export default function DashboardScreen() {
  const { user } = useAuth()
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const [data, setData] = useState<ProgressionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchStats = async () => {
    try {
      const res = await api.get('/stats/progression')
      setData(res.data)
    } catch {
      // silencieux — l'UI gère l'état vide
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchStats()
    }, [])
  )

  const onRefresh = () => {
    setRefreshing(true)
    fetchStats()
  }

  if (loading) return <LoadingSpinner />

  const stats = data?.stats
  const chartMonthly = stats
    ? [...stats.monthly].reverse().slice(-6)
    : []

  const chartData = {
    labels: chartMonthly.map((m) => formatMonth(m.month)),
    datasets: [{ data: chartMonthly.map((m) => m.workout_count) }],
  }

  const totalCategory = stats?.byCategory.reduce((acc, c) => acc + c.exercise_count, 0) || 1

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour, {user?.username} 👋</Text>
          <Text style={styles.sub}>
            {GOAL_LABELS[user?.goal ?? 'maintain']}
            {user?.weight ? ` · ${user.weight} kg` : ''}
          </Text>
        </View>
      </View>

      {/* 4 stat cards */}
      <View style={styles.statsGrid}>
        <StatCard
          icon="analytics-outline"
          iconColor={Colors.primaryLight}
          iconBg={Colors.indigoBg}
          label="Séances"
          value={String(stats?.summary.total_workouts ?? 0)}
        />
        <StatCard
          icon="time-outline"
          iconColor={Colors.violet}
          iconBg="rgba(139,92,246,0.15)"
          label="Minutes"
          value={String(stats?.summary.total_minutes ?? 0)}
        />
        <StatCard
          icon="trending-up-outline"
          iconColor={Colors.emerald}
          iconBg={Colors.emeraldBg}
          label="Durée moy."
          value={`${Math.round(stats?.summary.avg_duration ?? 0)} min`}
        />
        <StatCard
          icon="barbell-outline"
          iconColor={Colors.amber}
          iconBg={Colors.amberBg}
          label="Exercices"
          value={String(stats?.summary.unique_exercises ?? 0)}
        />
      </View>

      {/* Graphique mensuel */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Séances par mois</Text>
        {chartMonthly.length > 0 ? (
          <BarChart
            data={chartData}
            width={screenWidth - 64}
            height={180}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: Colors.surface,
              backgroundGradientFrom: Colors.surface,
              backgroundGradientTo: Colors.surface,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
              labelColor: () => Colors.textSecondary,
              barPercentage: 0.7,
              propsForBackgroundLines: { stroke: Colors.border, strokeDasharray: '' },
            }}
            style={styles.chart}
            showValuesOnTopOfBars
            withHorizontalLabels
          />
        ) : (
          <Text style={styles.emptyText}>Aucune donnée — commence ta première séance !</Text>
        )}
      </View>

      {/* Répartition par catégorie */}
      {stats?.byCategory && stats.byCategory.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Par catégorie</Text>
          {stats.byCategory.map((cat) => {
            const pct = Math.min(100, (cat.exercise_count / totalCategory) * 100)
            const color = CAT_COLORS[cat.category] ?? Colors.textSecondary
            return (
              <View key={cat.category} style={styles.catRow}>
                <View style={styles.catHeader}>
                  <Text style={styles.catName}>{cat.category}</Text>
                  <Text style={styles.catCount}>{cat.exercise_count}</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressBar, { width: `${pct}%` as any, backgroundColor: color }]} />
                </View>
              </View>
            )
          })}
        </View>
      )}

      {/* Dernières séances */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Dernières séances</Text>
        {stats?.recent && stats.recent.length > 0 ? (
          stats.recent.map((w) => (
            <TouchableOpacity
              key={w.id}
              style={styles.workoutRow}
              onPress={() => navigation.navigate('WorkoutDetail', { workoutId: w.id, title: w.title })}
              activeOpacity={0.7}
            >
              <View style={styles.workoutInfo}>
                <Text style={styles.workoutTitle}>{w.title}</Text>
                <Text style={styles.workoutDate}>{formatDate(w.date)}</Text>
              </View>
              <View style={styles.workoutRight}>
                {w.duration ? <Text style={styles.workoutDuration}>{w.duration} min</Text> : null}
                <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>Aucune séance pour l'instant.</Text>
        )}
      </View>
    </ScrollView>
  )
}

function StatCard({
  icon, iconColor, iconBg, label, value,
}: {
  icon: keyof typeof Ionicons.glyphMap
  iconColor: string
  iconBg: string
  label: string
  value: string
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.dark },
  content: { padding: 16, paddingBottom: 32 },
  header: { marginBottom: 20, marginTop: 4 },
  greeting: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  sub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },

  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16,
  },
  statCard: {
    flex: 1, minWidth: '45%',
    backgroundColor: Colors.surface,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.border,
    padding: 16,
  },
  statIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  statValue: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.border,
    padding: 16, marginBottom: 16,
  },
  cardTitle: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, marginBottom: 12 },
  chart: { borderRadius: 12, marginLeft: -8 },

  catRow: { marginBottom: 12 },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  catName: { fontSize: 12, color: Colors.textSecondary },
  catCount: { fontSize: 12, fontWeight: '500', color: Colors.textPrimary },
  progressTrack: { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 3 },

  workoutRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  workoutInfo: { flex: 1 },
  workoutTitle: { fontSize: 13, fontWeight: '500', color: Colors.textPrimary },
  workoutDate: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  workoutRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  workoutDuration: { fontSize: 11, color: Colors.textMuted },

  emptyText: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingVertical: 16 },
})
