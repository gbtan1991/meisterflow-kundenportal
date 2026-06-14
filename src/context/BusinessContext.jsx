import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'

const BusinessContext = createContext({})

export function BusinessProvider({ children }) {
  const { user } = useAuth()
  const [currentBusiness, setCurrentBusiness] = useState(null)
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setCurrentBusiness(null)
      setBusinesses([])
      setLoading(false)
      return
    }
    loadBusinesses()
  }, [user])

  const loadBusinesses = async () => {
    setLoading(true)
    try {
      // Get all businesses user belongs to
      const { data: memberOf } = await supabase
        .from('business_members')
        .select('business_id, role, businesses(*)')
        .eq('user_id', user.id)

      // Get businesses user owns
      const { data: owned } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)

      // Combine and deduplicate
      const memberBusinesses = memberOf?.map(m => ({
        ...m.businesses,
        role: m.role
      })) ?? []

      const ownedBusinesses = owned?.map(b => ({
        ...b,
        role: 'owner'
      })) ?? []

      const all = [
        ...ownedBusinesses,
        ...memberBusinesses.filter(m =>
          !ownedBusinesses.find(o => o.id === m.id)
        )
      ]

      setBusinesses(all)

      // Load last selected business from localStorage
      const savedId = localStorage.getItem(`mf_business_${user.id}`)
      const saved = all.find(b => b.id === savedId)
      setCurrentBusiness(saved || all[0] || null)
    } catch (err) {
      console.error('Failed to load businesses:', err)
    } finally {
      setLoading(false)
    }
  }

  const switchBusiness = (business) => {
    setCurrentBusiness(business)
    localStorage.setItem(`mf_business_${user.id}`, business.id)
  }

  const createBusiness = async (name) => {
    const { data, error } = await supabase
      .from('businesses')
      .insert({ name, owner_id: user.id })
      .select()
      .single()
    if (error) throw error

    // Add owner as member
    await supabase.from('business_members').insert({
      business_id: data.id,
      user_id: user.id,
      role: 'owner'
    })

    await loadBusinesses()
    switchBusiness(data)
    return data
  }

  return (
    <BusinessContext.Provider value={{
      currentBusiness,
      businesses,
      loading,
      switchBusiness,
      createBusiness,
      loadBusinesses,
    }}>
      {children}
    </BusinessContext.Provider>
  )
}

export function useBusiness() {
  return useContext(BusinessContext)
}
