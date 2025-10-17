import React, { useState } from 'react';
import { Row } from "@tanstack/react-table";
import { useNavigate } from 'react-router-dom';
import { Eye, Trash2, MoreHorizontal, Package, CreditCard, Edit2, Copy } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { createMailCheckoutSession } from 'wasp/client/operations';
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
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

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

  const handlePayNow = async () => {
    try {
      setIsProcessingPayment(true);
      // Create Stripe Checkout Session
      const checkoutData = await createMailCheckoutSession({
        mailPieceId: mailPiece.id
      });
      // Redirect to Stripe Checkout
      window.location.href = checkoutData.sessionUrl;
    } catch (error: any) {
      console.error('Payment error:', error);
      alert(error.message || 'Failed to start payment process. Please try again.');
      setIsProcessingPayment(false);
    }
  };

  const handleDuplicate = () => {
    // Navigate to create page with data from this mail piece
    navigate(`/mail/create?duplicate=${mailPiece.id}`);
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
            {/* Primary action based on status */}
            {mailPiece.status === 'pending_payment' ? (
              <Button
                variant="default"
                size="sm"
                onClick={handlePayNow}
                disabled={isProcessingPayment}
              >
                <CreditCard className="h-4 w-4 mr-1" />
                {isProcessingPayment ? 'Processing...' : 'Pay Now'}
              </Button>
            ) : mailPiece.status === 'draft' ? (
              <Button
                variant="default"
                size="sm"
                onClick={handleEdit}
              >
                <Edit2 className="h-4 w-4 mr-1" />
                Complete
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/mail/${mailPiece.id}`)}
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
            )}
            
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
                
                {/* Status-specific actions */}
                {mailPiece.status === 'draft' && (
                  <>
                    <DropdownMenuItem onClick={handleEdit}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit Draft
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                
                {mailPiece.status === 'pending_payment' && (
                  <>
                    <DropdownMenuItem onClick={handlePayNow} disabled={isProcessingPayment}>
                      <CreditCard className="h-4 w-4 mr-2" />
                      {isProcessingPayment ? 'Processing...' : 'Complete Payment'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
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

