import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative w-9 h-9">
        <div className="absolute inset-0 rounded-lg bg-primary" />
        <div className="absolute inset-[4px] rounded-md bg-primary-foreground/20" />
        <div className="absolute inset-[8px] rounded-[3px] bg-primary-foreground" />
      </div>
      <span className="text-xl font-bold tracking-tight">OfficeWeb</span>
    </div>
  )
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Login failed, please try again'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4"
      style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--border)) 1px, transparent 0)`,
        backgroundSize: '24px 24px',
      }}
    >
      <div className="w-full max-w-sm animate-fade-in">
        <div className="flex flex-col items-center mb-8 gap-1">
          <Logo />
          <p className="text-sm text-muted-foreground mt-2">Sign in to your workspace</p>
        </div>

        <div className="bg-card border rounded-xl shadow-sm p-7">
          <h1 className="text-lg font-semibold mb-5">Welcome back</h1>

          <form onSubmit={e => void handleSubmit(e)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                autoFocus
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full mt-1">
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          No account?{' '}
          <Link to="/register" className="text-primary font-medium hover:underline underline-offset-4">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
