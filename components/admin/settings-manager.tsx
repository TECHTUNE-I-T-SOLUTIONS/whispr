"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, Palette, Bell, Shield, Database, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { PushNotificationManager } from "@/components/push-notification-manager"
import { PushNotificationTester } from "@/components/push-notification-tester"

interface AppSettings {
  theme: "light" | "dark" | "system"
  autoSave: boolean
  emailNotifications: boolean
  pushNotifications: boolean
  twoFactorAuth: boolean
  sessionTimeout: number
  backupFrequency: "daily" | "weekly" | "monthly"
  analyticsEnabled: boolean
}

export function SettingsManager() {
  const [settings, setSettings] = useState<AppSettings>({
    theme: "system",
    autoSave: true,
    emailNotifications: true,
    pushNotifications: false,
    twoFactorAuth: false,
    sessionTimeout: 24,
    backupFrequency: "weekly",
    analyticsEnabled: true,
  })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const updateSetting = async (key: keyof AppSettings, value: any) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      })

      if (response.ok) {
        toast({
          variant: "success",
          title: "Settings updated",
          description: "Your preferences have been saved.",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings.",
      })
    }
  }

  const exportData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/export")
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `whispr-backup-${new Date().toISOString().split("T")[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          variant: "success",
          title: "Data exported",
          description: "Your data has been downloaded successfully.",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to export data.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold flex items-center gap-2">
          <Settings className="h-8 w-8 text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground">Configure your admin dashboard preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Appearance Settings */}
        <Card className="border-0 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="theme">Theme</Label>
              <Select value={settings.theme} onValueChange={(value: any) => updateSetting("theme", value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-save">Auto-save drafts</Label>
              <Switch
                id="auto-save"
                checked={settings.autoSave}
                onCheckedChange={(checked) => updateSetting("autoSave", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="border-0 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notifications">Email notifications</Label>
              <Switch
                id="email-notifications"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => updateSetting("emailNotifications", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="push-notifications">Push notifications</Label>
              <Switch
                id="push-notifications"
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => updateSetting("pushNotifications", checked)}
              />
            </div>

            {/* Push Notification Manager */}
            <div className="pt-4 border-t">
              <PushNotificationManager showTestButton={true} />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="border-0 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="two-factor">Two-factor authentication</Label>
              <Switch
                id="two-factor"
                checked={settings.twoFactorAuth}
                onCheckedChange={(checked) => updateSetting("twoFactorAuth", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="session-timeout">Session timeout (hours)</Label>
              <Select
                value={settings.sessionTimeout.toString()}
                onValueChange={(value) => updateSetting("sessionTimeout", Number.parseInt(value))}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hour</SelectItem>
                  <SelectItem value="8">8 hours</SelectItem>
                  <SelectItem value="24">24 hours</SelectItem>
                  <SelectItem value="168">1 week</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Data & Backup Settings */}
        <Card className="border-0 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data & Backup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="backup-frequency">Backup frequency</Label>
              <Select
                value={settings.backupFrequency}
                onValueChange={(value: any) => updateSetting("backupFrequency", value)}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="analytics">Analytics tracking</Label>
              <Switch
                id="analytics"
                checked={settings.analyticsEnabled}
                onCheckedChange={(checked) => updateSetting("analyticsEnabled", checked)}
              />
            </div>
            <Button onClick={exportData} disabled={isLoading} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              {isLoading ? "Exporting..." : "Export All Data"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Push Notification Test */}
      <div className="mt-8">
        <PushNotificationTester />
      </div>
    </div>
  )
}
