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
      description: 'Expert guides on virtual mailboxes, certified mail, digital mail services, and remote business mail solutions. Tips and best practices from Postmarkr mail service professionals.',
      logo: {
        src: '/src/assets/logo.png',
        alt: 'Postmarkr',
      },
      defaultLocale: 'root',
      locales: {
        root: {
          label: 'English',
          lang: 'en',
        },
      },
      head: [
        // Google Analytics - uses environment variable
        {
          tag: 'script',
          attrs: {
            src: `https://www.googletagmanager.com/gtag/js?id=${process.env.GOOGLE_ANALYTICS_ID || 'G-6H2SB3GJDW'}`,
          },
        },
        {
          tag: 'script',
          content: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
        
          gtag('config', '${process.env.GOOGLE_ANALYTICS_ID || 'G-6H2SB3GJDW'}');
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
        {
          label: 'Blog Posts',
          items: [
            {
              label: 'All Posts',
              link: '/blog/',
            },
          ],
        },
      ],
      plugins: [
        starlightBlog({
          title: 'Postmarkr Blog',
          authors: {
            'Postmarkr Team': {
              name: 'Postmarkr Team',
              title: 'Mail Service Experts',
              picture: '/postmarkr-team.png',
              url: 'https://postmarkr.com',
            },
          },
        }),
      ],
    }),
    tailwind({ applyBaseStyles: false }),
  ],
});
