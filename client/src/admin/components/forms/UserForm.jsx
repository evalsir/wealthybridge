//src/admin/components/forms/userForm.jsx  
'use client'

import { useState } from 'react'
import { Button } from '@/admin/components/ui/button'
import { Input } from '@/admin/components/ui/input'
import { Label } from '@/admin/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/admin/components/ui/select'
import { Textarea } from '@/admin/components/ui/textarea'

export function UserForm({ onSuccess, initialData = null }) {
  const [formData, setFormData] = useState({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    username: initialData?.username || '',
    email: initialData?.email || '',
    countryCode: initialData?.countryCode || '+1',
    phone: initialData?.phone || '',
    password: '',
    confirmPassword: '',
    role: initialData?.role || '',
    status: initialData?.status || 'Active',
    bio: initialData?.bio || '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
    if (onSuccess) onSuccess()
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-6xl mx-auto rounded-2xl bg-white dark:bg-gray-200 shadow-lg border border-gray-200 dark:border-gray-500 p-4 sm:p-6 md:p-10 space-y-6"
    >
      <div>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-900">
          {initialData ? 'Edit User' : 'Create New User'}
        </h2>
        <p className="text-sm text-muted-foreground dark:text-gray-900">
          Fill in the form below to {initialData ? 'update user details' : 'create a new user'}.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            placeholder="John"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            placeholder="Doe"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={formData.username}
            onChange={(e) => handleInputChange('username', e.target.value)}
            placeholder="johndoe123"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="john@example.com"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="countryCode">Country Code</Label>
          <Input
            id="countryCode"
            value={formData.countryCode}
            onChange={(e) => handleInputChange('countryCode', e.target.value)}
            placeholder="+1"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="(555) 123-4567"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Create Password</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            placeholder="••••••••"
            required={!initialData}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            placeholder="••••••••"
            required={!initialData}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="role">User Role</Label>
          <Select
            value={formData.role}
            onValueChange={(value) => handleInputChange('role', value)}
          >
            <SelectTrigger className="bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 dark:text-white">
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="Moderator">Moderator</SelectItem>
              <SelectItem value="User">User</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Account Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => handleInputChange('status', value)}
          >
            <SelectTrigger className="bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 dark:text-white">
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="Suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">User Bio (Optional)</Label>
        <Textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => handleInputChange('bio', e.target.value)}
          placeholder="Tell us something about this user..."
          rows={4}
          className="bg-white dark:bg-gray-500 dark:text-white dark:border-gray-600"
        />
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onSuccess}
        >
          Cancel
        </Button>
        <Button type="submit" variant="default">
          {initialData ? 'Update User' : 'Create User'}
        </Button>
      </div>
    </form>
  )
}
