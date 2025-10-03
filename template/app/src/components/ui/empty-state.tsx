import { ReactNode } from 'react';
import { Button } from './button';
import { Card, CardContent } from './card';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  };
  className?: string;
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  className 
}: EmptyStateProps) {
  return (
    <Card className={cn('border-dashed', className)}>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        {icon && (
          <div className="mb-4 text-muted-foreground">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            {description}
          </p>
        )}
        {action && (
          <Button 
            onClick={action.onClick}
            variant={action.variant || 'default'}
          >
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Common empty state variants
export function EmptyFilesState({ onUpload }: { onUpload: () => void }) {
  return (
    <EmptyState
      title="No files uploaded yet"
      description="Upload your first file to get started with Postmarkr's mail service."
      action={{
        label: 'Upload File',
        onClick: onUpload,
      }}
    />
  );
}

export function EmptyMailState({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      title="No mail pieces yet"
      description="Create your first mail piece to start sending physical mail."
      action={{
        label: 'Create Mail Piece',
        onClick: onCreate,
      }}
    />
  );
}

export function EmptyAddressesState({ onAdd }: { onAdd: () => void }) {
  return (
    <EmptyState
      title="No addresses saved"
      description="Add your first address to make sending mail easier."
      action={{
        label: 'Add Address',
        onClick: onAdd,
      }}
    />
  );
}
