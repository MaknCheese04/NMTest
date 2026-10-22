import { useState } from "react"
import { Link } from "react-router-dom"
import { SignIn, SignUp } from "@clerk/react"
import AuthLayout from "./AuthLayout"
import PlanPicker from "./PlanPicker"
import { getSavedPlan, savePlan } from "@/lib/profile"

export function SignInPage() {
  return (
    <AuthLayout mode="login" footer={
      <p className="create-account" data-testid="create-account-prompt">
        New to NewMusiq? <Link to="/sign-up" data-testid="create-account-link">Create an Account</Link>
      </p>
    }>
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
    </AuthLayout>
  )
}

export function SignUpPage() {
  const [plan, setPlan] = useState(getSavedPlan)
  const choose = (p) => { setPlan(p); savePlan(p) }
  return (
    <AuthLayout mode="create" title="Create Your Account"
      aside={<PlanPicker value={plan} onChange={choose} />}
      footer={<p className="setup-steps" data-testid="signup-steps">Step 1 of 3 · Next: username &amp; location, then payment</p>}>
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
    </AuthLayout>
  )
}
