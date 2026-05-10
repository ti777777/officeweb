import { Outlet } from 'react-router-dom'
import { FileText, LogOut, User } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export default function Layout() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-full flex flex-col">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3">
          <div className="flex items-center gap-2 text-primary-600">
            <FileText className="w-7 h-7" />
            <span className="text-xl font-bold text-gray-900">OfficeWeb</span>
          </div>
          <span className="text-xs font-medium bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full ml-1">
            WOPI
          </span>

          <div className="ml-auto flex items-center gap-3">
            {user && (
              <>
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>{user.username}</span>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  )
}
