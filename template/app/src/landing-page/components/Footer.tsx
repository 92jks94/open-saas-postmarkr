import { useAuth } from 'wasp/client/auth';
import logo from '../../client/static/logo.png';
import { SPACING } from '../constants';
import { footerNavigationSignedOut, footerNavigationSignedIn } from '../contentSections';

interface NavigationItem {
  name: string;
  href: string;
}

interface FooterSection {
  [key: string]: NavigationItem[];
}

export default function Footer() {
  const { data: user } = useAuth();
  
  // Choose footer navigation based on auth state
  const footerNav = user ? footerNavigationSignedIn : footerNavigationSignedOut;
  const sections = Object.entries(footerNav);

  return (
    <div className={`mx-auto mt-6 max-w-7xl ${SPACING.CONTAINER_PADDING}`}>
      <footer
        aria-labelledby='footer-heading'
        className={`relative border-t border-border ${SPACING.SECTION_PADDING_LG} sm:mt-32`}
      >
        <h2 id='footer-heading' className='sr-only'>
          Footer
        </h2>

        {/* Logo and Tagline */}
        <div className='mb-12'>
          <div className='flex items-center gap-2 mb-4'>
            <img src={logo} alt='Postmarkr' className='w-10 h-10' />
            <span className='text-xl font-semibold text-foreground'>Postmarkr</span>
          </div>
          <p className='text-sm text-muted-foreground max-w-sm'>
            Professional mail service for modern businesses. Send, track, and manage physical mail from anywhere.
          </p>
        </div>

        <div className='grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-12'>
          {sections.map(([key, items]) => (
            <div key={key}>
              <h3 className='text-base font-semibold leading-6 text-foreground mb-6 capitalize'>
                {key}
              </h3>
              <ul role='list' className='space-y-4'>
                {items.map((item) => (
                  <li key={item.name}>
                    <a
                      href={item.href}
                      className='text-sm leading-6 text-muted-foreground hover:text-foreground transition-colors'
                    >
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {/* Trust Badges */}
        <div className='mt-12 pt-8 border-t border-border'>
          <div className='flex flex-wrap justify-center items-center gap-8 mb-8'>
            {/* Stripe Badge */}
            <div className='flex items-center gap-2 text-muted-foreground'>
              <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24'>
                <path d='M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z'/>
              </svg>
              <span className='text-xs font-medium'>Secured by Stripe</span>
            </div>

            {/* SSL Badge */}
            <div className='flex items-center gap-2 text-muted-foreground'>
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' />
              </svg>
              <span className='text-xs font-medium'>256-bit SSL Encryption</span>
            </div>
          </div>

          <p className='text-sm text-muted-foreground text-center'>
            © {new Date().getFullYear()} Postmarkr. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
