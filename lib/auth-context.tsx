'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { User } from './types'
import { ROLE_PERMISSIONS } from './types'
import { getCurrentUser, setCurrentUser, authenticateUser } from './store'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (username: string, password: string) => boolean
  logout: () => void
  permissions: typeof ROLE_PERMISSIONS['admin'] | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
    setIsLoading(false)
  }, [])

  const login = (username: string, password: string): boolean => {
    const authenticatedUser = authenticateUser(username, password)
    if (authenticatedUser) {
      setUser(authenticatedUser)
      setCurrentUser(authenticatedUser)
      return true
    }
    return false
  }

  const logout = () => {
    setUser(null)
    setCurrentUser(null)
  }

  const permissions = user ? ROLE_PERMISSIONS[user.role] : null

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, permissions }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
