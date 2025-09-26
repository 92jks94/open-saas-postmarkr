/**
 * Monitoring Alerts System
 * This module provides comprehensive monitoring and alerting for environment variables
 * and external service health.
 */

import { runAllConnectivityTests, runCriticalConnectivityTests, ConnectivityTestResults } from './apiConnectivityTests';
import { getRequiredEnvironmentVariables, getOptionalEnvironmentVariables, isProduction, isDevelopment } from './envValidation';

export interface AlertLevel {
  level: 'critical' | 'warning' | 'info';
  threshold: number;
}

export interface MonitoringAlert {
  id: string;
  type: 'missing_env_var' | 'api_connectivity' | 'service_degraded' | 'performance';
  level: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  environment: string;
  service?: string;
  details?: any;
  resolved?: boolean;
  resolvedAt?: string;
}

export interface AlertConfiguration {
  enabled: boolean;
  channels: {
    console: boolean;
    webhook?: string;
    email?: string;
    slack?: string;
  };
  thresholds: {
    critical: number;
    warning: number;
    info: number;
  };
  cooldownPeriod: number; // minutes
}

export interface MonitoringDashboard {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  environment: string;
  alerts: MonitoringAlert[];
  environmentVariables: {
    missing: string[];
    configured: string[];
    optional: string[];
  };
  services: {
    healthy: string[];
    unhealthy: string[];
    unknown: string[];
  };
  metrics: {
    uptime: number;
    lastHealthCheck: string;
    alertCount: number;
  };
}

class MonitoringAlertManager {
  private alerts: Map<string, MonitoringAlert> = new Map();
  private lastAlertTimes: Map<string, number> = new Map();
  private config: AlertConfiguration;

  constructor(config: AlertConfiguration) {
    this.config = config;
  }

  /**
   * Checks for missing environment variables and creates alerts
   */
  async checkEnvironmentVariables(): Promise<MonitoringAlert[]> {
    const alerts: MonitoringAlert[] = [];
    const requiredVars = getRequiredEnvironmentVariables();
    const optionalVars = getOptionalEnvironmentVariables();
    
    // Check required variables
    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        const alert = this.createAlert({
          id: `missing_env_${varName}`,
          type: 'missing_env_var',
          level: 'critical',
          title: `Missing Required Environment Variable: ${varName}`,
          message: `The required environment variable ${varName} is not set. This will cause the application to fail.`,
          service: this.getServiceFromVarName(varName),
          details: {
            variableName: varName,
            category: 'required',
            impact: 'application_failure'
          }
        });
        
        if (alert) alerts.push(alert);
      }
    }

    // Check optional variables that are commonly needed
    const criticalOptionalVars = [
      'OPENAI_API_KEY',
      'GOOGLE_ANALYTICS_CLIENT_EMAIL',
      'GOOGLE_ANALYTICS_PRIVATE_KEY',
      'GOOGLE_ANALYTICS_PROPERTY_ID'
    ];

    for (const varName of criticalOptionalVars) {
      if (!process.env[varName]) {
        const alert = this.createAlert({
          id: `missing_optional_env_${varName}`,
          type: 'missing_env_var',
          level: 'warning',
          title: `Missing Optional Environment Variable: ${varName}`,
          message: `The optional environment variable ${varName} is not set. Some features may not work properly.`,
          service: this.getServiceFromVarName(varName),
          details: {
            variableName: varName,
            category: 'optional',
            impact: 'feature_degradation'
          }
        });
        
        if (alert) alerts.push(alert);
      }
    }

    return alerts;
  }

  /**
   * Checks API connectivity and creates alerts
   */
  async checkApiConnectivity(): Promise<MonitoringAlert[]> {
    const alerts: MonitoringAlert[] = [];
    
    try {
      const testResults = await runCriticalConnectivityTests();
      
      for (const result of testResults) {
        if (result.status === 'unhealthy') {
          const alert = this.createAlert({
            id: `api_connectivity_${result.service}`,
            type: 'api_connectivity',
            level: 'critical',
            title: `API Connectivity Issue: ${result.service}`,
            message: `The ${result.service} API is not responding properly: ${result.error}`,
            service: result.service,
            details: {
              responseTime: result.responseTime,
              error: result.error,
              service: result.service
            }
          });
          
          if (alert) alerts.push(alert);
        } else if (result.status === 'unknown') {
          const alert = this.createAlert({
            id: `api_unknown_${result.service}`,
            type: 'service_degraded',
            level: 'warning',
            title: `Service Status Unknown: ${result.service}`,
            message: `Unable to determine the status of ${result.service}: ${result.error}`,
            service: result.service,
            details: {
              responseTime: result.responseTime,
              error: result.error,
              service: result.service
            }
          });
          
          if (alert) alerts.push(alert);
        }
      }
    } catch (error: any) {
      const alert = this.createAlert({
        id: 'api_connectivity_test_failed',
        type: 'api_connectivity',
        level: 'critical',
        title: 'API Connectivity Test Failed',
        message: `Failed to run API connectivity tests: ${error.message}`,
        details: {
          error: error.message,
          stack: error.stack
        }
      });
      
      if (alert) alerts.push(alert);
    }

    return alerts;
  }

  /**
   * Creates an alert if it meets the configuration criteria
   */
  private createAlert(alertData: Omit<MonitoringAlert, 'timestamp' | 'environment'>): MonitoringAlert | null {
    const now = Date.now();
    const lastAlertTime = this.lastAlertTimes.get(alertData.id) || 0;
    const cooldownMs = this.config.cooldownPeriod * 60 * 1000;

    // Check cooldown period
    if (now - lastAlertTime < cooldownMs) {
      return null;
    }

    // Check if alert level is enabled
    if (!this.shouldCreateAlert(alertData.level)) {
      return null;
    }

    const alert: MonitoringAlert = {
      ...alertData,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    };

    this.alerts.set(alertData.id, alert);
    this.lastAlertTimes.set(alertData.id, now);

    // Send alert through configured channels
    this.sendAlert(alert);

    return alert;
  }

  /**
   * Determines if an alert should be created based on level and configuration
   */
  private shouldCreateAlert(level: 'critical' | 'warning' | 'info'): boolean {
    if (!this.config.enabled) return false;
    
    // In development, only show critical alerts
    if (isDevelopment()) {
      return level === 'critical';
    }
    
    // In production, show all levels
    return true;
  }

  /**
   * Sends alert through configured channels
   */
  private sendAlert(alert: MonitoringAlert): void {
    if (this.config.channels.console) {
      this.sendConsoleAlert(alert);
    }

    if (this.config.channels.webhook) {
      this.sendWebhookAlert(alert);
    }

    if (this.config.channels.email) {
      this.sendEmailAlert(alert);
    }

    if (this.config.channels.slack) {
      this.sendSlackAlert(alert);
    }
  }

  /**
   * Sends alert to console
   */
  private sendConsoleAlert(alert: MonitoringAlert): void {
    const emoji = {
      critical: '🚨',
      warning: '⚠️',
      info: 'ℹ️'
    }[alert.level];

    console.log(`${emoji} [${alert.level.toUpperCase()}] ${alert.title}`);
    console.log(`   ${alert.message}`);
    console.log(`   Service: ${alert.service || 'N/A'}`);
    console.log(`   Time: ${alert.timestamp}`);
    console.log('');
  }

  /**
   * Sends alert via webhook
   */
  private async sendWebhookAlert(alert: MonitoringAlert): Promise<void> {
    if (!this.config.channels.webhook) return;

    try {
      await fetch(this.config.channels.webhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `[${alert.level.toUpperCase()}] ${alert.title}`,
          attachments: [{
            color: alert.level === 'critical' ? 'danger' : alert.level === 'warning' ? 'warning' : 'good',
            fields: [
              { title: 'Message', value: alert.message, short: false },
              { title: 'Service', value: alert.service || 'N/A', short: true },
              { title: 'Environment', value: alert.environment, short: true },
              { title: 'Timestamp', value: alert.timestamp, short: true }
            ]
          }]
        })
      });
    } catch (error) {
      console.error('Failed to send webhook alert:', error);
    }
  }

  /**
   * Sends alert via email (placeholder)
   */
  private async sendEmailAlert(alert: MonitoringAlert): Promise<void> {
    // TODO: Implement email alerting
    console.log(`Email alert would be sent: ${alert.title}`);
  }

  /**
   * Sends alert via Slack (placeholder)
   */
  private async sendSlackAlert(alert: MonitoringAlert): Promise<void> {
    // TODO: Implement Slack alerting
    console.log(`Slack alert would be sent: ${alert.title}`);
  }

  /**
   * Gets service name from environment variable name
   */
  private getServiceFromVarName(varName: string): string {
    if (varName.includes('STRIPE')) return 'stripe';
    if (varName.includes('SENDGRID')) return 'sendgrid';
    if (varName.includes('LOB')) return 'lob';
    if (varName.includes('AWS')) return 'aws-s3';
    if (varName.includes('SENTRY')) return 'sentry';
    if (varName.includes('OPENAI')) return 'openai';
    if (varName.includes('GOOGLE_ANALYTICS')) return 'google-analytics';
    return 'core';
  }

  /**
   * Resolves an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  /**
   * Gets all active alerts
   */
  getActiveAlerts(): MonitoringAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * Gets all alerts
   */
  getAllAlerts(): MonitoringAlert[] {
    return Array.from(this.alerts.values());
  }

  /**
   * Clears resolved alerts older than specified days
   */
  clearOldAlerts(daysOld: number = 7): void {
    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    
    for (const [id, alert] of this.alerts.entries()) {
      if (alert.resolved && new Date(alert.timestamp).getTime() < cutoffTime) {
        this.alerts.delete(id);
        this.lastAlertTimes.delete(id);
      }
    }
  }
}

// Default configuration
const defaultConfig: AlertConfiguration = {
  enabled: true,
  channels: {
    console: true,
    webhook: process.env.MONITORING_WEBHOOK_URL,
    email: process.env.MONITORING_EMAIL,
    slack: process.env.MONITORING_SLACK_WEBHOOK
  },
  thresholds: {
    critical: 0,
    warning: 1,
    info: 2
  },
  cooldownPeriod: 5 // 5 minutes
};

// Global alert manager instance
export const alertManager = new MonitoringAlertManager(defaultConfig);

/**
 * Runs comprehensive monitoring checks
 */
export async function runMonitoringChecks(): Promise<MonitoringDashboard> {
  console.log('🔍 Running comprehensive monitoring checks...');
  
  const startTime = Date.now();
  
  // Check environment variables
  const envAlerts = await alertManager.checkEnvironmentVariables();
  
  // Check API connectivity
  const apiAlerts = await alertManager.checkApiConnectivity();
  
  // Get all alerts
  const allAlerts = alertManager.getAllAlerts();
  
  // Determine overall status
  const criticalAlerts = allAlerts.filter(a => a.level === 'critical' && !a.resolved);
  const warningAlerts = allAlerts.filter(a => a.level === 'warning' && !a.resolved);
  
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (criticalAlerts.length > 0) {
    status = 'unhealthy';
  } else if (warningAlerts.length > 0) {
    status = 'degraded';
  }
  
  // Get environment variable status
  const requiredVars = getRequiredEnvironmentVariables();
  const optionalVars = getOptionalEnvironmentVariables();
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  const configuredVars = requiredVars.filter(varName => process.env[varName]);
  const optionalConfiguredVars = optionalVars.filter(varName => process.env[varName]);
  
  // Get service status
  const services = {
    healthy: [] as string[],
    unhealthy: [] as string[],
    unknown: [] as string[]
  };
  
  // Categorize services based on alerts
  allAlerts.forEach(alert => {
    if (alert.service) {
      if (alert.level === 'critical') {
        services.unhealthy.push(alert.service);
      } else if (alert.level === 'warning') {
        services.unknown.push(alert.service);
      } else {
        services.healthy.push(alert.service);
      }
    }
  });
  
  const dashboard: MonitoringDashboard = {
    status,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    alerts: allAlerts,
    environmentVariables: {
      missing: missingVars,
      configured: configuredVars,
      optional: optionalConfiguredVars
    },
    services,
    metrics: {
      uptime: process.uptime(),
      lastHealthCheck: new Date().toISOString(),
      alertCount: allAlerts.length
    }
  };
  
  console.log(`✅ Monitoring checks completed. Status: ${status}`);
  console.log(`   Critical alerts: ${criticalAlerts.length}`);
  console.log(`   Warning alerts: ${warningAlerts.length}`);
  console.log(`   Missing env vars: ${missingVars.length}`);
  
  return dashboard;
}

/**
 * Quick health check for monitoring endpoints
 */
export function quickHealthCheck(): { status: 'ok' | 'error'; alerts: number; timestamp: string } {
  const activeAlerts = alertManager.getActiveAlerts();
  const criticalAlerts = activeAlerts.filter(a => a.level === 'critical');
  
  return {
    status: criticalAlerts.length > 0 ? 'error' : 'ok',
    alerts: activeAlerts.length,
    timestamp: new Date().toISOString()
  };
}
