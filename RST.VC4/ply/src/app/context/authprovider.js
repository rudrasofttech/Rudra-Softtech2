'use client'

import { createContext, useContext } from 'react'
import useAppStore from '../store/useAppStore'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const { token, login, logout } = useAppStore()

  const isLoggedIn = !!token

  return (
    <AuthContext.Provider value={{ token, isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)