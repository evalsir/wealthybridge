import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  CreditCard,
  FileText,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/admin/components/ui/button'
import { cn } from '@/lib/utils'

const menuItems = [
  { title: 'Dashboard', url: '/admin/dashboard', icon: LayoutDashboard },
  { title: 'Users', url: '/admin/users', icon: Users },
  { title: 'Analytics', url: '/admin/analytics', icon: BarChart3 },
  { title: 'Transactions', url: '/admin/transactions', icon: CreditCard },
  { title: 'Content', url: '/admin/content', icon: FileText },
  { title: 'Settings', url: '/admin/settings', icon: Settings },
  { title: 'Profile', url: '/admin/profile', icon: User },
]

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <div
      className={cn(
        'bg-blue-900 border-r transition-all duration-300 flex flex-col shadow-sm',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo & Toggle */}
      <div className="p-4 flex items-center justify-between">
        {!collapsed && (
          <h2 className="text-xl font-semibold text-white tracking-tight">
            Admin Panel
          </h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 hover:bg-muted rounded-full"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5 text-white" />
          ) : (
            <ChevronLeft className="h-5 w-5 text-white" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.url)

            return (
              <li key={item.title}>
                <NavLink
                  to={item.url}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg group transition-all duration-200',
                    active
                      ? 'bg-white text-blue-900 font-semibold shadow'
                      : 'hover:bg-blue-800 text-white hover:text-white'
                  )}
                >
                  <div
                    className={cn(
                      'p-1 rounded-md',
                      active
                        ? 'bg-blue-100'
                        : 'group-hover:bg-blue-700 group-hover:text-white'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  {!collapsed && (
                    <span className="text-sm font-medium tracking-wide">
                      {item.title}
                    </span>
                  )}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
