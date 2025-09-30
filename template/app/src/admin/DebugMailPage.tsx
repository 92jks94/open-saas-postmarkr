import React, { useState } from 'react';
import { useQuery } from 'wasp/client/operations';
import { debugMailPieces, fixPaidOrders } from 'wasp/client/operations';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';

export default function DebugMailPage() {
  const [fixResult, setFixResult] = useState<any>(null);
  const [isFixing, setIsFixing] = useState(false);
  
  const { data: debugData, isLoading, error, refetch } = useQuery(debugMailPieces, undefined);

  const handleFixOrders = async () => {
    setIsFixing(true);
    setFixResult(null);
    
    try {
      const result = await fixPaidOrders();
      setFixResult(result);
      // Refetch debug data to show updated state
      refetch();
    } catch (error: any) {
      setFixResult({
        fixedCount: 0,
        errorCount: 1,
        results: [{ status: 'error', message: error.message }]
      });
    } finally {
      setIsFixing(false);
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading debug information...</div>;
  }

  if (error) {
    return (
      <div className="p-8">
        <Alert>
          <AlertDescription>
            Error loading debug information: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Mail Pieces Debug</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Total Mail Pieces</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{debugData?.totalCount || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By Status</CardTitle>
          </CardHeader>
          <CardContent>
          <div className="space-y-2">
            {debugData?.statusCounts?.map((count: any) => (
              <div key={count.status} className="flex justify-between">
                <Badge className={getStatusColor(count.status)}>
                  {count.status}
                </Badge>
                <span className="font-semibold">{count.count}</span>
              </div>
            ))}
          </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
          <div className="space-y-2">
            {debugData?.paymentCounts?.map((count: any) => (
              <div key={count.paymentStatus} className="flex justify-between">
                <Badge className={getStatusColor(count.paymentStatus)}>
                  {count.paymentStatus}
                </Badge>
                <span className="font-semibold">{count.count}</span>
              </div>
            ))}
          </div>
          </CardContent>
        </Card>
      </div>

      {/* Fix Orders Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Fix Paid Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {debugData?.draftWithPaymentCount > 0 ? (
            <Alert className="mb-4 border-orange-200 bg-orange-50">
              <AlertDescription className="text-orange-800">
                ⚠️ Found {debugData.draftWithPaymentCount} orders that are paid but stuck in draft status!
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">
                ✅ No broken orders found. All paid orders have correct status.
              </AlertDescription>
            </Alert>
          )}
          
          <p className="mb-4 text-gray-600">
            This will find orders that have payment intent IDs but are still in draft status and mark them as paid.
          </p>
          
          <Button 
            onClick={handleFixOrders} 
            disabled={isFixing || debugData?.draftWithPaymentCount === 0}
            className="mb-4"
          >
            {isFixing ? 'Fixing Orders...' : `Fix ${debugData?.draftWithPaymentCount || 0} Paid Orders`}
          </Button>

          {fixResult && (
            <Alert className="mb-4">
              <AlertDescription>
                Fixed {fixResult.fixedCount} orders. 
                {fixResult.errorCount > 0 && ` ${fixResult.errorCount} errors occurred.`}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Recent Mail Pieces */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Mail Pieces</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {debugData?.recentMailPieces?.map((piece: any) => (
              <div key={piece.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">Mail Piece {piece.id.slice(-8)}</h3>
                    <p className="text-sm text-gray-600">{piece.user.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getStatusColor(piece.status)}>
                      {piece.status}
                    </Badge>
                    <Badge className={getStatusColor(piece.paymentStatus)}>
                      Payment: {piece.paymentStatus}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <p className="font-medium">{piece.mailType}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <p className="font-medium">
                      {new Date(piece.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Payment Intent:</span>
                    <p className="font-medium text-xs">
                      {piece.paymentIntentId ? `${piece.paymentIntentId.slice(-8)}` : 'None'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Lob ID:</span>
                    <p className="font-medium text-xs">
                      {piece.lobId ? `${piece.lobId.slice(-8)}` : 'None'}
                    </p>
                  </div>
                </div>

                {piece.statusHistory.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-gray-500 mb-2">Recent Status History:</p>
                    <div className="space-y-1">
                      {piece.statusHistory.map((history: any, index: number) => (
                        <div key={index} className="text-xs text-gray-600">
                          {new Date(history.createdAt).toLocaleString()} - {history.status} 
                          {history.description && ` (${history.description})`}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
