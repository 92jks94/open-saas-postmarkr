import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightBlog from 'starlight-blog';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://blog.postmarkr.com',
  trailingSlash: 'always',
  // Performance optimizations
  compress: true,
  build: {
    inlineStylesheets: 'auto',
    assets: '_astro',
  },
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        limitInputPixels: false,
      },
    },
  },
  vite: {
    build: {
      cssCodeSplit: false,
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    },
  },
  integrations: [
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      // Customize sitemap generation
      filter: (page) => {
        // Include all pages by default
        return true;
      },
      // Set different priorities based on page type
      customPages: [],
      serialize: (item) => {
        // Boost priority for blog posts
        if (item.url.includes('/blog/2')) {
          item.priority = 0.9;
          item.changefreq = 'monthly';
        }
        // Increase priority for tag and author pages to encourage indexing
        // These are valuable for site structure and internal linking
        else if (item.url.includes('/blog/tags/') || item.url.includes('/blog/authors/')) {
          item.priority = 0.7; // Increased from 0.5
          item.changefreq = 'weekly'; // More frequent than blog posts
        }
        // Main pages and guides
        else if (item.url.includes('/guides/')) {
          item.priority = 0.8;
          item.changefreq = 'monthly';
        }
        return item;
      },
    }),
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
        Head: './src/components/HeadWithOGImage.astro',
        PageTitle: './src/components/TitleWithBannerImage.astro',
        Header: './src/components/MyHeader.astro',
      },
      social: [],
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
