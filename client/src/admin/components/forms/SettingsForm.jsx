//src/admin/components//forms/settingsForm.jsx
import { useState } from 'react'
import { Button } from '@/admin/components/ui/button'
import { Input } from '@/admin/components/ui/input'
import { Label } from '@/admin/components/ui/label'
import { Switch } from '@/admin/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/admin/components/ui/select'

export function SettingsForm() {
  const [settings, setSettings] = useState({
    siteName: 'Admin Dashboard',
    siteUrl: 'https://admin.example.com',
    language: 'en',
    timezone: 'UTC',
    maintenanceMode: false,
    registrationEnabled: true,
    emailNotifications: true,
    smsNotifications: false
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Settings updated:', settings)
    // Here you would typically send the data to your API
  }

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="siteName">Site Name</Label>
          <Input
            id="siteName"
            value={settings.siteName}
            onChange={(e) => handleInputChange('siteName', e.target.value)}
            placeholder="Enter site name"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="siteUrl">Site URL</Label>
          <Input
            id="siteUrl"
            value={settings.siteUrl}
            onChange={(e) => handleInputChange('siteUrl', e.target.value)}
            placeholder="Enter site URL"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="language">Language</Label>
          <Select value={settings.language} onValueChange={(value) => handleInputChange('language', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
              <SelectItem value="fr">French</SelectItem>
              <SelectItem value="de">German</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Select value={settings.timezone} onValueChange={(value) => handleInputChange('timezone', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UTC">UTC</SelectItem>
              <SelectItem value="EST">Eastern Time</SelectItem>
              <SelectItem value="PST">Pacific Time</SelectItem>
              <SelectItem value="CET">Central European Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">System Settings</h3>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
            <p className="text-sm text-muted-foreground">
              Enable maintenance mode to restrict site access
            </p>
          </div>
          <Switch
            id="maintenanceMode"
            checked={settings.maintenanceMode}
            onCheckedChange={(checked) => handleInputChange('maintenanceMode', checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="registrationEnabled">User Registration</Label>
            <p className="text-sm text-muted-foreground">
              Allow new users to register accounts
            </p>
          </div>
          <Switch
            id="registrationEnabled"
            checked={settings.registrationEnabled}
            onCheckedChange={(checked) => handleInputChange('registrationEnabled', checked)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Notification Settings</h3>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="emailNotifications">Email Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Receive notifications via email
            </p>
          </div>
          <Switch
            id="emailNotifications"
            checked={settings.emailNotifications}
            onCheckedChange={(checked) => handleInputChange('emailNotifications', checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="smsNotifications">SMS Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Receive notifications via SMS
            </p>
          </div>
          <Switch
            id="smsNotifications"
            checked={settings.smsNotifications}
            onCheckedChange={(checked) => handleInputChange('smsNotifications', checked)}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline">
          Reset
        </Button>
        <Button type="submit">
          Save Changes
        </Button>
      </div>
    </form>
  )
}