import { routes } from 'wasp/client/router';
import { BlogUrl, DocsUrl } from '../../../shared/common';
const staticNavigationItems = [
    { name: 'Documentation', to: DocsUrl },
    { name: 'Blog', to: BlogUrl },
];
export const marketingNavigationItems = [
    { name: 'Features', to: '/#features' },
    { name: 'Pricing', to: routes.PricingPageRoute.to },
    ...staticNavigationItems,
];
export const demoNavigationitems = [
    { name: 'AI Scheduler', to: routes.DemoAppRoute.to },
    { name: 'File Upload', to: routes.FileUploadRoute.to },
    { name: 'Addresses', to: routes.AddressManagementRoute.to },
    { name: 'Create Mail', to: routes.MailCreationRoute.to },
    { name: 'Mail History', to: routes.MailHistoryRoute.to },
    { name: 'Account', to: routes.AccountRoute.to },
    { name: 'Pricing', to: routes.PricingPageRoute.to },
    ...staticNavigationItems,
];
//# sourceMappingURL=constants.js.map