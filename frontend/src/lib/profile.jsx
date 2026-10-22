import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { useAuth } from "@clerk/react"

export const API = `${import.meta.env.REACT_APP_BACKEND_URL}/api`

export function useApi() {
  const { getToken } = useAuth()
  return useCallback(async (path, options = {}) => {
    const token = await getToken()
    const res = await fetch(`${API}${path}`, {
      ...options,
      headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      let detail = "Something went wrong. Please try again."
      try { detail = (await res.json()).detail || detail } catch {}
      throw new Error(typeof detail === "string" ? detail : "Please check the form and try again.")
    }
    return res
  }, [getToken])
}

const ProfileContext = createContext({ profile: null, photoUrl: "", refresh: async () => {} })

export function ProfileProvider({ children }) {
  const { isSignedIn, userId } = useAuth()
  const api = useApi()
  const [profile, setProfile] = useState(null)
  const [photoUrl, setPhotoUrl] = useState("")

  const refresh = useCallback(async () => {
    const data = await (await api("/me")).json()
    setProfile(data)
    if (data.has_photo) {
      const blob = await (await api("/me/photo")).blob()
      setPhotoUrl((old) => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(blob) })
    } else {
      setPhotoUrl("")
    }
    return data
  }, [api])

  useEffect(() => {
    if (isSignedIn) refresh().catch(() => setProfile({ completed: false }))
    else { setProfile(null); setPhotoUrl("") }
  }, [isSignedIn, userId, refresh])

  return <ProfileContext.Provider value={{ profile, photoUrl, refresh }}>{children}</ProfileContext.Provider>
}

export const useProfile = () => useContext(ProfileContext)

export const initials = (name = "") =>
  name.split(" ").filter(Boolean).map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "NM"
