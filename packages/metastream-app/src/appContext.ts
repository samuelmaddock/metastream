import { createContext, useContext } from 'react'
import { AvatarRegistry } from 'services/avatar'

interface AppContextValue {
  avatarRegistry: AvatarRegistry
}

export const AppContext = createContext<AppContextValue>({} as any)

export const useAppContext = () => useContext(AppContext)
