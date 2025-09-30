import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightBlog from 'starlight-blog';

import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  site: 'https://blog.postmarkr.com',
  trailingSlash: 'always',
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
        ThemeSelect: './src/components/MyThemeSelect.astro',
        Head: './src/components/HeadWithOGImage.astro',
        PageTitle: './src/components/TitleWithBannerImage.astro',
      },
      social: {
        github: 'https://github.com/wasp-lang/open-saas-postmarkr',
        twitter: 'https://twitter.com/postmarkr',
        linkedin: 'https://linkedin.com/company/postmarkr',
      },
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
      ],
      plugins: [
        starlightBlog({
          title: 'Postmarkr Blog',
          customCss: ['./src/styles/tailwind.css'],
          authors: {
            'Postmarkr Team': {
              name: 'Postmarkr Team',
              title: 'Mail Service Experts',
              picture: '/postmarkr-team.png', // Professional team photo
              url: 'https://postmarkr.com',
            },
          },
        }),
      ],
    }),
    tailwind({ applyBaseStyles: false }),
  ],
});
