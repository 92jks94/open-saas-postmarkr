import * as React from "react";
import { Row, flexRender } from "@tanstack/react-table";
import { Card, CardContent } from "./card";
import { cn } from "../../lib/utils";

interface CardRendererProps<TData> {
  row: Row<TData>;
  className?: string;
  onClick?: (data: TData) => void;
}

/**
 * Generic card renderer for TanStack Table rows
 * Uses flexRender to display visible cells in a card layout
 */
export function CardRenderer<TData>({ 
  row, 
  className,
  onClick 
}: CardRendererProps<TData>) {
  const visibleCells = row.getVisibleCells();

  return (
    <Card 
      className={cn(
        "hover:shadow-md transition-shadow",
        onClick && "cursor-pointer",
        className
      )}
      onClick={() => onClick?.(row.original)}
    >
      <CardContent className="p-6">
        <div className="grid grid-cols-1 gap-3">
          {visibleCells.map((cell) => {
            const columnDef = cell.column.columnDef;
            const header = columnDef.header;
            
            // Skip rendering if this is an actions column or has no header
            if (cell.column.id === 'actions' || !header) {
              return (
                <div key={cell.id} className="flex justify-end">
                  {flexRender(columnDef.cell, cell.getContext())}
                </div>
              );
            }

            // Get header text
            const headerText = typeof header === 'string' 
              ? header 
              : typeof header === 'function'
              ? cell.column.id
              : cell.column.id;

            return (
              <div key={cell.id} className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground uppercase">
                  {headerText}
                </span>
                <div>
                  {flexRender(columnDef.cell, cell.getContext())}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact card renderer - displays fields inline
 */
export function CompactCardRenderer<TData>({ 
  row, 
  className,
  onClick 
}: CardRendererProps<TData>) {
  const visibleCells = row.getVisibleCells();

  return (
    <Card 
      className={cn(
        "hover:shadow-md transition-shadow",
        onClick && "cursor-pointer",
        className
      )}
      onClick={() => onClick?.(row.original)}
    >
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {visibleCells.map((cell) => {
            const columnDef = cell.column.columnDef;
            const header = columnDef.header;
            
            // Actions column gets special treatment
            if (cell.column.id === 'actions') {
              return (
                <div key={cell.id} className="ml-auto">
                  {flexRender(columnDef.cell, cell.getContext())}
                </div>
              );
            }

            // Get header text
            const headerText = typeof header === 'string' 
              ? header 
              : typeof header === 'function'
              ? cell.column.id
              : cell.column.id;

            return (
              <div key={cell.id} className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {headerText}:
                </span>
                <div>
                  {flexRender(columnDef.cell, cell.getContext())}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

