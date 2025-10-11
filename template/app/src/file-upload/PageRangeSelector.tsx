import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Card, CardContent, CardTitle } from '../components/ui/card';
import { extractPDFPages } from 'wasp/client/operations';
import { estimateCostFromPages } from './pdfThumbnail';

interface Props {
  file: {
    id: string;
    name: string;
    pageCount: number;
  };
  onExtracted: (extractedFileId: string) => void;
  onCancel: () => void;
}

export function PageRangeSelector({ file, onExtracted, onCancel }: Props) {
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(Math.min(file.pageCount, 5));
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const selectedPageCount = endPage - startPage + 1;
  const costEstimate = estimateCostFromPages(selectedPageCount);
  
  const handleExtract = async () => {
    try {
      setError(null);
      setIsExtracting(true);
      
      // Validate range
      if (startPage < 1 || startPage > file.pageCount) {
        throw new Error('Invalid start page');
      }
      if (endPage < 1 || endPage > file.pageCount) {
        throw new Error('Invalid end page');
      }
      if (startPage > endPage) {
        throw new Error('Start page must be less than or equal to end page');
      }
      if (selectedPageCount > 50) {
        throw new Error('Cannot select more than 50 pages');
      }
      
      const result = await extractPDFPages({
        fileId: file.id,
        startPage,
        endPage
      });
      
      onExtracted(result.extractedFileId);
      
    } catch (err) {
      console.error('Failed to extract pages:', err);
      setError(err instanceof Error ? err.message : 'Failed to extract pages');
    } finally {
      setIsExtracting(false);
    }
  };
  
  return (
    <Card className="border-2 border-primary">
      <CardContent className="pt-6 space-y-4">
        <CardTitle>Select Pages to Mail</CardTitle>
        
        <div className="text-sm text-muted-foreground">
          Document: <span className="font-medium">{file.name}</span> ({file.pageCount} pages total)
        </div>
        
        {/* Page range inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start-page">Start Page</Label>
            <Input
              id="start-page"
              type="number"
              min={1}
              max={file.pageCount}
              value={startPage}
              onChange={(e) => setStartPage(parseInt(e.target.value) || 1)}
              disabled={isExtracting}
            />
          </div>
          <div>
            <Label htmlFor="end-page">End Page</Label>
            <Input
              id="end-page"
              type="number"
              min={1}
              max={file.pageCount}
              value={endPage}
              onChange={(e) => setEndPage(parseInt(e.target.value) || 1)}
              disabled={isExtracting}
            />
          </div>
        </div>
        
        {/* Cost estimate */}
        {costEstimate.warning ? (
          <Alert variant="destructive">
            <AlertDescription>{costEstimate.warning}</AlertDescription>
          </Alert>
        ) : (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">Selected Pages:</span>
              <span className="text-lg font-bold">{selectedPageCount} pages</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Estimated Cost:</span>
              <span className="text-lg font-bold text-green-600">
                ${(costEstimate.price / 100).toFixed(2)}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              Envelope: {costEstimate.envelopeType}
            </div>
          </div>
        )}
        
        {/* Quick select buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setStartPage(1); setEndPage(Math.min(5, file.pageCount)); }}
            disabled={isExtracting}
          >
            First 5 pages
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setStartPage(1); setEndPage(Math.min(10, file.pageCount)); }}
            disabled={isExtracting}
          >
            First 10 pages
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setStartPage(1); setEndPage(file.pageCount); }}
            disabled={isExtracting || file.pageCount > 50}
          >
            All pages {file.pageCount > 50 && '(exceeds limit)'}
          </Button>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel} disabled={isExtracting}>
            Cancel
          </Button>
          <Button 
            onClick={handleExtract} 
            disabled={isExtracting || !!costEstimate.warning}
          >
            {isExtracting ? 'Extracting...' : 'Extract & Continue'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

