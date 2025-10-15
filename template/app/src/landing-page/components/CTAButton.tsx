import { ArrowRight } from 'lucide-react';
import { Link as WaspRouterLink } from 'wasp/client/router';
import { Button } from '../../components/ui/button';

// Define the allowed route paths based on main.wasp
type AllowedRoute = 
  | "/"
  | "/login" 
  | "/signup" 
  | "/request-password-reset" 
  | "/password-reset" 
  | "/email-verification" 
  | "/account" 
  | "/demo-app" 
  | "/checkout" 
  | "/mail/checkout" 
  | "/file-upload" 
  | "/addresses" 
  | "/admin" 
  | "/admin/users" 
  | "/admin/settings" 
  | "/admin/app-settings" 
  | "/admin/debug-mail" 
  | "/admin/monitoring" 
  | "/admin/calendar" 
  | "/admin/ui/buttons" 
  | "/sentry-test" 
  | "/privacy" 
  | "/terms" 
  | "/mail/create" 
  | "/mail/history" 
  | "/admin/messages";

interface CTAButtonProps {
  href: AllowedRoute;
  children: React.ReactNode;
  variant?: 'primary' | 'outline';
  className?: string;
}

export default function CTAButton({
  href,
  children,
  variant = 'primary',
  className = ''
}: CTAButtonProps) {
  const baseClasses = 'text-base md:text-lg px-8 py-6 shadow-glow hover:shadow-glow hover:scale-105 transition-all';
  
  const variantClasses = variant === 'primary'
    ? 'bg-gradient-primary border-0'
    : 'hover:bg-primary/5 border-primary/20';

  return (
    <Button
      size='lg'
      className={`${baseClasses} ${variantClasses} ${className}`}
      asChild
    >
      <WaspRouterLink to={href as any} className='inline-flex items-center'>
        {children}
        <ArrowRight className='ml-2 h-5 w-5' />
      </WaspRouterLink>
    </Button>
  );
}
