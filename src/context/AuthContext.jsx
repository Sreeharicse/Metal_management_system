import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../api/supabaseClient'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [role, setRole] = useState(null)
    const [loading, setLoading] = useState(true)

    const [authError, setAuthError] = useState(null)

    useEffect(() => {
        console.log('AuthProvider mounted. Fetching session...')
        // Check active session
        const getSession = async () => {
            try {
                setAuthError(null)
                console.log('Calling supabase.auth.getSession()...')

                // Create a promise that rejects after 5 seconds
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Session fetch timeout (5s)')), 5000)
                );

                // Race Supabase against the timeout
                const { data, error } = await Promise.race([
                    supabase.auth.getSession(),
                    timeoutPromise
                ]);

                if (error) throw error

                if (session?.user) {
                    console.log('Session found for user:', session.user.id)
                    setUser(session.user)
                    await fetchRole(session.user.id, session.user.email)
                } else {
                    console.log('No active session found.')
                }
            } catch (err) {
                console.error('Error getting session:', err)
                setAuthError(err.message)
                // If session is corrupt or times out, clear it and assume logged out
                localStorage.clear()
            } finally {
                setLoading(false)
            }
        }

        getSession()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                setUser(session.user)
                await fetchRole(session.user.id, session.user.email)
            } else {
                setUser(null)
                setRole(null)
            }
            setLoading(false)
        })

        return () => subscription.unsubscribe()
    }, [])

    const fetchRole = async (userId, userEmail) => {
        // EMERGENCY OVERRIDE: Force admin for sreehari@gmail.com
        if (userEmail === 'sreehari@gmail.com') {
            console.log('Force-setting admin role for:', userEmail)
            setRole('admin')
            return
        }

        try {
            setAuthError(null)
            console.log('Fetching role for:', userId)
            // Timeout promise 5s
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Role fetch timeout (5s)')), 5000)
            );

            const { data, error } = await Promise.race([
                supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', userId)
                    .single(),
                timeoutPromise
            ]);

            if (error) {
                console.warn('Error fetching role:', error.message)
                // If it's a specific error (like permissions), show it.
                // If it's just "Row not found" (code PGRST116), we might still want to default to user BUT warn.
                if (error.code === 'PGRST116') {
                    setAuthError('Profile not found in database. defaulting to user.')
                    setRole('user')
                } else {
                    setAuthError('Role Error: ' + error.message)
                    // For safety, might still default or keep null to block access?
                    // Let's keep 'user' default for now but SHOW the error so we know why admin failed.
                    setRole('user')
                }
            } else {
                console.log('Role fetched:', data?.role)
                setRole(data?.role || 'user')
            }
        } catch (err) {
            console.error('Exception fetching role:', err)
            setAuthError('Role Exception: ' + err.message)
            setRole('user')
        }
    }

    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        if (error) throw error
        return data
    }

    const signup = async (email, password) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        })
        if (error) throw error
        return data
    }

    const logout = async () => {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        setUser(null)
        setRole(null)
    }

    const value = {
        user,
        role,
        loading,
        authError,
        login,
        signup,
        logout
    }

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    return useContext(AuthContext)
}
