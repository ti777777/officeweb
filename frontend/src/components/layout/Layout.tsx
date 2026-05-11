import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { LogOut, Settings, User, LayoutGrid } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TooltipProvider } from '@/components/ui/tooltip'

function Logo() {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <div className="relative w-7 h-7">
        <div className="absolute inset-0 rounded-md bg-primary" />
        <div className="absolute inset-[3px] rounded-sm bg-primary-foreground/20" />
        <div className="absolute inset-[6px] rounded-[2px] bg-primary-foreground" />
      </div>
      <span className="text-[15px] font-bold tracking-tight text-foreground">OfficeWeb</span>
    </div>
  )
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isHome = location.pathname === '/'

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : '??'

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-full flex flex-col bg-background">
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1 -ml-1 px-1 py-0.5 rounded transition-opacity hover:opacity-75"
            >
              <Logo />
            </button>

            {!isHome && (
              <button
                onClick={() => navigate('/')}
                className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Workspaces
              </button>
            )}

            <div className="ml-auto flex items-center gap-2">
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col gap-0.5">
                        <p className="text-sm font-semibold">{user.username}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem disabled>
                        <User />
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled>
                        <Settings />
                        Settings
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={logout}
                      className="text-destructive focus:text-destructive focus:bg-destructive/10"
                    >
                      <LogOut />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </main>
      </div>
    </TooltipProvider>
  )
}
