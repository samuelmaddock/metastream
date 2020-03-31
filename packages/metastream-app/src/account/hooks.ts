import { useState, useEffect } from 'react'
import { AccountService } from './account'

export function usePatronTier() {
  const [tier, setTier] = useState(AccountService.get().tier)

  useEffect(() => {
    function handleAccountChange() {
      setTier(AccountService.get().tier)
    }

    AccountService.get().on('change', handleAccountChange)
    return () => {
      AccountService.get().off('change', handleAccountChange)
    }
  })

  return tier
}
