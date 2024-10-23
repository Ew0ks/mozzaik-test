import { jwtDecode } from "jwt-decode"
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { useNavigate } from "@tanstack/react-router"

export type AuthenticationState =
  | {
      isAuthenticated: true
      token: string
      userId: string
    }
  | {
      isAuthenticated: false
    }

export type Authentication = {
  state: AuthenticationState
  authenticate: (token: string) => void
  signout: () => void
}

export const AuthenticationContext = createContext<Authentication | undefined>(
  undefined
)

export const AuthenticationProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [state, setState] = useState<AuthenticationState>({
    isAuthenticated: false,
  })
  const navigate = useNavigate()

  // Fonction pour vérifier si le token est expiré
  const isTokenExpired = (token: string) => {
    const { exp } = jwtDecode<{ exp: number }>(token)
    return exp * 1000 < Date.now() // exp est en secondes, Date.now() en millisecondes
  }

  // Charger le token depuis localStorage au démarrage
  useEffect(() => {
    const savedToken = localStorage.getItem("authToken")
    if (savedToken) {
      if (isTokenExpired(savedToken)) {
        localStorage.removeItem("authToken")
        navigate({ to: "/login" }) // Redirection si le token est expiré
      } else {
        setState({
          isAuthenticated: true,
          token: savedToken,
          userId: jwtDecode<{ id: string }>(savedToken).id,
        })
      }
    }
  }, [navigate])

  const authenticate = useCallback(
    (token: string) => {
      localStorage.setItem("authToken", token) // Stocker le token dans localStorage
      setState({
        isAuthenticated: true,
        token,
        userId: jwtDecode<{ id: string }>(token).id,
      })
    },
    [setState]
  )

  const signout = useCallback(() => {
    localStorage.removeItem("authToken") // Retirer le token de localStorage
    setState({ isAuthenticated: false })
    navigate({ to: "/login" }) // Redirection vers la page de connexion
  }, [setState, navigate])

  const contextValue = useMemo(
    () => ({ state, authenticate, signout }),
    [state, authenticate, signout]
  )

  return (
    <AuthenticationContext.Provider value={contextValue}>
      {children}
    </AuthenticationContext.Provider>
  )
}

export function useAuthentication() {
  const context = useContext(AuthenticationContext)
  if (!context) {
    throw new Error(
      "useAuthentication must be used within an AuthenticationProvider"
    )
  }
  return context
}

export function useAuthToken() {
  const { state } = useAuthentication()
  if (!state.isAuthenticated) {
    throw new Error("User is not authenticated")
  }
  return state.token
}
