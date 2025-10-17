import React, { useState } from 'react';
import { Row } from "@tanstack/react-table";
import { useNavigate } from 'react-router-dom';
import { Eye, Trash2, MoreHorizontal, Edit2, Copy, Download, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import type { MailPieceWithRelations } from '../columns';
import { getSelectionClasses, getCardHoverClasses, openLobDashboard, navigateToDuplicate } from '../../components/ui/selection-utils';
import { getDownloadFileSignedURL } from 'wasp/client/operations';

interface MailPieceCardProps {
  row: Row<MailPieceWithRelations>;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
  onCardClick?: (row: Row<MailPieceWithRelations>) => void;
}

export function MailPieceCard({ row, onDelete, isDeleting, onCardClick }: MailPieceCardProps) {
  const navigate = useNavigate();
  const mailPiece = row.original;
  const visibleCells = row.getVisibleCells();
  const [isDownloading, setIsDownloading] = useState(false);

  // Debug logging for mail piece data
  if (process.env.NODE_ENV === 'development') {
    console.log('[MailPieceCard] Mail piece data:', {
      id: mailPiece.id,
      description: mailPiece.description,
      file: mailPiece.file?.name,
      recipient: mailPiece.recipientAddress?.contactName || mailPiece.recipientAddress?.companyName,
      mailType: mailPiece.mailType
    });
  }

  const handleEdit = () => {
    navigate(`/mail/create?edit=${mailPiece.id}`);
  };

  const handleDelete = () => {
    if (onDelete && window.confirm('Are you sure you want to delete this mail piece? This action cannot be undone.')) {
      onDelete(mailPiece.id);
    }
  };


  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="menuitem"]') || target.closest('a')) {
      return;
    }
    onCardClick?.(row);
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/mail/${mailPiece.id}`);
  };

  const handleDuplicate = () => {
    navigateToDuplicate(navigate, mailPiece.id);
  };

  const handleDownloadFile = async () => {
    if (!mailPiece?.file) return;

    try {
      setIsDownloading(true);
      
      const result = await getDownloadFileSignedURL({ key: mailPiece.file.key });
      
      if (result) {
        window.open(result, '_blank');
      } else {
        throw new Error('Failed to get download URL');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleViewInLobDashboard = () => {
    if (mailPiece.lobId) {
      openLobDashboard(mailPiece.lobId);
    }
  };

  return (
    <Card 
      className={`${getCardHoverClasses()} ${getSelectionClasses(row.getIsSelected())}`}
      onClick={handleCardClick}
    >
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleViewDetails}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                
                {/* Status-specific actions */}
                {mailPiece.status === 'draft' && (
                  <>
                    <DropdownMenuItem onClick={handleEdit}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Complete
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                
                {/* File actions */}
                {mailPiece.file && (
                  <DropdownMenuItem 
                    onClick={handleDownloadFile}
                    disabled={isDownloading}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {isDownloading ? 'Downloading...' : 'Download PDF'}
                  </DropdownMenuItem>
                )}
                
                {/* Lob dashboard link */}
                {mailPiece.lobId && (
                  <DropdownMenuItem onClick={handleViewInLobDashboard}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View in Lob Dashboard
                  </DropdownMenuItem>
                )}
                
                {/* Common actions */}
                <DropdownMenuItem onClick={handleDuplicate}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                
                {/* Delete only for drafts */}
                {mailPiece.status === 'draft' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </DropdownMenuItem>
                  </>
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

