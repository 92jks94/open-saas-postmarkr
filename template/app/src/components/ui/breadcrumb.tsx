import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
}

export function Breadcrumb({ items, className, showHome = true }: BreadcrumbProps) {
  return (
    <nav className={cn('flex', className)} aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3 overflow-x-auto">
        {showHome && (
          <li className="inline-flex items-center flex-shrink-0">
            <Link
              to="/"
              className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors min-h-[44px] px-2 rounded"
            >
              <Home className="w-4 h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Home</span>
            </Link>
          </li>
        )}
        {items.map((item, index) => (
          <li key={index} className="flex-shrink-0">
            <div className="flex items-center">
              <ChevronRight className="w-4 h-4 text-muted-foreground mx-1 flex-shrink-0" />
              {item.href && !item.current ? (
                <Link
                  to={item.href}
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors min-h-[44px] px-2 rounded flex items-center"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    'text-sm font-medium min-h-[44px] px-2 rounded flex items-center',
                    item.current
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  )}
                  aria-current={item.current ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}

// Utility function to generate breadcrumbs from current path
export function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];
  
  let currentPath = '';
  
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;
    
    // Convert segment to readable label
    const label = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    breadcrumbs.push({
      label,
      href: isLast ? undefined : currentPath,
      current: isLast,
    });
  });
  
  return breadcrumbs;
}
