import daBoiAvatar from '../client/static/da-boi.webp';
import fileUpload from '../client/static/assets/fileupload.webp';
import payments from '../client/static/assets/payments.webp';
import email from '../client/static/assets/email.webp';
import admin from '../client/static/assets/admin.webp';
import { BlogUrl, DocsUrl } from '../shared/common';
import type { GridFeature } from './components/FeaturesGrid';

export const features: GridFeature[] = [
  {
    name: 'PDF Upload',
    description: 'Upload documents securely from your home office',
    emoji: '📄',
    size: 'small',
    href: undefined,
  },
  {
    name: 'Address Validation',
    description: 'Real-time address verification ensures delivery',
    emoji: '📍',
    size: 'small',
    href: undefined,
  },
  {
    name: 'Mail Service Selection',
    description: 'Choose from First Class, Certified, Priority, and Express mail',
    emoji: '✉️',
    size: 'medium',
    href: undefined,
  },
  {
    name: 'Real-time Tracking',
    description: 'Track your mail from anywhere with detailed status updates',
    emoji: '📊',
    size: 'large',
    href: undefined,
  },
  {
    name: 'Professional Delivery',
    description: 'Maintain professional image with reliable mail service',
    emoji: '📬',
    size: 'large',
    href: undefined,
  },
  {
    name: 'Secure Payments',
    description: 'Safe and secure payment processing with Stripe',
    emoji: '💳',
    size: 'small',
    href: undefined,
  },
  {
    name: 'Address Management',
    description: 'Save client addresses for quick access',
    emoji: '📋',
    size: 'small',
    href: undefined,
  },
  {
    name: 'Delivery Notifications',
    description: 'Get notified when your mail is delivered',
    emoji: '🔔',
    size: 'medium',
    href: undefined,
  },
  {
    name: 'Work from Anywhere',
    description: 'Send mail from your laptop, anywhere in the world',
    emoji: '🌍',
    size: 'medium',
    href: undefined,
  },
];

export const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Remote Marketing Manager',
    avatarSrc: daBoiAvatar,
    socialUrl: '#',
    quote: "Working from home, I need to send client contracts and proposals regularly. Postmarkr lets me handle all my business mail without leaving my home office. The tracking feature gives me peace of mind.",
  },
  {
    name: 'Alex Martinez',
    role: 'Freelance Designer',
    avatarSrc: daBoiAvatar,
    socialUrl: '#',
    quote: "As a freelancer, I need to send design contracts and invoices to clients. Postmarkr's professional service helps me maintain credibility while working remotely. No more post office runs!",
  },
  {
    name: 'Jennifer Walsh',
    role: 'Remote Real Estate Agent',
    avatarSrc: daBoiAvatar,
    socialUrl: '#',
    quote: "Even though I work from home, I still need to send property documents and contracts. Postmarkr lets me maintain professional service for my clients without leaving my home office.",
  },
  {
    name: 'David Kim',
    role: 'Digital Nomad',
    avatarSrc: daBoiAvatar,
    socialUrl: '#',
    quote: "Traveling while working remotely, I need reliable mail service from anywhere. Postmarkr works perfectly - I can send important documents from my laptop and track delivery worldwide.",
  },
  {
    name: 'Lisa Thompson',
    role: 'Work-from-Home Consultant',
    avatarSrc: daBoiAvatar,
    socialUrl: '#',
    quote: "Running my consulting business from home, I need professional mail service for client deliverables. Postmarkr makes it easy to send documents and track delivery without disrupting my workflow.",
  },
];

export const faqs = [
  {
    id: 1,
    question: 'How does Postmarkr work?',
    answer: 'Simply upload your PDF document from your home office, select your mail service type, enter the recipient address, and pay. We handle the printing, packaging, and mailing through our professional mail processing partner.',
  },
  {
    id: 2,
    question: 'Can I use Postmarkr while working remotely?',
    answer: 'Absolutely! Postmarkr is perfect for remote workers and digital nomads. You can send mail from anywhere with an internet connection - no need to visit a post office.',
  },
  {
    id: 3,
    question: 'What types of mail can I send?',
    answer: 'You can send First Class mail, Certified mail, Priority mail, and Express mail. We support letters, postcards, and other standard mail formats up to 25MB in size.',
  },
  {
    id: 4,
    question: 'How do I track my mail?',
    answer: 'Once your mail is processed, you\'ll receive a tracking number and can monitor delivery status in real-time through your dashboard. You\'ll also get email notifications for status updates.',
  },
  {
    id: 5,
    question: 'Is my document secure?',
    answer: 'Yes, all documents are encrypted in transit and at rest. We use enterprise-grade security measures and only process your mail through trusted, professional mail services.',
  },
  {
    id: 6,
    question: 'What if my mail is lost or damaged?',
    answer: 'We work with professional mail services that provide insurance and tracking. If there are any issues with delivery, we\'ll work with you to resolve them and provide appropriate compensation.',
  },
  {
    id: 7,
    question: 'How much does it cost?',
    answer: 'Pricing is based on the number of pages and mail service type. We offer transparent, per-page pricing starting at $0.25 per page with no hidden fees.',
  },
];

export const footerNavigation = {
  app: [
    { name: 'Send Mail', href: '/mail/create' },
    { name: 'Mail History', href: '/mail/history' },
    { name: 'Addresses', href: '/addresses' },
  ],
  company: [
    { name: 'About Postmarkr', href: '#' },
    { name: 'Blog', href: BlogUrl },
    { name: 'Privacy Policy', href: '#' },
    { name: 'Terms of Service', href: '#' },
  ],
};

export const workflowSteps = [
  {
    step: 1,
    title: 'Upload Your Document',
    description: 'Upload PDF documents from your home office with automatic validation',
    imageSrc: fileUpload,
    href: '#',
  },
  {
    step: 2,
    title: 'Choose Mail Service',
    description: 'Select from First Class, Certified, Priority, or Express mail',
    imageSrc: email,
    href: '#',
  },
  {
    step: 3,
    title: 'Add Addresses',
    description: 'Enter recipient address with real-time validation',
    imageSrc: admin,
    href: '#',
  },
  {
    step: 4,
    title: 'Track Delivery',
    description: 'Monitor your mail from anywhere with real-time updates',
    imageSrc: payments,
    href: '#',
  },
];

// Keep examples for backward compatibility but use workflow steps
export const examples = workflowSteps;
