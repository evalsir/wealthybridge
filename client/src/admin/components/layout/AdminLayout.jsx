import { AdminSidebar } from './AdminSidebar'
import { AdminHeader } from './AdminHeader'
import { AdminFooter } from './AdminFooter'

export function AdminLayout({ children }) {
  return (
    <div className="min-h-screen flex w-full bg-blue-50">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col">
        <AdminHeader />
        
        <main className="flex-1 p-6 bg-muted/20">
          {children}
        </main>
        
        <AdminFooter />
      </div>
    </div>
  )
}