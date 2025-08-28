import { BarChart3, Users, CreditCard, Settings, FileText, Home } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3 },
  { title: "Users", url: "/dashboard/users", icon: Users },
  { title: "Transactions", url: "/dashboard/transactions", icon: CreditCard },
  { title: "Content", url: "/dashboard/content", icon: FileText },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const collapsed = state === "collapsed"

  const isActive = (path: string) => currentPath === path

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-bold mb-4">
            {!collapsed && "Admin Panel"}
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) =>
                        isActive 
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                          : "hover:bg-sidebar-accent/50"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}