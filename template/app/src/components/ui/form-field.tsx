import { ReactNode } from 'react';
import { Label } from './label';
import { cn } from '../../lib/utils';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
  className?: string;
  helpText?: string;
}

export function FormField({ 
  label, 
  required = false, 
  error, 
  children, 
  className,
  helpText 
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label className={cn('text-sm font-medium', error && 'text-destructive')}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      {helpText && !error && (
        <p className="text-sm text-muted-foreground">{helpText}</p>
      )}
    </div>
  );
}

interface FormSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function FormSection({ title, children, className }: FormSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className='flex items-center gap-2'>
        <div className='h-px bg-border flex-1'></div>
        <span className='text-sm font-medium text-muted-foreground px-3'>{title}</span>
        <div className='h-px bg-border flex-1'></div>
      </div>
      {children}
    </div>
  );
}
