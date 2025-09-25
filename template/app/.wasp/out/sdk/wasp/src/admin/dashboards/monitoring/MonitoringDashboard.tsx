import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { AuthUser } from 'wasp/auth';
import DefaultLayout from '../../layout/DefaultLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { RefreshCw, AlertTriangle, CheckCircle, Clock, Server, Database, Mail, CreditCard, BarChart3 } from 'lucide-react';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: 'ok' | 'error';
    environment: 'ok' | 'error';
    lob?: 'ok' | 'error';
    stripe?: 'ok' | 'error';
    sendgrid?: 'ok' | 'error';
  };
  uptime: number;
  version: string;
}

interface SystemMetrics {
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  uptime: number;
  nodeVersion: string;
  platform: string;
}

export default function MonitoringDashboard({ user }: { user: AuthUser }) {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchHealthStatus = async () => {
    try {
      const response = await fetch('/health');
      const data = await response.json();
      setHealthStatus(data);
    } catch (error) {
      console.error('Failed to fetch health status:', error);
    }
  };

  const fetchSystemMetrics = async () => {
    try {
      const response = await fetch('/health/detailed');
      const data = await response.json();
      setSystemMetrics(data.system);
    } catch (error) {
      console.error('Failed to fetch system metrics:', error);
    }
  };

  const refreshData = async () => {
    setIsLoading(true);
    setLastRefresh(new Date());
    await Promise.all([fetchHealthStatus(), fetchSystemMetrics()]);
    setIsLoading(false);
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800">Healthy</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-100 text-yellow-800">Degraded</Badge>;
      case 'unhealthy':
        return <Badge className="bg-red-100 text-red-800">Unhealthy</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <DefaultLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">System Monitoring</h1>
            <p className="text-muted-foreground">
              Real-time system health and performance metrics
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Link to="/admin">
              <Button size="sm" variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
            </Link>
            <span className="text-sm text-muted-foreground">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
            <Button
              onClick={refreshData}
              disabled={isLoading}
              size="sm"
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Health Status Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              {healthStatus && getStatusIcon(healthStatus.status)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {healthStatus ? getStatusBadge(healthStatus.status) : 'Loading...'}
              </div>
              <p className="text-xs text-muted-foreground">
                Uptime: {healthStatus ? formatUptime(healthStatus.uptime) : 'N/A'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database</CardTitle>
              {healthStatus && getStatusIcon(healthStatus.services.database)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {healthStatus?.services.database === 'ok' ? 'Connected' : 'Error'}
              </div>
              <p className="text-xs text-muted-foreground">
                PostgreSQL connection
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Email Service</CardTitle>
              {healthStatus && getStatusIcon(healthStatus.services.sendgrid || 'unknown')}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {healthStatus?.services.sendgrid === 'ok' ? 'Active' : 'Error'}
              </div>
              <p className="text-xs text-muted-foreground">
                SendGrid integration
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mail Service</CardTitle>
              {healthStatus && getStatusIcon(healthStatus.services.lob || 'unknown')}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {healthStatus?.services.lob === 'ok' ? 'Active' : 'Error'}
              </div>
              <p className="text-xs text-muted-foreground">
                Lob API integration
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Application Information */}
        {healthStatus && (
          <Card>
            <CardHeader>
              <CardTitle>Application Information</CardTitle>
              <CardDescription>
                Current application status and configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Version</span>
                    <span>{healthStatus.version}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Environment</span>
                    <Badge variant="outline">{process.env.NODE_ENV || 'development'}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Last Check</span>
                    <span>{new Date(healthStatus.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Application Uptime</span>
                    <span>{formatUptime(healthStatus.uptime)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">System Uptime</span>
                    <span>{systemMetrics ? formatUptime(systemMetrics.uptime) : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Node Version</span>
                    <span>{systemMetrics?.nodeVersion || 'N/A'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Platform</span>
                    <span>{systemMetrics?.platform || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Memory (RSS)</span>
                    <span>{systemMetrics ? formatBytes(systemMetrics.memoryUsage.rss) : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Memory (Heap)</span>
                    <span>{systemMetrics ? formatBytes(systemMetrics.memoryUsage.heapUsed) : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* System Performance Metrics */}
        {systemMetrics && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatBytes(systemMetrics.memoryUsage.heapUsed)}</div>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(systemMetrics.memoryUsage.heapTotal)} total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatUptime(systemMetrics.uptime)}</div>
                <p className="text-xs text-muted-foreground">
                  Process uptime
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Node Version</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemMetrics.nodeVersion}</div>
                <p className="text-xs text-muted-foreground">
                  {systemMetrics.platform}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">RSS Memory</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatBytes(systemMetrics.memoryUsage.rss)}</div>
                <p className="text-xs text-muted-foreground">
                  Resident set size
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Service Status Details */}
        {healthStatus && (
          <Card>
            <CardHeader>
              <CardTitle>Service Status Details</CardTitle>
              <CardDescription>
                Detailed status of all integrated services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(healthStatus.services).map(([service, status]) => (
                  <div key={service} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(status)}
                      <span className="font-medium capitalize">{service}</span>
                    </div>
                    <Badge variant={status === 'ok' ? 'default' : 'destructive'}>
                      {status === 'ok' ? 'Operational' : 'Error'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DefaultLayout>
  );
}
