import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authstore'

export  function RequireAuth() {
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const loading = useAuthStore((s) => s.loading)
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B132B]">
        <div className="w-8 h-8 border-2 border-[#0EA5A0] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // If unauthenticated, redirect to login while preserving the attempted location
  if (!user || !token) {
    return <Navigate to="/signin" state={{ from: location }} replace />
  }

  return <Outlet />
}