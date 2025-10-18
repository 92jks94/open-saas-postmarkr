import { PageHeader } from '../components/ui/page-header';
import { Seo } from '../seo/Seo';

export default function PrivacyPolicyPage() {
  return (
    <>
      <Seo
        title="Privacy Policy - Postmarkr"
        description="Learn how Postmarkr collects, uses, and protects your information. We implement bank-level encryption and secure handling of sensitive documents."
        canonical="https://postmarkr.com/privacy"
      />
      <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Privacy Policy"
          description="How we collect, use, and protect your information"
        />
        
        <div className="bg-white shadow rounded-lg p-6 mt-6">
          <div className="prose max-w-none">
            <p className="text-sm text-gray-500 mb-6">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Information We Collect</h2>
            <p className="text-gray-700 mb-4">
              We collect information you provide directly to us, such as when you create an account, 
              send mail through our service, or contact us for support.
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6">
              <li>Account information (name, email address)</li>
              <li>Mailing addresses and recipient information</li>
              <li>Payment information (processed securely through Stripe)</li>
              <li>Files and documents you upload for mailing</li>
              <li>Communication preferences and support requests</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">How We Use Your Information</h2>
            <p className="text-gray-700 mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6">
              <li>Provide, maintain, and improve our mail service</li>
              <li>Process and fulfill your mail orders</li>
              <li>Send you important updates about your mail pieces</li>
              <li>Process payments and prevent fraud</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Information Sharing</h2>
            <p className="text-gray-700 mb-4">
              We do not sell, trade, or otherwise transfer your personal information to third parties, 
              except in the following circumstances:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6">
              <li>With mail service providers (Lob) to fulfill your orders</li>
              <li>With payment processors (Stripe) to process payments</li>
              <li>When required by law or to protect our rights</li>
              <li>With your explicit consent</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Security</h2>
            <p className="text-gray-700 mb-6">
              We implement appropriate security measures to protect your personal information against 
              unauthorized access, alteration, disclosure, or destruction. This includes encryption, 
              secure servers, and regular security audits.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Rights</h2>
            <p className="text-gray-700 mb-4">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6">
              <li>Access and update your personal information</li>
              <li>Delete your account and associated data</li>
              <li>Opt out of marketing communications</li>
              <li>Request a copy of your data</li>
              <li>Withdraw consent for data processing</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-gray-700">
                <strong>Email:</strong> privacy@postmarkr.com<br />
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
