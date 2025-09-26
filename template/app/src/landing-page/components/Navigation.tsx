import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { useAuth } from 'wasp/client/auth';

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { data: user } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
      isScrolled 
        ? 'bg-background/95 backdrop-blur-sm border-b border-border shadow-sm' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-xl font-bold text-foreground">Postmarkr</h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <button
                onClick={() => scrollToSection('hero')}
                className="text-foreground hover:text-primary transition-colors duration-200"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="text-foreground hover:text-primary transition-colors duration-200"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="text-foreground hover:text-primary transition-colors duration-200"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="text-foreground hover:text-primary transition-colors duration-200"
              >
                Pricing
              </button>
              <button
                onClick={() => scrollToSection('testimonials')}
                className="text-foreground hover:text-primary transition-colors duration-200"
              >
                Reviews
              </button>
              <button
                onClick={() => scrollToSection('faq')}
                className="text-foreground hover:text-primary transition-colors duration-200"
              >
                FAQ
              </button>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <Button variant="outline" asChild>
                <WaspRouterLink to={routes.MailCreationRoute.to}>
                  Send Mail
                </WaspRouterLink>
              </Button>
            ) : (
              <>
                <Button variant="outline" asChild>
                  <WaspRouterLink to={routes.LoginRoute.to}>
                    Sign In
                  </WaspRouterLink>
                </Button>
                <Button asChild>
                  <WaspRouterLink to={routes.SignupRoute.to}>
                    Get Started
                  </WaspRouterLink>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button variant="outline" size="sm" asChild>
              <WaspRouterLink to={user ? routes.MailCreationRoute.to : routes.SignupRoute.to}>
                {user ? 'Send Mail' : 'Get Started'}
              </WaspRouterLink>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
