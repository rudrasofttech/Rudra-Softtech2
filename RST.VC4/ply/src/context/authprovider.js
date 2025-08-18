'use client'

import { createContext, useContext } from 'react'
import useAppStore from '../store/useAppStore';

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const { token } = useAppStore()

  const isLoggedIn = !!token

  return (
    <AuthContext.Provider value={{ token, isLoggedIn }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)