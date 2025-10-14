import logo from '../../client/static/logo.png';

interface NavigationItem {
  name: string;
  href: string;
}

export default function Footer({
  footerNavigation,
}: {
  footerNavigation: {
    app: NavigationItem[];
    company: NavigationItem[];
  };
}) {
  return (
    <div className='mx-auto mt-6 max-w-7xl px-4 md:px-6 lg:px-8'>
      <footer
        aria-labelledby='footer-heading'
        className='relative border-t border-border py-16 md:py-20 sm:mt-32'
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
          <div>
            <h3 className='text-base font-semibold leading-6 text-foreground mb-6'>App</h3>
            <ul role='list' className='space-y-4'>
              {footerNavigation.app.map((item) => (
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
          <div>
            <h3 className='text-base font-semibold leading-6 text-foreground mb-6'>Company</h3>
            <ul role='list' className='space-y-4'>
              {footerNavigation.company.map((item) => (
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
          <div>
            <h3 className='text-base font-semibold leading-6 text-foreground mb-6'>Connect</h3>
            <ul role='list' className='space-y-4'>
              <li>
                <a
                  href='mailto:support@postmarkr.com'
                  className='text-sm leading-6 text-muted-foreground hover:text-foreground transition-colors'
                >
                  Support
                </a>
              </li>
              <li>
                <a
                  href='mailto:hello@postmarkr.com'
                  className='text-sm leading-6 text-muted-foreground hover:text-foreground transition-colors'
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className='mt-12 pt-8 border-t border-border'>
          <p className='text-sm text-muted-foreground text-center'>
            © {new Date().getFullYear()} Postmarkr. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
