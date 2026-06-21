import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  Modal, ScrollView, ActivityIndicator, RefreshControl, Alert,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import Toast from 'react-native-toast-message'
import api from '../services/api'
import { Colors } from '../constants/colors'
import { Exercise } from '../types'

const CATEGORIES = ['Musculation', 'Cardio', 'Flexibilité'] as const
type Category = (typeof CATEGORIES)[number]

const CAT_COLOR: Record<Category, { text: string; bg: string }> = {
  Musculation: { text: Colors.primaryLight, bg: Colors.indigoBg },
  Cardio: { text: Colors.amber, bg: Colors.amberBg },
  Flexibilité: { text: Colors.emerald, bg: Colors.emeraldBg },
}

const EMPTY_FORM = {
  name: '',
  category: 'Musculation' as Category,
  muscle_group: '',
  description: '',
}

export default function ExercisesScreen() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState<Category | ''>('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Exercise | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadExercises = useCallback(async (s = search, c = catFilter) => {
    try {
      const params: Record<string, string> = {}
      if (c) params.category = c
      if (s) params.search = s
      const res = await api.get('/exercises', { params })
      setExercises(res.data.exercises)
    } catch {
      Toast.show({ type: 'error', text1: 'Impossible de charger les exercices' })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadExercises()
    }, [catFilter])
  )

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => loadExercises(), 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search])

  useEffect(() => {
    setLoading(true)
    loadExercises(search, catFilter)
  }, [catFilter])

  const openCreate = () => {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (ex: Exercise) => {
    setEditTarget(ex)
    setForm({
      name: ex.name,
      category: ex.category,
      muscle_group: ex.muscle_group ?? '',
      description: ex.description ?? '',
    })
    setModalOpen(true)
  }

  const confirmDelete = (ex: Exercise) => {
    Alert.alert(
      'Supprimer l\'exercice',
      `Supprimer "${ex.name}" ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => handleDelete(ex.id) },
      ]
    )
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/exercises/${id}`)
      setExercises((prev) => prev.filter((ex) => ex.id !== id))
      Toast.show({ type: 'success', text1: 'Exercice supprimé' })
    } catch (err: unknown) {
      const msg =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined
      Toast.show({ type: 'error', text1: msg || 'Impossible de supprimer' })
    }
  }

  const handleSubmit = async () => {
    if (!form.name) {
      Toast.show({ type: 'error', text1: 'Le nom est requis' })
      return
    }
    setSubmitting(true)
    try {
      if (editTarget) {
        const res = await api.put(`/exercises/${editTarget.id}`, form)
        setExercises((prev) => prev.map((ex) => ex.id === editTarget.id ? res.data.exercise : ex))
        Toast.show({ type: 'success', text1: 'Exercice modifié' })
      } else {
        const res = await api.post('/exercises', form)
        setExercises((prev) => [res.data.exercise, ...prev])
        Toast.show({ type: 'success', text1: 'Exercice créé' })
      }
      setModalOpen(false)
    } catch (err: unknown) {
      const msg =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined
      Toast.show({ type: 'error', text1: msg || 'Erreur' })
    } finally {
      setSubmitting(false)
    }
  }

  const renderItem = ({ item }: { item: Exercise }) => {
    const colors = CAT_COLOR[item.category] ?? { text: Colors.textSecondary, bg: Colors.surface }
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
          <View style={[styles.badge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.badgeText, { color: colors.text }]}>{item.category}</Text>
          </View>
        </View>
        {item.muscle_group ? (
          <Text style={styles.muscleGroup}>{item.muscle_group}</Text>
        ) : null}
        {item.description ? (
          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        ) : null}
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(item)} activeOpacity={0.7}>
            <Ionicons name="pencil-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.actionBtnText}>Modifier</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnRight]} onPress={() => confirmDelete(item)} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={14} color={Colors.red} />
            <Text style={[styles.actionBtnText, { color: Colors.red }]}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.root}>
      {/* Barre de recherche */}
      <View style={styles.topBar}>
        <View style={styles.searchWrapper}>
          <Ionicons name="search-outline" size={15} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtres catégorie */}
      <View style={styles.filtersWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {(['', ...CATEGORIES] as const).map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.filterBtn, catFilter === cat && styles.filterBtnActive]}
              onPress={() => setCatFilter(cat)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterBtnText, catFilter === cat && styles.filterBtnTextActive]}>
                {cat === '' ? 'Tous' : cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Liste */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadExercises() }}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucun exercice trouvé</Text>
              <TouchableOpacity onPress={openCreate}>
                <Text style={styles.emptyLink}>Créer un exercice →</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openCreate} activeOpacity={0.8}>
        <Ionicons name="add" size={24} color={Colors.white} />
      </TouchableOpacity>

      {/* Modal création/édition */}
      <Modal
        visible={modalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalOpen(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editTarget ? 'Modifier l\'exercice' : 'Nouvel exercice'}</Text>
            <TouchableOpacity onPress={() => setModalOpen(false)}>
              <Ionicons name="close" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            {/* Nom */}
            <Text style={styles.label}>Nom *</Text>
            <TextInput
              style={styles.input}
              placeholder="Développé couché"
              placeholderTextColor={Colors.textMuted}
              value={form.name}
              onChangeText={(v) => setForm({ ...form, name: v })}
            />

            {/* Catégorie */}
            <Text style={[styles.label, { marginTop: 16 }]}>Catégorie *</Text>
            <View style={styles.catBtns}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.catBtn, form.category === c && styles.catBtnActive]}
                  onPress={() => setForm({ ...form, category: c })}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.catBtnText, form.category === c && styles.catBtnTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Groupe musculaire */}
            <Text style={[styles.label, { marginTop: 16 }]}>Groupe musculaire</Text>
            <TextInput
              style={styles.input}
              placeholder="Pectoraux, Triceps..."
              placeholderTextColor={Colors.textMuted}
              value={form.muscle_group}
              onChangeText={(v) => setForm({ ...form, muscle_group: v })}
            />

            {/* Description */}
            <Text style={[styles.label, { marginTop: 16 }]}>Description</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Description de l'exercice..."
              placeholderTextColor={Colors.textMuted}
              value={form.description}
              onChangeText={(v) => setForm({ ...form, description: v })}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalOpen(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.8}
              >
                {submitting ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>{editTarget ? 'Enregistrer' : 'Créer'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.dark },
  topBar: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  searchWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  filtersWrapper: { paddingBottom: 8 },
  filters: { paddingHorizontal: 16, gap: 8 },
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  filterBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterBtnText: { fontSize: 12, color: Colors.textMuted, fontWeight: '500' },
  filterBtnTextActive: { color: Colors.white },
  list: { padding: 16, gap: 12, paddingBottom: 100 },
  card: {
    backgroundColor: Colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border, padding: 16,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  cardName: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.textPrimary, lineHeight: 20 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '500' },
  muscleGroup: { fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
  description: { fontSize: 11, color: Colors.border, lineHeight: 16 },
  cardActions: {
    flexDirection: 'row', marginTop: 12, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionBtnRight: { marginLeft: 'auto' },
  actionBtnText: { fontSize: 12, color: Colors.textMuted },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 14, color: Colors.textMuted },
  emptyLink: { fontSize: 14, color: Colors.primaryLight, marginTop: 8 },
  fab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  modal: { flex: 1, backgroundColor: Colors.dark },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  modalBody: { padding: 20 },
  label: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: 'rgba(15,23,42,0.6)',
    borderWidth: 1, borderColor: Colors.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: Colors.textPrimary,
  },
  inputMultiline: { height: 80, textAlignVertical: 'top' },
  catBtns: { flexDirection: 'row', gap: 8 },
  catBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
    backgroundColor: 'rgba(15,23,42,0.4)', alignItems: 'center',
  },
  catBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catBtnText: { fontSize: 11, color: Colors.textMuted, fontWeight: '500' },
  catBtnTextActive: { color: Colors.white },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 40 },
  cancelBtn: {
    flex: 1, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 10, paddingVertical: 13, alignItems: 'center',
  },
  cancelBtnText: { color: Colors.textSecondary, fontWeight: '500' },
  submitBtn: {
    flex: 1, backgroundColor: Colors.primary,
    borderRadius: 10, paddingVertical: 13, alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: Colors.white, fontWeight: '600' },
})
