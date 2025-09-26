import { type PageViewSource } from 'wasp/entities';
import { ArrowUp, ArrowDown, Minus, TrendingUp, DollarSign, Users } from 'lucide-react';

const SourcesTable = ({ sources }: { sources: PageViewSource[] | undefined }) => {
  // Calculate enhanced metrics for display
  const getQualityScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUp className="w-3 h-3 text-green-600" />;
      case 'down': return <ArrowDown className="w-3 h-3 text-red-600" />;
      default: return <Minus className="w-3 h-3 text-gray-600" />;
    }
  };

  return (
    <div className='rounded-sm border border-border bg-card px-5 pt-6 pb-2.5 shadow-default sm:px-7.5 xl:pb-1'>
      <h4 className='mb-6 text-xl font-semibold text-foreground'>Top Sources</h4>

      <div className='flex flex-col'>
        <div className='grid grid-cols-6 rounded-sm bg-gray-2 '>
          <div className='p-2.5 xl:p-5'>
            <h5 className='text-sm font-medium uppercase xsm:text-base'>Source</h5>
          </div>
          <div className='p-2.5 text-center xl:p-5'>
            <h5 className='text-sm font-medium uppercase xsm:text-base'>Visitors</h5>
          </div>
          <div className='hidden p-2.5 text-center sm:block xl:p-5'>
            <h5 className='text-sm font-medium uppercase xsm:text-base'>Conv. Rate</h5>
          </div>
          <div className='hidden p-2.5 text-center lg:block xl:p-5'>
            <h5 className='text-sm font-medium uppercase xsm:text-base'>Quality</h5>
          </div>
          <div className='hidden p-2.5 text-center xl:block xl:p-5'>
            <h5 className='text-sm font-medium uppercase xsm:text-base'>Revenue/Visitor</h5>
          </div>
          <div className='hidden p-2.5 text-center xl:p-5'>
            <h5 className='text-sm font-medium uppercase xsm:text-base'>Trend</h5>
          </div>
        </div>

        {sources && sources.length > 0 ? (
          sources.map((source, index) => {
            // Use stored enhanced metrics from database
            const conversionRate = source.conversionRate || 0;
            const qualityScore = source.qualityScore || 0;
            const revenuePerVisitor = source.revenuePerVisitor || 0;
            const trendDirection = source.trendDirection || 'stable';
            
            return (
              <div key={index} className='grid grid-cols-6 border-b border-border'>
                <div className='flex items-center gap-3 p-2.5 xl:p-5'>
                  <p className='text-foreground font-medium'>{source.name}</p>
                </div>

                <div className='flex items-center justify-center p-2.5 xl:p-5'>
                  <div className='flex items-center gap-1'>
                    <Users className='w-3 h-3 text-muted-foreground' />
                    <p className='text-foreground'>{source.visitors.toLocaleString()}</p>
                  </div>
                </div>

                <div className='hidden items-center justify-center p-2.5 sm:flex xl:p-5'>
                  <p className='text-foreground'>{conversionRate.toFixed(1)}%</p>
                </div>

                <div className='hidden items-center justify-center p-2.5 lg:flex xl:p-5'>
                  <div className={`flex items-center gap-1 ${getQualityScoreColor(qualityScore)}`}>
                    <TrendingUp className='w-3 h-3' />
                    <p className='font-medium'>{qualityScore.toFixed(1)}</p>
                  </div>
                </div>

                <div className='hidden items-center justify-center p-2.5 xl:flex xl:p-5'>
                  <div className='flex items-center gap-1'>
                    <DollarSign className='w-3 h-3 text-muted-foreground' />
                    <p className='text-foreground'>${revenuePerVisitor.toFixed(2)}</p>
                  </div>
                </div>

                <div className='flex items-center justify-center p-2.5 xl:p-5'>
                  {getTrendIcon(trendDirection)}
                </div>
              </div>
            );
          })
        ) : (
          <div className='flex items-center justify-center p-2.5 xl:p-5'>
            <p className='text-foreground'>No data to display</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SourcesTable;
