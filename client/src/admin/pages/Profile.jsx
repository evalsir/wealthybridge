//src/admin/pages/profile.jsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/admin/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/admin/components/ui/avatar'
import { Button } from '@/admin/components/ui/button'
import { Badge } from '@/admin/components/ui/badge'
import { Calendar, Mail, MapPin, Phone } from 'lucide-react'

export default function Profile() {
  const adminProfile = {
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'System Administrator',
    phone: '+1 (555) 123-4567',
    location: 'New York, NY',
    joinDate: 'January 2024',
    avatar: 'AD'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your profile information and account settings
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Overview */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src="/avatars/admin.png" alt="Admin" />
                <AvatarFallback className="text-lg">{adminProfile.avatar}</AvatarFallback>
              </Avatar>
            </div>
            <CardTitle>{adminProfile.name}</CardTitle>
            <CardDescription>{adminProfile.role}</CardDescription>
            <Badge className="mt-2 w-fit mx-auto">Administrator</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full">Edit Profile</Button>
            <Button variant="outline" className="w-full">Change Password</Button>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Your account details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{adminProfile.email}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">{adminProfile.phone}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">{adminProfile.location}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Member Since</p>
                  <p className="text-sm text-muted-foreground">{adminProfile.joinDate}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Summary */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your recent actions and system interactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Updated user permissions</p>
                  <p className="text-sm text-muted-foreground">Modified access for 3 users</p>
                </div>
                <p className="text-sm text-muted-foreground">2 hours ago</p>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Generated analytics report</p>
                  <p className="text-sm text-muted-foreground">Monthly performance summary</p>
                </div>
                <p className="text-sm text-muted-foreground">1 day ago</p>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">System maintenance completed</p>
                  <p className="text-sm text-muted-foreground">Updated security configurations</p>
                </div>
                <p className="text-sm text-muted-foreground">3 days ago</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}