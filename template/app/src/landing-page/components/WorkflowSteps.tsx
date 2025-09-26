import { forwardRef, useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '../../components/ui/card';

const WORKFLOW_STEPS_INTERVAL = 4000;
const WORKFLOW_STEPS_SCROLL_TIMEOUT = 200;

interface WorkflowStep {
  step: number;
  title: string;
  description: string;
  imageSrc: string;
  href: string;
}

const WorkflowSteps = ({ steps }: { steps: WorkflowStep[] }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(([entry]) => setIsInView(entry.isIntersecting), {
      threshold: 0.5,
      rootMargin: '-200px 0px -100px 0px',
    });

    if (containerRef.current) {
      observerRef.current.observe(containerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (isInView && steps.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentStep((prev) => (prev + 1) % steps.length);
      }, WORKFLOW_STEPS_INTERVAL);
    }

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      if (scrollContainerRef.current) {
        const scrollContainer = scrollContainerRef.current;
        const targetCard = scrollContainer.children[currentStep] as HTMLElement | undefined;

        if (targetCard) {
          const containerRect = scrollContainer.getBoundingClientRect();
          const cardRect = targetCard.getBoundingClientRect();
          const scrollLeft =
            targetCard.offsetLeft - scrollContainer.offsetLeft - containerRect.width / 2 + cardRect.width / 2;

          scrollContainer.scrollTo({
            left: scrollLeft,
            behavior: 'smooth',
          });
        }
      }
    }, WORKFLOW_STEPS_SCROLL_TIMEOUT);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [isInView, steps.length, currentStep]);

  const handleMouseEnter = (index: number) => {
    setCurrentStep(index);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (isInView && steps.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentStep((prev) => (prev + 1) % steps.length);
      }, WORKFLOW_STEPS_INTERVAL);
    }
  };

  return (
    <div
      ref={containerRef}
      id="how-it-works"
      className='relative w-screen left-1/2 -translate-x-1/2 flex flex-col items-center my-16'
    >
      <h2 className='mb-6 text-center font-semibold tracking-wide text-muted-foreground'>How It Works</h2>
      <div className='w-full max-w-full overflow-hidden'>
        <div
          className='flex overflow-x-auto no-scrollbar scroll-smooth pb-10 pt-4 gap-4 px-4 snap-x snap-mandatory'
          ref={scrollContainerRef}
        >
          {steps.map((step, index) => (
            <WorkflowStepCard
              key={index}
              step={step}
              index={index}
              isCurrent={index === currentStep}
              onMouseEnter={handleMouseEnter}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

interface WorkflowStepCardProps {
  step: WorkflowStep;
  index: number;
  isCurrent: boolean;
  onMouseEnter: (index: number) => void;
}

const WorkflowStepCard = forwardRef<HTMLDivElement, WorkflowStepCardProps>(
  ({ step, index, isCurrent, onMouseEnter }, ref) => {
    return (
      <div
        className='flex-shrink-0 snap-center'
        onMouseEnter={() => onMouseEnter(index)}
      >
        <Card
          ref={ref}
          className='overflow-hidden w-[280px] sm:w-[320px] md:w-[350px] transition-all duration-200 hover:scale-105'
          variant={isCurrent ? 'default' : 'faded'}
        >
          <CardContent className='p-0 h-full'>
            <div className='relative'>
              <img src={step.imageSrc} alt={step.title} className='w-full h-auto aspect-video' />
              <div className='absolute top-4 left-4 bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm'>
                {step.step}
              </div>
            </div>
            <div className='p-4'>
              <p className='font-bold text-lg mb-2'>{step.title}</p>
              <p className='text-sm text-muted-foreground'>{step.description}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
);

WorkflowStepCard.displayName = 'WorkflowStepCard';

export default WorkflowSteps;
