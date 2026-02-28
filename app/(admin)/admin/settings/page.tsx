/**
 * Admin Settings
 * 
 * System configuration and settings management for administrators.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  AlertTriangle,
  Save,
  Shield,
  Mail,
  Bell,
  CreditCard,
  Database,
} from 'lucide-react';

export const metadata = {
  title: 'Settings | Admin | ReputeOS',
  description: 'System configuration and settings',
};

export default async function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Settings</h1>
        <p className="text-neutral-600 mt-1">
          Configure system-wide settings and preferences
        </p>
      </div>

      {/* Warning Banner */}
      <Alert variant="warning">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Careful!</AlertTitle>
        <AlertDescription>
          Changes to these settings affect all users. Make sure you understand the impact before saving.
        </AlertDescription>
      </Alert>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* General Settings */}
        <GeneralSettings />

        {/* Security Settings */}
        <SecuritySettings />

        {/* Notification Settings */}
        <NotificationSettings />

        {/* AI Settings */}
        <AISettings />

        {/* Maintenance */}
        <MaintenanceSettings />
      </div>
    </div>
  );
}

function GeneralSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          General Settings
        </CardTitle>
        <CardDescription>
          Basic platform configuration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="app-name">Application Name</Label>
            <Input
              id="app-name"
              defaultValue="ReputeOS"
              placeholder="Enter application name"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="support-email">Support Email</Label>
            <Input
              id="support-email"
              type="email"
              defaultValue="support@reputeos.com"
              placeholder="support@example.com"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="default-timezone">Default Timezone</Label>
            <select
              id="default-timezone"
              className="px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              defaultValue="UTC"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Europe/Paris">Paris (CET)</option>
              <option value="Asia/Tokyo">Tokyo (JST)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>User Registration</Label>
            <p className="text-sm text-neutral-500">
              Allow new users to sign up
            </p>
          </div>
          <Switch defaultChecked />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Email Verification Required</Label>
            <p className="text-sm text-neutral-500">
              Require email verification before accessing the platform
            </p>
          </div>
          <Switch defaultChecked />
        </div>

        <Button className="w-full sm:w-auto">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </CardContent>
    </Card>
  );
}

function SecuritySettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security Settings
        </CardTitle>
        <CardDescription>
          Configure security and access controls
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
            <Input
              id="max-login-attempts"
              type="number"
              defaultValue="5"
              min="1"
              max="10"
            />
            <p className="text-sm text-neutral-500">
              Number of failed attempts before temporary lockout
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="session-timeout">Session Timeout (hours)</Label>
            <Input
              id="session-timeout"
              type="number"
              defaultValue="24"
              min="1"
              max="168"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Two-Factor Authentication</Label>
            <p className="text-sm text-neutral-500">
              Require 2FA for admin accounts
            </p>
          </div>
          <Switch />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>IP Allowlist</Label>
            <p className="text-sm text-neutral-500">
              Restrict admin access to specific IP addresses
            </p>
          </div>
          <Switch />
        </div>

        <Button className="w-full sm:w-auto">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </CardContent>
    </Card>
  );
}

function NotificationSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Settings
        </CardTitle>
        <CardDescription>
          Configure system notifications and alerts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>New User Notifications</Label>
            <p className="text-sm text-neutral-500">
              Send email when a new user signs up
            </p>
          </div>
          <Switch defaultChecked />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Security Alerts</Label>
            <p className="text-sm text-neutral-500">
              Send email for security-related events
            </p>
          </div>
          <Switch defaultChecked />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Weekly Reports</Label>
            <p className="text-sm text-neutral-500">
              Send weekly system analytics report
            </p>
          </div>
          <Switch defaultChecked />
        </div>

        <Separator />

        <div className="grid gap-2">
          <Label htmlFor="admin-emails">Admin Notification Emails</Label>
          <Input
            id="admin-emails"
            placeholder="admin1@example.com, admin2@example.com"
          />
          <p className="text-sm text-neutral-500">
            Comma-separated list of emails to receive notifications
          </p>
        </div>

        <Button className="w-full sm:w-auto">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </CardContent>
    </Card>
  );
}

function AISettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          AI Configuration
        </CardTitle>
        <CardDescription>
          Configure AI provider settings and limits
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="ai-model">Default AI Model</Label>
            <select
              id="ai-model"
              className="px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              defaultValue="gpt-4o"
            >
              <option value="gpt-4o">GPT-4o</option>
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="claude-3-sonnet">Claude 3 Sonnet</option>
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="max-tokens">Max Tokens per Request</Label>
            <Input
              id="max-tokens"
              type="number"
              defaultValue="2000"
              min="100"
              max="8000"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="daily-ai-limit">Daily AI Requests per User</Label>
            <Input
              id="daily-ai-limit"
              type="number"
              defaultValue="100"
              min="10"
              max="1000"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Content Moderation</Label>
            <p className="text-sm text-neutral-500">
              Enable AI content moderation for generated content
            </p>
          </div>
          <Switch defaultChecked />
        </div>

        <Button className="w-full sm:w-auto">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </CardContent>
    </Card>
  );
}

function MaintenanceSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="h-5 w-5" />
          Maintenance
        </CardTitle>
        <CardDescription>
          Danger zone - These actions cannot be undone
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
          <div>
            <h4 className="font-medium text-red-900">Maintenance Mode</h4>
            <p className="text-sm text-red-700">
              Put the site in maintenance mode. Only admins can access.
            </p>
          </div>
          <Switch />
        </div>

        <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
          <div>
            <h4 className="font-medium text-red-900">Clear Cache</h4>
            <p className="text-sm text-red-700">
              Clear all cached data. May impact performance temporarily.
            </p>
          </div>
          <Button variant="destructive" size="sm">
            Clear Cache
          </Button>
        </div>

        <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
          <div>
            <h4 className="font-medium text-red-900">Export All Data</h4>
            <p className="text-sm text-red-700">
              Download a complete backup of all platform data.
            </p>
          </div>
          <Button variant="outline" size="sm">
            Export Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
