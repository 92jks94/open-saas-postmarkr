interface NavigationItem {
  name: string;
  href: string;
};

export default function Footer({ footerNavigation }: {
  footerNavigation: {
    app: NavigationItem[]
    company: NavigationItem[]
  }
}) {
  return (
    <div className='mx-auto mt-6 max-w-7xl px-6 lg:px-8'>
      <footer
        aria-labelledby='footer-heading'
        className='relative border-t border-border py-24 sm:mt-32'
      >
        <h2 id='footer-heading' className='sr-only'>
          Footer
        </h2>
        <div className='flex flex-col sm:flex-row items-start justify-center sm:justify-end mt-10 gap-8 sm:gap-12 lg:gap-20'>
          <div>
            <h3 className='text-sm font-semibold leading-6 text-foreground'>App</h3>
            <ul role='list' className='mt-6 space-y-4'>
              {footerNavigation.app.map((item) => (
                <li key={item.name}>
                  <a href={item.href} className='text-sm leading-6 text-muted-foreground hover:text-foreground'>
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className='text-sm font-semibold leading-6 text-foreground'>Company</h3>
            <ul role='list' className='mt-6 space-y-4'>
              {footerNavigation.company.map((item) => (
                <li key={item.name}>
                  <a href={item.href} className='text-sm leading-6 text-muted-foreground hover:text-foreground'>
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </footer>
    </div>
  )
}
