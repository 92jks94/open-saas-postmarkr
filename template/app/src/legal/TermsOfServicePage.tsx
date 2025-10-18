import { PageHeader } from '../components/ui/page-header';
import { Seo } from '../seo/Seo';

export default function TermsOfServicePage() {
  return (
    <>
      <Seo
        title="Terms of Service - Postmarkr"
        description="Terms and conditions for using Postmarkr's virtual mailbox and automated mail service. Learn about service usage, payment terms, and user responsibilities."
        canonical="https://postmarkr.com/terms"
      />
      <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Terms of Service"
          description="The terms and conditions for using Postmarkr"
        />
        
        <div className="bg-white shadow rounded-lg p-6 mt-6">
          <div className="prose max-w-none">
            <p className="text-sm text-gray-500 mb-6">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceptance of Terms</h2>
            <p className="text-gray-700 mb-6">
              By accessing and using Postmarkr ("the Service"), you accept and agree to be bound by 
              the terms and provision of this agreement. If you do not agree to abide by the above, 
              please do not use this service.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Description of Service</h2>
            <p className="text-gray-700 mb-4">
              Postmarkr is a mail service platform that allows users to:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6">
              <li>Upload and prepare documents for mailing</li>
              <li>Send physical mail through our partner network</li>
              <li>Track mail delivery status</li>
              <li>Manage mailing addresses and preferences</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">User Accounts</h2>
            <p className="text-gray-700 mb-4">
              To use our service, you must:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6">
              <li>Provide accurate and complete information when creating an account</li>
              <li>Maintain the security of your account credentials</li>
              <li>Be responsible for all activities under your account</li>
              <li>Notify us immediately of any unauthorized use</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Prohibited Uses</h2>
            <p className="text-gray-700 mb-4">
              You may not use our service:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6">
              <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
              <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
              <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
              <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
              <li>To submit false or misleading information</li>
              <li>To upload or transmit viruses or any other type of malicious code</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Terms</h2>
            <p className="text-gray-700 mb-4">
              Payment for services is due at the time of order placement. We accept payment through 
              Stripe and other approved payment processors. All prices are in US dollars unless 
              otherwise specified.
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6">
              <li>Refunds are subject to our refund policy</li>
              <li>We reserve the right to change pricing with 30 days notice</li>
              <li>Failed payments may result in service suspension</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Service Availability</h2>
            <p className="text-gray-700 mb-6">
              While we strive to maintain high service availability, we do not guarantee uninterrupted 
              access to our service. We may experience downtime for maintenance, updates, or technical 
              issues beyond our control.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Limitation of Liability</h2>
            <p className="text-gray-700 mb-6">
              In no event shall Postmarkr, nor its directors, employees, partners, agents, suppliers, 
              or affiliates, be liable for any indirect, incidental, special, consequential, or punitive 
              damages, including without limitation, loss of profits, data, use, goodwill, or other 
              intangible losses, resulting from your use of the service.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Indemnification</h2>
            <p className="text-gray-700 mb-6">
              You agree to defend, indemnify, and hold harmless Postmarkr and its licensee and 
              licensors, and their employees, contractors, agents, officers and directors, from and 
              against any and all claims, damages, obligations, losses, liabilities, costs or debt, 
              and expenses (including but not limited to attorney's fees).
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Termination</h2>
            <p className="text-gray-700 mb-6">
              We may terminate or suspend your account and bar access to the service immediately, 
              without prior notice or liability, under our sole discretion, for any reason whatsoever 
              and without limitation, including but not limited to a breach of the Terms.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to Terms</h2>
            <p className="text-gray-700 mb-6">
              We reserve the right, at our sole discretion, to modify or replace these Terms at any 
              time. If a revision is material, we will provide at least 30 days notice prior to any 
              new terms taking effect.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Information</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-gray-700">
                <strong>Email:</strong> legal@postmarkr.com<br />
                <strong>Address:</strong> Postmarkr, Inc.<br />
                [Your Business Address]
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
