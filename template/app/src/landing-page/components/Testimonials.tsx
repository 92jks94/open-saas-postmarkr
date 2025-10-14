import { Star } from 'lucide-react';
import { Card } from '../../components/ui/card';

const testimonials = [
  {
    quote:
      'Postmarkr has completely transformed how I handle client contracts. I can send documents from my home office in Barcelona to clients anywhere in the US. Game changer!',
    author: 'Sarah Chen',
    role: 'Freelance Consultant',
    rating: 5,
  },
  {
    quote:
      'As a digital nomad, I was always struggling with sending physical documents. Postmarkr solved this perfectly. Now I can send certified mail from a beach in Bali!',
    author: 'Marcus Rivera',
    role: 'Remote Software Developer',
    rating: 5,
  },
  {
    quote:
      'The tracking feature gives me peace of mind. I always know exactly where my important documents are and when they will arrive. The interface is incredibly intuitive.',
    author: 'Emily Thompson',
    role: 'Real Estate Agent',
    rating: 5,
  },
  {
    quote:
      'I save hours every week not having to go to the post office. The address validation catches errors before sending, which has saved me from costly mistakes.',
    author: 'David Park',
    role: 'Small Business Owner',
    rating: 5,
  },
];

export default function Testimonials() {
  return (
    <section className='py-16 md:py-20 relative overflow-hidden'>
      {/* Background gradient */}
      <div className='absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background -z-10' />

      <div className='container mx-auto px-4 md:px-6 lg:px-8'>
        <div className='text-center mb-16 animate-fade-in-up'>
          <h2 id='testimonials-heading' className='text-3xl md:text-4xl lg:text-5xl font-bold mb-4'>
            Loved by <span className='bg-gradient-accent bg-clip-text text-transparent'>thousands</span> worldwide
          </h2>
          <p className='text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto'>
            See what our customers have to say about Postmarkr
          </p>
        </div>

        <div className='grid md:grid-cols-2 gap-6 max-w-6xl mx-auto'>
          {testimonials.map((testimonial, index) => (
            <Card
              key={testimonial.author}
              className='p-6 md:p-8 bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-all duration-300 hover:shadow-glass hover:-translate-y-1 animate-fade-in-up'
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Star Rating */}
              <div className='flex gap-1 mb-4'>
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className='w-5 h-5 fill-accent text-accent' />
                ))}
              </div>

              {/* Quote */}
              <blockquote className='relative text-lg mb-6 leading-relaxed'>
                <span className='absolute -top-2 -left-1 text-4xl text-primary/20 font-serif'>"</span>
                <span className='pl-6'>{testimonial.quote}"</span>
              </blockquote>

              {/* Author */}
              <div className='flex items-center gap-4'>
                <div className='w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-lg'>
                  {testimonial.author
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div>
                  <div className='font-semibold'>{testimonial.author}</div>
                  <div className='text-sm text-muted-foreground'>{testimonial.role}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
