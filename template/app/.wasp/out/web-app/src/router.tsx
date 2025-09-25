import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from '../../../../src/client/App'

import createAuthRequiredPage from "./auth/pages/createAuthRequiredPage"

import LandingPage from '../../../../src/landing-page/LandingPage'
import LoginPage from '../../../../src/auth/LoginPage'
import SignupPage from '../../../../src/auth/SignupPage'
import RequestPasswordResetPage from '../../../../src/auth/email-and-pass/RequestPasswordResetPage'
import PasswordResetPage from '../../../../src/auth/email-and-pass/PasswordResetPage'
import EmailVerificationPage from '../../../../src/auth/email-and-pass/EmailVerificationPage'
import AccountPage from '../../../../src/user/AccountPage'
import DemoAppPage from '../../../../src/demo-ai-app/DemoAppPage'
import PricingPage from '../../../../src/payment/PricingPage'
import CheckoutResultPage from '../../../../src/payment/CheckoutResultPage'
import MailCheckoutResultPage from '../../../../src/mail/MailCheckoutResultPage'
import FileUploadPage from '../../../../src/file-upload/FileUploadPage'
import AddressManagementPage from '../../../../src/address-management/AddressManagementPage'
import AnalyticsDashboardPage from '../../../../src/admin/dashboards/analytics/AnalyticsDashboardPage'
import AdminUsersPage from '../../../../src/admin/dashboards/users/UsersDashboardPage'
import AdminSettingsPage from '../../../../src/admin/elements/settings/SettingsPage'
import AdminCalendarPage from '../../../../src/admin/elements/calendar/CalendarPage'
import AdminUIButtonsPage from '../../../../src/admin/elements/ui-elements/ButtonsPage'
import SentryTestPage from '../../../../src/client/SentryTestPage'
import NotFoundPage from '../../../../src/client/components/NotFoundPage'
import MailCreationPage from '../../../../src/mail/MailCreationPage'
import MailHistoryPage from '../../../../src/mail/MailHistoryPage'
import MailDetailsPage from '../../../../src/mail/MailDetailsPage'
import AdminMessagesPage from '../../../../src/admin/dashboards/messages/MessagesPage'


import { DefaultRootErrorBoundary } from './components/DefaultRootErrorBoundary'

import { routes } from 'wasp/client/router'

export const routeNameToRouteComponent = {
  LandingPageRoute: LandingPage,
  LoginRoute: LoginPage,
  SignupRoute: SignupPage,
  RequestPasswordResetRoute: RequestPasswordResetPage,
  PasswordResetRoute: PasswordResetPage,
  EmailVerificationRoute: EmailVerificationPage,
  AccountRoute: createAuthRequiredPage(AccountPage),
  DemoAppRoute: createAuthRequiredPage(DemoAppPage),
  PricingPageRoute: PricingPage,
  CheckoutResultRoute: createAuthRequiredPage(CheckoutResultPage),
  MailCheckoutResultRoute: createAuthRequiredPage(MailCheckoutResultPage),
  FileUploadRoute: createAuthRequiredPage(FileUploadPage),
  AddressManagementRoute: createAuthRequiredPage(AddressManagementPage),
  AdminRoute: createAuthRequiredPage(AnalyticsDashboardPage),
  AdminUsersRoute: createAuthRequiredPage(AdminUsersPage),
  AdminSettingsRoute: createAuthRequiredPage(AdminSettingsPage),
  AdminCalendarRoute: createAuthRequiredPage(AdminCalendarPage),
  AdminUIButtonsRoute: createAuthRequiredPage(AdminUIButtonsPage),
  SentryTestRoute: SentryTestPage,
  NotFoundRoute: NotFoundPage,
  MailCreationRoute: createAuthRequiredPage(MailCreationPage),
  MailHistoryRoute: createAuthRequiredPage(MailHistoryPage),
  MailDetailsRoute: createAuthRequiredPage(MailDetailsPage),
  AdminMessagesRoute: createAuthRequiredPage(AdminMessagesPage),
} as const;

const waspDefinedRoutes = [
]
const userDefinedRoutes = Object.entries(routes).map(([routeKey, route]) => {
  return {
    path: route.to,
    Component: routeNameToRouteComponent[routeKey],
  }
})

const browserRouter = createBrowserRouter([{
  path: '/',
  element: <App />,
  ErrorBoundary: DefaultRootErrorBoundary,
  children: [
    ...waspDefinedRoutes,
    ...userDefinedRoutes,
  ],
}])

export const router = <RouterProvider router={browserRouter} />
