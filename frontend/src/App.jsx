import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { Show, SignIn, SignUp } from "@clerk/react"
import ClerkAuthProvider from "@/components/auth/ClerkAuthProvider"
import AuthLayout from "@/components/AuthLayout"
import ProfileSetup from "@/components/ProfileSetup"
import PlayerScreen from "@/components/PlayerScreen"
import { ProfileProvider, useProfile } from "@/lib/profile"

function Protected({ children }) {
  return (
    <>
      <Show when="signed-in">{children}</Show>
      <Show when="signed-out"><Navigate to="/sign-in" replace /></Show>
    </>
  )
}

function SignedOutOnly({ children }) {
  return (
    <>
      <Show when="signed-out">{children}</Show>
      <Show when="signed-in"><Navigate to="/" replace /></Show>
    </>
  )
}

function Home() {
  const { profile } = useProfile()
  if (!profile) return <div className="app-loading" data-testid="app-loading">Loading your music home…</div>
  if (!profile.completed) return <Navigate to="/complete-profile" replace />
  return <PlayerScreen />
}

export default function App() {
  return (
    <BrowserRouter>
      <ClerkAuthProvider>
        <ProfileProvider>
          <Routes>
            <Route path="/sign-in/*" element={
              <SignedOutOnly>
                <AuthLayout mode="login">
                  <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" withSignUp />
                </AuthLayout>
              </SignedOutOnly>
            } />
            <Route path="/sign-up/*" element={
              <SignedOutOnly>
                <AuthLayout mode="create">
                  <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
                </AuthLayout>
              </SignedOutOnly>
            } />
            <Route path="/complete-profile" element={<Protected><ProfileSetup /></Protected>} />
            <Route path="/" element={<Protected><Home /></Protected>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ProfileProvider>
      </ClerkAuthProvider>
    </BrowserRouter>
  )
}
