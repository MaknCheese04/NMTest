import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { Show } from "@clerk/react"
import ClerkAuthProvider from "@/components/auth/ClerkAuthProvider"
import { SignInPage, SignUpPage } from "@/components/AuthPages"
import ProfileSetup from "@/components/ProfileSetup"
import Subscribe from "@/components/Subscribe"
import { PaymentCancel, PaymentSuccess } from "@/components/PaymentResult"
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

function Loading() {
  const { error, refresh } = useProfile()
  return (
    <div className="app-loading" data-testid="app-loading">
      {error ? (
        <div className="app-error">
          <p data-testid="app-load-error">{error}</p>
          <button type="button" onClick={() => refresh().catch(() => {})} data-testid="app-retry-button">Try again</button>
        </div>
      ) : "Loading your music home…"}
    </div>
  )
}

function WithProfile({ children }) {
  const { profile } = useProfile()
  return profile ? children : <Loading />
}

function Home() {
  const { profile } = useProfile()
  if (!profile.completed) return <Navigate to="/complete-profile" replace />
  if (!profile.plan_level) return <Navigate to="/subscribe" replace />
  return <PlayerScreen />
}

function SubscribeRoute() {
  const { profile } = useProfile()
  if (!profile.completed) return <Navigate to="/complete-profile" replace />
  return <Subscribe />
}

const guard = (el) => <Protected><WithProfile>{el}</WithProfile></Protected>

export default function App() {
  return (
    <BrowserRouter>
      <ClerkAuthProvider>
        <ProfileProvider>
          <Routes>
            <Route path="/sign-in/*" element={<SignedOutOnly><SignInPage /></SignedOutOnly>} />
            <Route path="/sign-up/*" element={<SignedOutOnly><SignUpPage /></SignedOutOnly>} />
            <Route path="/complete-profile" element={guard(<ProfileSetup />)} />
            <Route path="/subscribe" element={guard(<SubscribeRoute />)} />
            <Route path="/payment/success" element={<Protected><PaymentSuccess /></Protected>} />
            <Route path="/payment/cancel" element={<Protected><PaymentCancel /></Protected>} />
            <Route path="/" element={guard(<Home />)} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ProfileProvider>
      </ClerkAuthProvider>
    </BrowserRouter>
  )
}
