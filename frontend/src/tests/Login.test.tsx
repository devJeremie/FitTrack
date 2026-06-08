// ============================================================
// tests/Login.test.tsx — Tests du composant Login
//
// Outils utilisés :
//   - Vitest : framework de test (describe/it/expect/vi)
//   - React Testing Library (RTL) : render, screen, waitFor
//   - userEvent : simule les interactions utilisateur (frappe, clic)
//
// Philosophie RTL : tester comme un utilisateur (ce qu'il voit et fait),
// pas l'implémentation interne. On cherche par placeholder, rôle,
// texte visible — pas par data-testid ou sélecteurs CSS.
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
// MemoryRouter : routeur en mémoire (pas d'URL réelle), nécessaire car Login utilise <Link>
import { MemoryRouter } from 'react-router-dom'
import Login from '../pages/Login'
import { AuthContext, AuthContextType } from '../context/AuthContext'

// ---- Mock de useNavigate ----
// vi.mock() remplace un module par un mock pour toute la suite de tests.
// On garde tous les exports réels (via vi.importActual) et on remplace
// seulement useNavigate par une fonction espion qu'on peut inspecter.
const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

// ---- Mock de react-hot-toast ----
// On mocke toast pour pouvoir vérifier qu'il a été appelé sans afficher de vraie notification
vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
}))

// Fonction espion pour la fonction login du contexte
const mockLogin = vi.fn()

// Fabrique un contexte d'auth avec des valeurs par défaut modifiables
// Overrides permet de personnaliser les valeurs pour certains tests
const makeAuthContext = (overrides: Partial<AuthContextType> = {}): AuthContextType => ({
  user: null,
  loading: false,
  login: mockLogin,
  register: vi.fn(),
  logout: vi.fn(),
  ...overrides,
})

// Fonction utilitaire pour rendre Login dans son contexte nécessaire
// (AuthContext.Provider + MemoryRouter pour React Router)
const renderLogin = (ctx = makeAuthContext()) =>
  render(
    <AuthContext.Provider value={ctx}>
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    </AuthContext.Provider>
  )

describe('Login', () => {
  // Réinitialise tous les mocks avant chaque test
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ---- Test de rendu (ce que l'utilisateur voit) ----
  it('affiche le formulaire avec les champs email et mot de passe', () => {
    renderLogin()

    // screen.getByPlaceholderText : cherche un input par son placeholder
    // (getBy : lève une erreur si non trouvé — assertif, pas besoin d'expect supplémentaire)
    expect(screen.getByPlaceholderText('ton@email.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    // getByRole : cherche par rôle ARIA + texte accessible
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument()
    // /se connecter/i = regex insensible à la casse (i)
  })

  it("affiche un lien vers la page d'inscription", () => {
    renderLogin()

    expect(screen.getByRole('link', { name: /s'inscrire/i })).toBeInTheDocument()
  })

  // ---- Test d'interaction ----
  it('appelle login avec les bons identifiants à la soumission', async () => {
    // userEvent.setup() crée un utilisateur virtuel (recommandé vs fireEvent)
    const user = userEvent.setup()
    mockLogin.mockResolvedValue(undefined) // Login réussit sans erreur

    renderLogin()

    // user.type() simule la frappe caractère par caractère (avec événements complets)
    await user.type(screen.getByPlaceholderText('ton@example.com'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123')
    await user.click(screen.getByRole('button', { name: /se connecter/i }))

    // waitFor : attend que l'assertion soit vraie (utile pour les appels async)
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  it('redirige vers /dashboard après connexion réussie', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue(undefined)
    renderLogin()

    await user.type(screen.getByPlaceholderText('ton@email.com'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123')
    await user.click(screen.getByRole('button', { name: /se connecter/i }))

    await waitFor(() => {
      // mockNavigate doit avoir été appelé avec '/dashboard' après le login
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it("affiche une erreur toast en cas d'échec de connexion", async () => {
    // Import dynamique du mock pour vérifier l'appel à toast.error
    const toast = (await import('react-hot-toast')).default
    const user = userEvent.setup()
    // mockRejectedValue : simule une erreur de l'API (ex: identifiants incorrects)
    mockLogin.mockRejectedValue({ response: { data: { error: 'Invalid credentials.' } } })
    renderLogin()

    await user.type(screen.getByPlaceholderText('ton@email.com'), 'bad@example.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'wrongpass')
    await user.click(screen.getByRole('button', { name: /se connecter/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled()
    })
  })

  it('désactive le bouton pendant le chargement', async () => {
    const user = userEvent.setup()
    // new Promise(() => {}) : promesse qui ne se résout jamais → simule un chargement infini
    mockLogin.mockImplementation(() => new Promise(() => {}))
    renderLogin()

    await user.type(screen.getByPlaceholderText('ton@email.com'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123')
    await user.click(screen.getByRole('button', { name: /se connecter/i }))

    await waitFor(() => {
      // Le texte change et le bouton est désactivé pendant l'appel
      expect(screen.getByRole('button', { name: /connexion\.\.\./i })).toBeDisabled()
    })
  })
})
