import { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './button';
import { Breadcrumb, BreadcrumbItem } from './breadcrumb';

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  showBackButton?: boolean;
  backButtonText?: string;
  backButtonHref?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  showBackButton = false,
  backButtonText = 'Back',
  backButtonHref,
  actions,
  className,
}: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBackClick = () => {
    if (backButtonHref) {
      navigate(backButtonHref);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={`space-y-4 ${className || ''}`}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb items={breadcrumbs} />
      )}
      
      {showBackButton && (
        <Button
          variant="ghost"
          onClick={handleBackClick}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {backButtonText}
        </Button>
      )}
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground mt-2">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
