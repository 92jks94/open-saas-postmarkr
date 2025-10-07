import { routes } from 'wasp/client/router';
import { BlogUrl, DocsUrl } from '../../../shared/common';
import type { NavigationItem } from './NavBar';

const staticNavigationItems: NavigationItem[] = [
  { name: 'Documentation', to: DocsUrl },
  { name: 'Blog', to: BlogUrl },
];

export const marketingNavigationItems: NavigationItem[] = [
  { name: 'Features', to: '/#features' },
  { name: 'Pricing', to: '/#pricing' },
  { name: 'Testimonials', to: '/#testimonials' },
  { name: 'FAQ', to: '/#faq' },
  { name: 'Blog', to: BlogUrl },
  { name: 'Sign In', to: routes.LoginRoute.to },
] as const;

export const demoNavigationitems: NavigationItem[] = [
  { name: 'Send Mail', to: routes.MailCreationRoute.to },
  { name: 'Mail History', to: routes.MailHistoryRoute.to },
  { name: 'Addresses', to: routes.AddressManagementRoute.to },
  { name: 'Upload Files', to: routes.FileUploadRoute.to },
  { name: 'Blog', to: BlogUrl },
] as const;

export const adminNavigationItems: NavigationItem[] = [
  { name: 'Send Mail', to: routes.MailCreationRoute.to },
  { name: 'Mail History', to: routes.MailHistoryRoute.to },
  { name: 'Addresses', to: routes.AddressManagementRoute.to },
  { name: 'Admin', to: '/admin' },
  { name: 'Blog', to: BlogUrl },
] as const;
