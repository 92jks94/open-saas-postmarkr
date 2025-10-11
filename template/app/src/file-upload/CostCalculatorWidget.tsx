import { useState } from 'react';
import { Card, CardContent, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { estimateCostFromPages } from './pdfThumbnail';

/**
 * Phase 4: Standalone cost calculator widget for the upload page
 * Allows users to estimate mail costs before uploading files
 */
export function CostCalculatorWidget() {
  const [pageCount, setPageCount] = useState(5);
  
  const costEstimate = estimateCostFromPages(pageCount);
  
  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2">
      <CardContent className="pt-6 space-y-4">
        <CardTitle className="flex items-center gap-2">
          💰 Pricing Calculator
        </CardTitle>
        
        <div className="space-y-2">
          <Label htmlFor="calc-pages">Number of Pages</Label>
          <Input
            id="calc-pages"
            type="number"
            min={1}
            max={50}
            value={pageCount}
            onChange={(e) => setPageCount(parseInt(e.target.value) || 1)}
            className="text-lg font-semibold"
          />
        </div>
        
        {costEstimate.warning ? (
          <div className="text-red-600 font-medium">
            ⚠️ {costEstimate.warning}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Pricing Tier:</span>
                <span className="font-medium">
                  {costEstimate.tier === 'tier_1' ? 'Tier 1' : costEstimate.tier === 'tier_2' ? 'Tier 2' : 'Tier 3'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Envelope:</span>
                <span className="font-medium">{costEstimate.envelopeType}</span>
              </div>
              <div className="border-t pt-2 flex justify-between items-center">
                <span className="text-lg font-semibold">Total Cost:</span>
                <span className="text-2xl font-bold text-green-600">
                  ${(costEstimate.price / 100).toFixed(2)}
                </span>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground space-y-1">
              <p>✓ Includes printing and postage</p>
              <p>✓ First-class USPS delivery</p>
              <p>✓ Tracking included</p>
            </div>
          </div>
        )}
        
        {/* Pricing tiers reference */}
        <div className="border-t pt-3 text-xs space-y-1">
          <p className="font-semibold mb-2">Pricing Tiers:</p>
          <div className="flex justify-between">
            <span className="text-muted-foreground">1-5 pages:</span>
            <span className="font-medium">$2.50 (Standard #10)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">6-20 pages:</span>
            <span className="font-medium">$7.50 (Flat 9x12)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">21-50 pages:</span>
            <span className="font-medium">$15.00 (Flat 9x12)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

