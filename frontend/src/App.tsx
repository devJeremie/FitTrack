// ============================================================
// App.tsx — Racine de l'application React FitTrack
//
// Ce composant est le point d'entrée du rendu React (monté dans main.tsx).
// Il pose les trois fondations de l'app :
//   1. AuthProvider  : fournit l'utilisateur connecté à toute l'arborescence
//   2. BrowserRouter : active le routage côté client (React Router v6)
//   3. Routes        : déclare toutes les pages et leurs chemins URL
// ============================================================

// ---- React Router v6 ----
// BrowserRouter : utilise l'API History du navigateur (URLs propres sans #)
// Routes / Route : déclare les correspondances URL → composant
// Navigate : redirection déclarative dans le JSX
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Toaster : composant global pour afficher les notifications toast
// Il doit être rendu une seule fois, en dehors de toute page spécifique
import { Toaster } from 'react-hot-toast'

// ---- Contexte & composants d'infrastructure ----
import { AuthProvider } from './context/AuthContext'
// PrivateRoute : wrapper qui vérifie l'authentification avant d'afficher une page
import PrivateRoute from './components/PrivateRoute'
// Layout : shell commun (sidebar + zone de contenu) partagé par toutes les pages privées
import Layout from './components/Layout/Layout'

// ---- Pages ----
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Exercises from './pages/Exercises'
import Workouts from './pages/Workouts'
import WorkoutDetail from './pages/WorkoutDetail'
import Profile from './pages/Profile'

export default function App() {
  return (
    // AuthProvider enveloppe tout : chaque composant peut accéder à l'utilisateur
    // connecté via useAuth(), sans avoir à passer les props manuellement
    <AuthProvider>
      <BrowserRouter>
        {/* ---- Notifications globales ----
            Toaster est placé ici pour être disponible sur toutes les pages.
            Le style reprend le thème dark de l'app (slate-800, slate-100). */}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1E293B',
              color: '#F1F5F9',
              border: '1px solid #334155',
            },
          }}
        />

        <Routes>
          {/* ---- Routes publiques ----
              Accessibles sans être connecté */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ---- Routes privées ----
              PrivateRoute vérifie le token JWT ; si absent → redirection /login.
              Layout ajoute la sidebar et la zone de contenu principale.
              Toutes les pages imbriquées héritent de cette protection. */}
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/exercises" element={<Exercises />} />
              <Route path="/workouts" element={<Workouts />} />
              {/* :id = paramètre dynamique récupéré avec useParams() dans WorkoutDetail */}
              <Route path="/workouts/:id" element={<WorkoutDetail />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>

          {/* ---- Fallback ----
              Toute URL inconnue redirige vers le dashboard.
              replace évite d'empiler une entrée dans l'historique de navigation. */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
