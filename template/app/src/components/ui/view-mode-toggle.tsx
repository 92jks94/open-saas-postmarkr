import * as React from "react";
import { LayoutGrid, Table } from "lucide-react";
import { Button } from "./button";
import { cn } from "../../lib/utils";

export type ViewMode = 'table' | 'cards';

interface ViewModeToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
}

export function ViewModeToggle({ value, onChange, className }: ViewModeToggleProps) {
  return (
    <div className={cn("flex items-center gap-1 rounded-md border border-border p-1", className)}>
      <Button
        variant={value === 'table' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => onChange('table')}
        className="h-7 px-2"
        aria-label="Table view"
        title="Table view"
      >
        <Table className="h-4 w-4" aria-hidden="true" />
        <span className="ml-1 hidden sm:inline">Table</span>
      </Button>
      <Button
        variant={value === 'cards' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => onChange('cards')}
        className="h-7 px-2"
        aria-label="Cards view"
        title="Cards view"
      >
        <LayoutGrid className="h-4 w-4" aria-hidden="true" />
        <span className="ml-1 hidden sm:inline">Cards</span>
      </Button>
    </div>
  );
}

