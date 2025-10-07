import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightBlog from 'starlight-blog';

import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  site: 'https://blog.postmarkr.com',
  trailingSlash: 'always',
  redirects: {
    // Redirect .md URLs to clean URLs
    '/blog/2025-11-19-secure-mail-without-po-box.md/': '/blog/2025-11-19-secure-mail-without-po-box/',
    '/blog/2025-10-14-digital-mail-vs-virtual-mailbox.md/': '/blog/2025-10-14-digital-mail-vs-virtual-mailbox/',
    '/blog/2025-09-03-digital-mailbox-home-business.md/': '/blog/2025-09-03-digital-mailbox-home-business/',
    '/blog/2025-08-09-digital-mailroom.md/': '/blog/2025-08-09-digital-mailroom/',
    '/blog/2025-07-30-professional-business-address.md/': '/blog/2025-07-30-professional-business-address/',
    '/blog/2025-07-21-bypass-the-post-office.md/': '/blog/2025-07-21-bypass-the-post-office/',
    '/blog/2025-06-12-mail-without-printer.md/': '/blog/2025-06-12-mail-without-printer/',
    '/blog/2025-06-07-certified-mail-made-easy.md/': '/blog/2025-06-07-certified-mail-made-easy/',
    '/blog/2025-05-07-send-mail-without-home-address.md/': '/blog/2025-05-07-send-mail-without-home-address/',
    '/blog/2025-04-18-virtual-mailbox-vs-po-box.md/': '/blog/2025-04-18-virtual-mailbox-vs-po-box/',
    '/blog/2025-03-18-hidden-costs-of-diy-mailing.md/': '/blog/2025-03-18-hidden-costs-of-diy-mailing/',
    '/blog/2025-02-11-forward-business-mail.md/': '/blog/2025-02-11-forward-business-mail/',
    '/blog/2025-01-24-future-of-business-mail.md/': '/blog/2025-01-24-future-of-business-mail/',
    '/blog/2024-02-05-delivery-tracking-guide.md/': '/blog/2024-02-05-delivery-tracking-guide/',
    '/blog/2024-01-29-address-management-best-practices.md/': '/blog/2024-01-29-address-management-best-practices/',
    '/blog/2024-01-22-mail-service-types-guide.md/': '/blog/2024-01-22-mail-service-types-guide/',
    '/blog/2024-01-15-future-of-business-mail.md/': '/blog/2024-01-15-future-of-business-mail/',
  },
  integrations: [
    starlight({
      title: 'Postmarkr Blog',
      customCss: ['./src/styles/tailwind.css'],
      description: 'Professional mail service insights, tips, and industry updates from Postmarkr.',
      logo: {
        src: '/src/assets/logo.webp',
        alt: 'Postmarkr',
      },
      head: [
        // Google Analytics - uses same environment variable as main website
        {
          tag: 'script',
          attrs: {
            src: 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX',
          },
        },
        {
          tag: 'script',
          content: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
        
          gtag('config', 'G-XXXXXXXXXX');
          `,
        },
      ],
      editLink: {
        baseUrl: 'https://github.com/wasp-lang/open-saas-postmarkr/tree/main/template/app/blog',
      },
      components: {
        SiteTitle: './src/components/MyHeader.astro',
        Head: './src/components/HeadWithOGImage.astro',
        PageTitle: './src/components/TitleWithBannerImage.astro',
      },
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/wasp-lang/open-saas-postmarkr',
        },
        {
          icon: 'twitter',
          label: 'Twitter',
          href: 'https://twitter.com/postmarkr',
        },
        {
          icon: 'linkedin',
          label: 'LinkedIn',
          href: 'https://linkedin.com/company/postmarkr',
        },
      ],
      sidebar: [
        {
          label: 'Start Here',
          items: [
            {
              label: 'Introduction',
              link: '/',
            },
          ],
        },
        {
          label: 'Mail Service Guides',
          items: [
            {
              label: 'Mail Types Explained',
              link: '/guides/mail-types/',
            },
            {
              label: 'Address Management',
              link: '/guides/address-management/',
            },
            {
              label: 'Delivery Tracking',
              link: '/guides/delivery-tracking/',
            },
          ],
        },
        {
          label: 'Blog Posts',
          items: [
            {
              label: 'All Posts',
              link: '/blog/',
            },
            {
              label: 'Certified Mail Made Easy',
              link: '/blog/2025-06-07-certified-mail-made-easy/',
            },
            {
              label: 'Mail Without Printer',
              link: '/blog/2025-06-12-mail-without-printer/',
            },
            {
              label: 'Bypass the Post Office',
              link: '/blog/2025-07-21-bypass-the-post-office/',
            },
            {
              label: 'Professional Business Address',
              link: '/blog/2025-07-30-professional-business-address/',
            },
            {
              label: 'Digital Mailroom',
              link: '/blog/2025-08-09-digital-mailroom/',
            },
            {
              label: 'Digital Mailbox for Home Business',
              link: '/blog/2025-09-03-digital-mailbox-home-business/',
            },
            {
              label: 'Digital Mail vs Virtual Mailbox',
              link: '/blog/2025-10-14-digital-mail-vs-virtual-mailbox/',
            },
            {
              label: 'Secure Mail Without PO Box',
              link: '/blog/2025-11-19-secure-mail-without-po-box/',
            },
            {
              label: 'Forward Business Mail',
              link: '/blog/2025-02-11-forward-business-mail/',
            },
            {
              label: 'Hidden Costs of DIY Mailing',
              link: '/blog/2025-03-18-hidden-costs-of-diy-mailing/',
            },
            {
              label: 'Virtual Mailbox vs PO Box',
              link: '/blog/2025-04-18-virtual-mailbox-vs-po-box/',
            },
            {
              label: 'Send Mail Without Home Address',
              link: '/blog/2025-05-07-send-mail-without-home-address/',
            },
            {
              label: 'Future of Business Mail (2025)',
              link: '/blog/2025-01-24-future-of-business-mail/',
            },
            {
              label: 'Future of Business Mail (2024)',
              link: '/blog/2024-01-15-future-of-business-mail/',
            },
            {
              label: 'Mail Service Types Guide',
              link: '/blog/2024-01-22-mail-service-types-guide/',
            },
            {
              label: 'Address Management Best Practices',
              link: '/blog/2024-01-29-address-management-best-practices/',
            },
            {
              label: 'Delivery Tracking Guide',
              link: '/blog/2024-02-05-delivery-tracking-guide/',
            },
          ],
        },
      ],
      plugins: [
        starlightBlog({
          title: 'Postmarkr Blog',
          customCss: ['./src/styles/tailwind.css'],
          authors: {
            'Postmarkr Team': {
              name: 'Postmarkr Team',
              title: 'Mail Service Experts',
              picture: '/postmarkr-team.png',
              url: 'https://postmarkr.com',
            },
          },
          blogConfig: {
            blogDir: 'blog',
            blogTitle: 'Blog Posts',
            blogDescription: 'Latest insights and guides from Postmarkr',
            postsPerPage: 10,
            showReadingTime: true,
            showDate: true,
            showAuthor: true,
          },
        }),
      ],
    }),
    tailwind({ applyBaseStyles: false }),
  ],
});
