//src/admin/pages/settings.jsx
import { SettingsForm } from "@/admin/components/forms/SettingsForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/admin/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/admin/components/ui/tabs";

export default function Settings() {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-gray-800">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your application settings and preferences
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-white shadow-sm border p-1 rounded-xl mb-4">
          <TabsTrigger value="general" className="px-4 py-2 rounded-md text-sm font-medium">
            General
          </TabsTrigger>
          <TabsTrigger value="security" className="px-4 py-2 rounded-md text-sm font-medium">
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="px-4 py-2 rounded-md text-sm font-medium">
            Notifications
          </TabsTrigger>
          <TabsTrigger value="integrations" className="px-4 py-2 rounded-md text-sm font-medium">
            Integrations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="border border-gray-200 shadow-sm rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg text-gray-800">General Settings</CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Configure general application settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SettingsForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="border border-gray-200 shadow-sm rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg text-gray-800">Security Settings</CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Manage security and authentication settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">Security settings will be implemented here.</div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="border border-gray-200 shadow-sm rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg text-gray-800">Notification Settings</CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Configure how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">Notification settings will be implemented here.</div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card className="border border-gray-200 shadow-sm rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg text-gray-800">Integration Settings</CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Manage third-party integrations and APIs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">Integration settings will be implemented here.</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
