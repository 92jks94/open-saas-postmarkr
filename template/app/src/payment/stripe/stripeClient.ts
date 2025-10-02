import Stripe from 'stripe';
import { HttpError } from 'wasp/server';
import { getEnvVar } from '../../server/envValidation';

const stripeClient = new Stripe(getEnvVar('STRIPE_SECRET_KEY'), {
  // NOTE:
  // API version below should ideally match the API version in your Stripe dashboard.
  // If that is not the case, you will most likely want to (up/down)grade the `stripe`
  // npm package to the API version that matches your Stripe dashboard's one.
  // For more details and alternative setups check
  // https://docs.stripe.com/api/versioning .
  apiVersion: '2025-04-30.basil',
});

/**
 * Circuit breaker for Stripe API calls
 * Prevents cascading failures when Stripe has issues
 */
class StripeCircuitBreaker {
  private failures = 0;
  private lastFailureTime: number | null = null;
  private readonly threshold = 5; // Open circuit after 5 failures
  private readonly resetTimeout = 60000; // 1 minute

  canExecute(): boolean {
    if (this.failures < this.threshold) return true;
    
    const now = Date.now();
    if (this.lastFailureTime && now - this.lastFailureTime > this.resetTimeout) {
      console.log('🔄 Circuit breaker reset - attempting Stripe API call');
      this.reset();
      return true;
    }
    
    return false;
  }

  onSuccess(): void {
    if (this.failures > 0) {
      console.log('✅ Stripe API call successful - resetting circuit breaker');
    }
    this.failures = 0;
    this.lastFailureTime = null;
  }

  onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      console.error(`🔴 Stripe circuit breaker OPEN after ${this.failures} failures`);
    }
  }

  reset(): void {
    this.failures = 0;
    this.lastFailureTime = null;
  }
  
  getState(): string {
    if (this.failures === 0) return 'closed';
    if (this.failures >= this.threshold) return 'open';
    return 'half-open';
  }
}

const circuitBreaker = new StripeCircuitBreaker();

/**
 * Wrapped Stripe client with circuit breaker protection
 * Use this for production code to prevent cascading failures
 */
export const safeStripe = new Proxy(stripeClient, {
  get(target, prop) {
    const original = target[prop as keyof typeof target];
    
    if (typeof original === 'object' && original !== null) {
      return new Proxy(original as any, {
        get(innerTarget: any, innerProp: string | symbol) {
          const innerOriginal = innerTarget[innerProp];
          
          if (typeof innerOriginal === 'function') {
            return async function(...args: any[]) {
              if (!circuitBreaker.canExecute()) {
                console.error('🔴 Stripe circuit breaker OPEN - API temporarily unavailable');
                throw new HttpError(
                  503, 
                  'Stripe API temporarily unavailable due to repeated failures. Please try again in a minute.'
                );
              }
              
              try {
                const result = await innerOriginal.apply(innerTarget, args);
                circuitBreaker.onSuccess();
                return result;
              } catch (error) {
                circuitBreaker.onFailure();
                console.error('Stripe API error:', {
                  method: String(innerProp),
                  error: error instanceof Error ? error.message : String(error),
                  circuitBreakerState: circuitBreaker.getState()
                });
                throw error;
              }
            };
          }
          
          return innerOriginal;
        }
      });
    }
    
    return original;
  }
});

// Export both for gradual migration
export const stripe = stripeClient; // Original client
export default safeStripe; // Safe client with circuit breaker (default export)
