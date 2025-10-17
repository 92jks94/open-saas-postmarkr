import React from 'react';
import { Button } from '../../components/ui/button';
import { CheckCircle, ChevronUp } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Props for CompactStepCard component
 */
export interface CompactStepCardProps {
  /** Step number (1, 2, 3, 4) */
  stepNumber: number;
  /** Step title */
  title: string;
  /** Summary text shown when collapsed and completed */
  summary?: string;
  /** Icon to display (optional) */
  icon?: React.ReactNode;
  /** Whether step is completed */
  isCompleted: boolean;
  /** Whether step is currently expanded */
  isExpanded: boolean;
  /** Whether step is disabled/grayed out (future step) */
  isDisabled?: boolean;
  /** Callback when card is clicked to expand/collapse */
  onClick: () => void;
  /** Callback for explicit change button click */
  onChangeClick?: () => void;
  /** Children to show when expanded */
  children?: React.ReactNode;
  /** Optional className for customization */
  className?: string;
}

/**
 * CompactStepCard - Collapsible wizard step card component
 * 
 * Features:
 * - Shows compact 1-line summary when completed and collapsed
 * - Full clickable area to expand/collapse
 * - Explicit "Change" button for re-editing
 * - Visual completion indicators (checkmarks, colors)
 * - Step numbering with status indicators
 * - Smooth transitions and animations
 * - Keyboard accessible
 */
export const CompactStepCard: React.FC<CompactStepCardProps> = ({
  stepNumber,
  title,
  summary,
  icon,
  isCompleted,
  isExpanded,
  isDisabled = false,
  onClick,
  onChangeClick,
  children,
  className = ''
}) => {
  // Handle card click (don't trigger if clicking the Change button)
  const handleClick = (e: React.MouseEvent) => {
    // Don't trigger onClick if clicking the Change button or any button inside
    const target = e.target as HTMLElement;
    if (target.closest('button[data-change-btn]')) {
      return;
    }
    onClick();
  };

  // Handle explicit change button click
  const handleChangeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onChangeClick) {
      onChangeClick();
    } else {
      onClick(); // Fallback to expanding the step
    }
  };

  return (
    <div
      className={cn(
        'transition-all duration-200 border-b border-gray-200 last:border-b-0',
        // Expanded state - highlight with blue left border
        isExpanded && 'border-l-4 border-l-blue-500 bg-blue-50/30',
        // Collapsed & completed - subtle gray background, clickable
        !isExpanded && isCompleted && 'hover:bg-gray-50 cursor-pointer',
        // Disabled state - grayed out
        isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        className
      )}
      onClick={!isExpanded && isCompleted && !isDisabled ? handleClick : undefined}
      role="button"
      tabIndex={!isExpanded && isCompleted && !isDisabled ? 0 : -1}
      onKeyPress={(e) => {
        if (!isExpanded && isCompleted && !isDisabled && (e.key === 'Enter' || e.key === ' ')) {
          onClick();
        }
      }}
      aria-expanded={isExpanded}
      aria-disabled={isDisabled}
      aria-label={`Step ${stepNumber}: ${title}${isCompleted ? ' (completed)' : ''}${isDisabled ? ' (disabled)' : ''}`}
    >
      <div className="p-4">
        {/* ============================================ */}
        {/* COLLAPSED & COMPLETED VIEW - Compact 1-line */}
        {/* ============================================ */}
        {!isExpanded && isCompleted && (
          <div className="flex items-center justify-between gap-4">
            {/* Left: Step info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Step Number with Checkmark */}
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" aria-label="Completed" />
                </div>
              </div>

              {/* Optional Icon */}
              {icon && (
                <div className="flex-shrink-0 text-gray-500" aria-hidden="true">
                  {icon}
                </div>
              )}

              {/* Text Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-gray-500">Step {stepNumber}</span>
                  <span className="text-xs text-gray-400" aria-hidden="true">•</span>
                  <span className="text-sm font-semibold text-gray-900">{title}</span>
                </div>
                {summary && (
                  <p className="text-sm text-gray-600 truncate mt-0.5" title={summary}>
                    {summary}
                  </p>
                )}
              </div>
            </div>

            {/* Right: Edit Button */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleChangeClick}
                data-change-btn="true"
                className="min-w-[80px]"
                aria-label={`Edit ${title}`}
              >
                Edit
              </Button>
            </div>
          </div>
        )}

        {/* ======================================== */}
        {/* EXPANDED VIEW - Full content visible */}
        {/* ======================================== */}
        {isExpanded && (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 pb-3 border-b">
              <div className="flex items-center gap-3">
                {/* Step Number/Status Icon */}
                <div className="flex-shrink-0">
                  <div 
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      isCompleted ? "bg-green-100" : "bg-blue-100"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5 text-green-600" aria-label="Completed" />
                    ) : (
                      <span className="text-sm font-semibold text-blue-600">{stepNumber}</span>
                    )}
                  </div>
                </div>
                
                {/* Title */}
                <div>
                  <span className="text-xs font-medium text-gray-500">Step {stepNumber}</span>
                  <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                </div>
              </div>

              {/* Collapse Button (only show if completed) */}
              {isCompleted && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClick}
                  className="flex-shrink-0"
                  aria-label={`Collapse ${title}`}
                >
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Collapse
                </Button>
              )}
            </div>

            {/* Content - The actual form step content */}
            <div>
              {children}
            </div>
          </div>
        )}

        {/* ================================================= */}
        {/* PENDING STATE - Not expanded, not completed yet */}
        {/* ================================================= */}
        {!isExpanded && !isCompleted && (
          <div className="flex items-center gap-3">
            {/* Grayed out step number */}
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-gray-400">{stepNumber}</span>
              </div>
            </div>
            
            {/* Grayed out title */}
            <div>
              <span className="text-xs font-medium text-gray-400">Step {stepNumber}</span>
              <h3 className="text-sm font-medium text-gray-500">{title}</h3>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompactStepCard;

