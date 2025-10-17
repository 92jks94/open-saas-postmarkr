import React, { useState } from 'react';
import { useQuery } from 'wasp/client/operations';
import { debugMailPieces, fixPaidOrders, debugMailPieceStatus } from 'wasp/client/operations';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ScrollArea } from '../components/ui/scroll-area';
import { getStatusColor, getResultStatusColor } from '../shared/statusUtils';

type FixResult = {
  fixedCount: number;
  errorCount: number;
  submittedToLobCount: number;
  results: Array<{
    id: string;
    status: 'fixed' | 'error' | 'submitted_to_lob';
    message: string;
    lobId?: string;
  }>;
};

type DetailedMailPiece = {
  mailPiece: any;
  stripeStatus: any;
  webhookLogs: any[];
};

// Component for detailed mail piece view
function DetailedMailPieceView({ mailPieceId }: { mailPieceId: string }) {
  const [detailedData, setDetailedData] = useState<DetailedMailPiece | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDetailedData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await debugMailPieceStatus({ mailPieceId });
      setDetailedData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load detailed data');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button onClick={loadDetailedData} disabled={isLoading} variant="outline">
        {isLoading ? 'Loading mail details...' : 'Load Detailed Information'}
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {detailedData && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="stripe">Stripe Status</TabsTrigger>
            <TabsTrigger value="lob">Lob Details</TabsTrigger>
            <TabsTrigger value="history">Status History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Mail Piece Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">ID:</span>
                    <p className="font-mono text-sm">{detailedData.mailPiece.id}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">User:</span>
                    <p className="text-sm">{detailedData.mailPiece.user.email || 'No email'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Mail Type:</span>
                    <p className="text-sm">{detailedData.mailPiece.mailType}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Mail Class:</span>
                    <p className="text-sm">{detailedData.mailPiece.mailClass}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Status:</span>
                    <Badge className={getStatusColor(detailedData.mailPiece.status)}>
                      {detailedData.mailPiece.status}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Payment Status:</span>
                    <Badge className={getStatusColor(detailedData.mailPiece.paymentStatus)}>
                      {detailedData.mailPiece.paymentStatus}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Cost:</span>
                    <p className="text-sm">${detailedData.mailPiece.cost || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Customer Price:</span>
                    <p className="text-sm">${detailedData.mailPiece.customerPrice || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stripe" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Stripe Payment Status</CardTitle>
              </CardHeader>
              <CardContent>
                {detailedData.stripeStatus ? (
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-500">Payment Intent ID:</span>
                      <p className="font-mono text-sm">{detailedData.stripeStatus.id}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Status:</span>
                      <Badge className={getStatusColor(detailedData.stripeStatus.status)}>
                        {detailedData.stripeStatus.status}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Amount:</span>
                      <p className="text-sm">${(detailedData.stripeStatus.amount / 100).toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Currency:</span>
                      <p className="text-sm">{detailedData.stripeStatus.currency}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Created:</span>
                      <p className="text-sm">{new Date(detailedData.stripeStatus.created * 1000).toLocaleString()}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No Stripe payment information available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lob" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Lob API Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-500">Lob ID:</span>
                    <p className="font-mono text-sm">{detailedData.mailPiece.lobId || 'Not submitted'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Lob Status:</span>
                    <Badge className={getStatusColor(detailedData.mailPiece.lobStatus || 'unknown')}>
                      {detailedData.mailPiece.lobStatus || 'Unknown'}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Tracking Number:</span>
                    <p className="font-mono text-sm">{detailedData.mailPiece.lobTrackingNumber || 'Not available'}</p>
                  </div>
                  {detailedData.mailPiece.metadata && (
                    <div>
                      <span className="text-sm text-gray-500">Metadata:</span>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                        {JSON.stringify(detailedData.mailPiece.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Status History</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {detailedData.mailPiece.statusHistory.map((history: any, index: number) => (
                      <div key={index} className="border rounded p-3">
                        <div className="flex justify-between items-start mb-2">
                          <Badge className={getStatusColor(history.status)}>
                            {history.status}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(history.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {history.description && (
                          <p className="text-sm text-gray-700 mb-2">{history.description}</p>
                        )}
                        <div className="text-xs text-gray-500">
                          <span>Source: {history.source}</span>
                          {history.previousStatus && (
                            <span className="ml-2">Previous: {history.previousStatus}</span>
                          )}
                        </div>
                        {history.lobData && (
                          <details className="mt-2">
                            <summary className="text-xs text-blue-600 cursor-pointer">Lob Data</summary>
                            <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                              {JSON.stringify(history.lobData, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

export default function DebugMailPage() {
  const [fixResult, setFixResult] = useState<FixResult | null>(null);
  const [isFixing, setIsFixing] = useState(false);
  
  const { data: debugData, isLoading, error, refetch } = useQuery(debugMailPieces, undefined);

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


  // Helper function to detect potential duplicate Lob submissions
  const hasPotentialDuplicateSubmissions = (piece: any) => {
    if (!piece.statusHistory) return false;
    
    const submissionHistory = piece.statusHistory.filter((h: any) => 
      h.status === 'submitted' && h.source === 'system'
    );
    
    return submissionHistory.length > 1;
  };

  // Helper function to get Lob submission count
  const getLobSubmissionCount = (piece: any) => {
    if (!piece.statusHistory) return 0;
    
    return piece.statusHistory.filter((h: any) => 
      h.status === 'submitted' && h.source === 'system'
    ).length;
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
            {debugData?.statusCounts?.map((count: { status: string; count: number }) => (
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
            {debugData?.paymentCounts?.map((count: { paymentStatus: string; count: number }) => (
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
          <CardTitle>Fix & Submit Orders</CardTitle>
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
            This will fix payment status issues and automatically submit paid orders to Lob API for processing.
          </p>
          
          <Button 
            disabled={isFixing}
            className="mb-4 bg-blue-600 hover:bg-blue-700"
            onClick={async () => {
              setIsFixing(true);
              setFixResult(null);
              
              try {
                const result = await fixPaidOrders();
                setFixResult(result);
                refetch();
              } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                setFixResult({
                  fixedCount: 0,
                  errorCount: 1,
                  submittedToLobCount: 0,
                  results: [{ id: 'error', status: 'error', message: errorMessage }],
                });
              } finally {
                setIsFixing(false);
              }
            }}
          >
            {isFixing ? 'Processing Orders...' : 'Fix & Submit Orders'}
          </Button>

          {fixResult && (
            <Alert className="mb-4">
              <AlertDescription>
                Fixed {fixResult.fixedCount} orders. 
                {fixResult.submittedToLobCount > 0 && ` Submitted ${fixResult.submittedToLobCount} orders to Lob.`}
                {fixResult.errorCount > 0 && ` ${fixResult.errorCount} errors occurred.`}
              </AlertDescription>
            </Alert>
          )}

          {fixResult && fixResult.results && fixResult.results.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Detailed Results:</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {fixResult.results.map((result, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex-1">
                      <span className="text-sm font-mono">{result.id.slice(-8)}</span>
                      <span className="text-sm text-gray-600 ml-2">{result.message}</span>
                      {result.lobId && (
                        <span className="text-xs text-blue-600 ml-2">Lob ID: {result.lobId.slice(-8)}</span>
                      )}
                    </div>
                    <Badge className={getResultStatusColor(result.status)}>
                      {result.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
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
            {debugData?.recentMailPieces?.map((piece) => {
              const hasDuplicates = hasPotentialDuplicateSubmissions(piece);
              const submissionCount = getLobSubmissionCount(piece);
              
              return (
                <div key={piece.id} className={`border rounded-lg p-4 ${hasDuplicates ? 'border-orange-300 bg-orange-50' : ''}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">Mail Piece {piece.id.slice(-8)}</h3>
                        {hasDuplicates && (
                          <Badge variant="destructive" className="text-xs">
                            ⚠️ {submissionCount} Lob Submissions
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{piece.user.email || 'No email'}</p>
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
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
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

                  {/* Quick Status History Preview */}
                  {piece.statusHistory.length > 0 && (
                    <div className="mb-3 pt-3 border-t">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm text-gray-500">Recent Status History:</p>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Mail Piece Details - {piece.id.slice(-8)}</DialogTitle>
                            </DialogHeader>
                            <DetailedMailPieceView mailPieceId={piece.id} />
                          </DialogContent>
                        </Dialog>
                      </div>
                      <div className="space-y-1">
                        {piece.statusHistory.slice(0, 3).map((history: any, index: number) => (
                          <div key={index} className="text-xs text-gray-600 flex justify-between">
                            <span>
                              {new Date(history.createdAt).toLocaleString()} - {history.status} 
                              {history.description && ` (${history.description})`}
                            </span>
                            <span className="text-gray-400">{history.source}</span>
                          </div>
                        ))}
                        {piece.statusHistory.length > 3 && (
                          <div className="text-xs text-gray-400 italic">
                            ... and {piece.statusHistory.length - 3} more entries
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Duplicate Submission Warning */}
                  {hasDuplicates && (
                    <Alert className="border-orange-200 bg-orange-50">
                      <AlertDescription className="text-orange-800">
                        ⚠️ This order has been submitted to Lob {submissionCount} times. 
                        This may indicate a duplicate submission issue. Check the detailed view for more information.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
