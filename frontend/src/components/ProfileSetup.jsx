import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useUser } from "@clerk/react"
import AuthLayout from "./AuthLayout"
import { useApi, useProfile } from "@/lib/profile"

const FIELDS = [
  { id: "display_name", label: "Display Name", autoComplete: "nickname" },
  { id: "country", label: "Country", autoComplete: "country-name" },
  { id: "state", label: "State", autoComplete: "address-level1" },
  { id: "zip_code", label: "Zip Code", autoComplete: "postal-code", inputMode: "numeric" },
]

export default function ProfileSetup() {
  const navigate = useNavigate()
  const api = useApi()
  const { user } = useUser()
  const { profile, photoUrl, refresh } = useProfile()
  const [values, setValues] = useState({ display_name: "", country: "", state: "", zip_code: "" })
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState("")
  const [status, setStatus] = useState("")
  const [saving, setSaving] = useState(false)
  const editing = Boolean(profile?.completed)

  useEffect(() => {
    if (profile) setValues((v) => ({ ...v, ...Object.fromEntries(FIELDS.map((f) => [f.id, profile[f.id] || v[f.id]])) }))
  }, [profile])

  function pickPhoto(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) return setStatus("Photo must be under 5 MB.")
    setPhoto(file)
    setPreview(URL.createObjectURL(file))
    setStatus("")
  }

  async function submit(event) {
    event.preventDefault()
    if (FIELDS.some((f) => !values[f.id].trim())) return setStatus("Complete all fields to continue.")
    const body = new FormData()
    FIELDS.forEach((f) => body.append(f.id, values[f.id]))
    body.append("email", user?.primaryEmailAddress?.emailAddress || "")
    if (photo) body.append("photo", photo)
    setSaving(true)
    try {
      await api("/me", { method: "PUT", body })
      await refresh()
      navigate("/", { replace: true })
    } catch (e) {
      setStatus(e.message)
    } finally {
      setSaving(false)
    }
  }

  const shown = preview || photoUrl
  return (
    <AuthLayout mode="create" title={editing ? "Edit Your Profile" : "Create Your Account"} backTo={editing ? "/" : undefined}>
      <div className="photo-field">
        <input id="profile-photo" className="photo-input" type="file" accept="image/png,image/jpeg,image/webp"
          onChange={pickPhoto} data-testid="profile-photo-input" />
        <label className="photo-picker" htmlFor="profile-photo" data-testid="profile-photo-picker">
          {shown ? <img src={shown} alt="Selected profile preview" data-testid="profile-photo-preview" /> : (
            <><span className="photo-plus">+</span><span>Add photo</span></>
          )}
        </label>
      </div>
      <form onSubmit={submit} noValidate data-testid="profile-form">
        {FIELDS.map((f) => (
          <div key={f.id} className="profile-field">
            <label htmlFor={f.id}>{f.label}</label>
            <input id={f.id} type="text" autoComplete={f.autoComplete} inputMode={f.inputMode}
              value={values[f.id]} data-testid={`profile-${f.id.replace("_", "-")}-input`}
              onChange={(e) => setValues((v) => ({ ...v, [f.id]: e.target.value }))} />
          </div>
        ))}
        <button type="submit" disabled={saving} data-testid="profile-submit-button">
          {saving ? "Saving..." : editing ? "Save Changes" : "Create Account"}
        </button>
        <p className="status" aria-live="polite" data-testid="profile-form-status">{status}</p>
      </form>
    </AuthLayout>
  )
}
