// ============================================================
// REGISTER PAGE
// ============================================================

import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Lock, Mail, User, Eye, EyeOff, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { authService } from '../services/auth.service'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function RegisterPage() {
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showPassword, setShowPassword]               = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading]                     = useState(false)

  const [errors, setErrors] = useState({
    username: '', email: '', password: '', confirmPassword: '',
  })

  const validate = (): boolean => {
    const e = { username: '', email: '', password: '', confirmPassword: '' }

    if (!username.trim())               e.username = 'Username is required'
    if (!email.trim())                  e.email    = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email  = 'Invalid email format'

    if (!password)                      e.password = 'Password is required'
    else if (!/^(?=.*[!@#$%^&*(),.?":{}|<>\-_]).{8,}$/.test(password))
                                        e.password = 'Min 8 chars + special character'

    if (password !== confirmPassword)   e.confirmPassword = 'Passwords do not match'

    setErrors(e)
    return !e.username && !e.email && !e.password && !e.confirmPassword
  }

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validate()) return

    setIsLoading(true)
    try {
      await authService.signup({ username, email, password })
      toast.success('Account created! Please sign in.')
      navigate('/login')
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.message || 'Registration failed'
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-sidebar p-12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">CoreLink</p>
            <p className="text-xs text-white/40">Warehouse Management</p>
          </div>
        </div>

        <h1 className="text-4xl font-bold text-white">
          Start managing <br />
          your warehouse today.
        </h1>

        <p className="text-xs text-white/20">© 2025 CoreLink WMS</p>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-gray-900">Create account</h2>
          <p className="text-sm text-gray-500 mb-6">
            Fill in your details to get started
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username"
              placeholder="your_username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              error={errors.username}
              leftIcon={<User className="h-4 w-4" />}
            />

            <Input
              label="Email"
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              leftIcon={<Mail className="h-4 w-4" />}
            />

            {/* Password */}
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                leftIcon={<Lock className="h-4 w-4" />}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <p className="mt-1 text-xs text-gray-400">
                At least 8 characters + special character
              </p>
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <Input
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={errors.confirmPassword}
                leftIcon={<Lock className="h-4 w-4" />}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <Button type="submit" isLoading={isLoading} className="w-full">
              Create account
            </Button>
          </form>

          {/* DIVIDER */}
          <div className="my-6 flex items-center">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="px-3 text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* GOOGLE (UI only) */}
          <button className="w-full border rounded-lg py-2 text-sm hover:bg-gray-50">
            Continue with Google
          </button>

          {/* SIGN IN LINK */}
          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <span
              onClick={() => navigate('/login')}
              className="text-blue-500 cursor-pointer hover:underline"
            >
              Sign in
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}