import SEO from '../components/SEO';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <SEO 
        title="Privacy Policy | Skillsurger"
        description="Read Skillsurger's privacy policy to understand how we collect, use, and protect your personal information and career data."
        keywords="privacy policy, data protection, user privacy, information security"
        canonicalUrl="/privacy"
        noIndex={true}
      />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
          
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-6">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p className="text-gray-700 mb-4">
                Welcome to Skillsurger's Privacy Policy. Your privacy is critically important to us. This Privacy Policy document contains types of information that is collected and recorded by Skillsurger and how we use it.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Personal identification information (Name, email address, phone number)</li>
                <li>Professional information (CV, work history, skills)</li>
                <li>Usage data and analytics</li>
                <li>Communication preferences</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 mb-4">
                We use the information we collect in various ways, including to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Provide, operate, and maintain our website</li>
                <li>Improve, personalize, and expand our services</li>
                <li>Understand and analyze how you use our website</li>
                <li>Develop new products, services, features, and functionality</li>
                <li>Send you emails and updates</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Data Protection</h2>
              <p className="text-gray-700 mb-4">
                We implement a variety of security measures to maintain the safety of your personal information when you enter, submit, or access your personal information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Your Rights</h2>
              <p className="text-gray-700 mb-4">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Access your personal data</li>
                <li>Correct your personal data</li>
                <li>Request deletion of your personal data</li>
                <li>Restrict processing of your personal data</li>
                <li>Object to processing of your personal data</li>
                <li>Data portability</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Contact Us</h2>
              <p className="text-gray-700">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <p className="text-gray-700 mt-2">
                Email: privacy@skillsurger.com<br />
                Phone: +1 (555) 123-4567<br />
                Address: 123 Innovation Drive, Tech Valley, CA 94025
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}