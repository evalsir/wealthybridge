//src/admin/pages/users.jsx
import { useState } from 'react'
import { UserTable } from '@/admin/components/tables/UserTable'
import { UserForm } from '@/admin/components/forms/UserForm'
import { Button } from '@/admin/components/ui/button'
import { Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/admin/components/ui/dialog'

export default function Users() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage and monitor all user accounts
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full max-w-3xl">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new user to the system
              </DialogDescription>
            </DialogHeader>
            <UserForm onSuccess={() => setIsCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <UserTable />
    </div>
  )
}