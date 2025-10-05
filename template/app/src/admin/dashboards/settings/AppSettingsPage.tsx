import React, { useState, useEffect } from 'react';
import { getAppSettings, updateAppSetting, useQuery } from 'wasp/client/operations';
import { type AuthUser } from 'wasp/auth';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Separator } from '../../../components/ui/separator';
import { Badge } from '../../../components/ui/badge';
import Breadcrumb from '../../layout/Breadcrumb';
import DefaultLayout from '../../layout/DefaultLayout';
import toast from 'react-hot-toast';

interface AppSetting {
  id: string;
  key: string;
  value: string;
  description: string | null;
  updatedAt: Date;
}

export default function AppSettingsPage({ user }: { user: AuthUser }) {
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const { data: appSettings, isLoading: isFetching, refetch } = useQuery(getAppSettings);

  useEffect(() => {
    if (appSettings) {
      setSettings(appSettings);
    }
  }, [appSettings]);

  const handleEdit = (setting: AppSetting) => {
    setEditingKey(setting.key);
    setEditValue(setting.value);
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditValue('');
  };

  const handleSave = async (key: string) => {
    if (!editValue.trim()) {
      toast.error('Value cannot be empty');
      return;
    }

    setIsLoading(true);
    try {
      await updateAppSetting({ key, value: editValue });
      toast.success('Setting updated successfully');
      setEditingKey(null);
      setEditValue('');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update setting');
    } finally {
      setIsLoading(false);
    }
  };

  const getSettingIcon = (key: string) => {
    switch (key) {
      case 'maintenance_mode':
        return '🔧';
      case 'max_file_size_mb':
        return '📁';
      case 'email_from_name':
        return '📧';
      case 'email_from_address':
        return '📧';
      default:
        return '⚙️';
    }
  };

  const getSettingType = (key: string) => {
    switch (key) {
      case 'maintenance_mode':
        return 'boolean';
      case 'max_file_size_mb':
        return 'number';
      default:
        return 'text';
    }
  };

  const formatValue = (key: string, value: string) => {
    const type = getSettingType(key);
    switch (type) {
      case 'boolean':
        return value === 'true' ? 'Enabled' : 'Disabled';
      case 'number':
        return `${value} MB`;
      default:
        return value;
    }
  };

  if (isFetching) {
    return (
      <DefaultLayout user={user}>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading settings...</div>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout user={user}>
      <div className="mx-auto max-w-4xl">
        <Breadcrumb pageName="App Settings" />

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>⚙️</span>
                Application Settings
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage global application settings and configuration values.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No settings found. Run database seeding to initialize default settings.
                </div>
              ) : (
                settings.map((setting, index) => (
                  <div key={setting.id}>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getSettingIcon(setting.key)}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <Label className="font-semibold text-base">
                              {setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Label>
                            <Badge variant="outline" className="text-xs">
                              {getSettingType(setting.key)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {setting.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Last updated: {new Date(setting.updatedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {editingKey === setting.key ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-32"
                              placeholder="Enter value"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleSave(setting.key)}
                              disabled={isLoading}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancel}
                              disabled={isLoading}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="text-right">
                              <div className="font-medium">
                                {formatValue(setting.key, setting.value)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {setting.value}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(setting)}
                            >
                              Edit
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    {index < settings.length - 1 && <Separator className="my-4" />}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>💡 Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• <strong>Maintenance Mode:</strong> Set to "true" to enable maintenance mode (disable user access)</p>
              <p>• <strong>Max File Size:</strong> Maximum file upload size in megabytes</p>
              <p>• Changes take effect immediately after saving</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DefaultLayout>
  );
}
