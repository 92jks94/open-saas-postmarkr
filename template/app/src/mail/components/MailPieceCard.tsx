import React from 'react';
import { Row } from "@tanstack/react-table";
import { useNavigate } from 'react-router-dom';
import { Eye, Trash2, MoreHorizontal, Package } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import type { MailPieceWithRelations } from '../columns';

interface MailPieceCardProps {
  row: Row<MailPieceWithRelations>;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
}

export function MailPieceCard({ row, onDelete, isDeleting }: MailPieceCardProps) {
  const navigate = useNavigate();
  const mailPiece = row.original;
  const visibleCells = row.getVisibleCells();

  const handleEdit = () => {
    navigate(`/mail/create?edit=${mailPiece.id}`);
  };

  const handleDelete = () => {
    if (onDelete && window.confirm('Are you sure you want to delete this mail piece? This action cannot be undone.')) {
      onDelete(mailPiece.id);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            {visibleCells
              .filter(cell => ['description', 'status'].includes(cell.column.id))
              .map(cell => (
                <div key={cell.id} className="mb-2">
                  {cell.column.columnDef.cell 
                    ? typeof cell.column.columnDef.cell === 'function'
                      ? cell.column.columnDef.cell(cell.getContext())
                      : cell.column.columnDef.cell
                    : null}
                </div>
              ))}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/mail/${mailPiece.id}`)}
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate(`/mail/${mailPiece.id}`)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                {mailPiece.status === 'draft' && (
                  <DropdownMenuItem onClick={handleEdit}>
                    <Package className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {mailPiece.status === 'draft' && (
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          {visibleCells
            .filter(cell => !['description', 'status', 'actions'].includes(cell.column.id))
            .map(cell => {
              const header = cell.column.columnDef.header;
              const headerText = typeof header === 'string' ? header : cell.column.id;
              
              return (
                <div key={cell.id} className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase">
                    {headerText}
                  </span>
                  <div>
                    {cell.column.columnDef.cell 
                      ? typeof cell.column.columnDef.cell === 'function'
                        ? cell.column.columnDef.cell(cell.getContext())
                        : cell.column.columnDef.cell
                      : null}
                  </div>
                </div>
              );
            })}
        </div>
      </CardContent>
    </Card>
  );
}

