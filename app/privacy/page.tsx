import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | Pets Philia",
  description: "Privacy Policy for Pets Philia — how we handle your data.",
};

export default function PrivacyPage() {
  return (
    <div className="static-page">
      <nav className="sp-nav">
        <Link href="/" className="sp-logo">Pets Philia</Link>
      </nav>

      <main className="sp-content">
        <h1>Privacy Policy</h1>
        <p className="sp-updated">Last updated: March 25, 2026</p>

        <section>
          <h2>1. Information We Collect</h2>
          <p>
            When you use Pets Philia, we may collect the following information:
          </p>
          <ul>
            <li><strong>Personal information:</strong> name, email address, shipping address, and phone number when you place an order.</li>
            <li><strong>Pet photos:</strong> images you upload for product customization.</li>
            <li><strong>Payment information:</strong> processed securely through our payment provider (Stripe). We do not store your card details.</li>
            <li><strong>Usage data:</strong> basic analytics to improve our website experience.</li>
          </ul>
        </section>

        <section>
          <h2>2. How We Use Your Information</h2>
          <ul>
            <li>To process and fulfill your orders.</li>
            <li>To generate personalized artwork from your pet photos using AI.</li>
            <li>To communicate with you about your order status.</li>
            <li>To improve our products and services.</li>
          </ul>
        </section>

        <section>
          <h2>3. Pet Photos</h2>
          <p>
            Photos you upload are used solely for generating your custom artwork. We do
            not sell, share, or use your photos for any purpose other than fulfilling your
            order. Uploaded photos may be temporarily stored on our servers during
            processing and are not retained indefinitely.
          </p>
        </section>

        <section>
          <h2>4. Data Sharing</h2>
          <p>
            We do not sell your personal information. We may share limited data with
            trusted third-party services necessary to operate our business:
          </p>
          <ul>
            <li>Payment processors (Stripe)</li>
            <li>Shipping and fulfillment partners</li>
            <li>Cloud hosting providers</li>
          </ul>
        </section>

        <section>
          <h2>5. Data Security</h2>
          <p>
            We implement appropriate security measures to protect your personal
            information. However, no method of transmission over the internet is 100%
            secure.
          </p>
        </section>

        <section>
          <h2>6. Your Rights</h2>
          <p>
            You have the right to access, correct, or delete your personal data. Contact
            us at any time via{" "}
            <a href="https://wa.me/971585573621" target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>{" "}
            to exercise these rights.
          </p>
        </section>

        <section>
          <h2>7. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Changes will be posted
            on this page with an updated date.
          </p>
        </section>

        <section>
          <h2>8. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, contact us via{" "}
            <a href="https://wa.me/971585573621" target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>{" "}
            or{" "}
            <a href="https://instagram.com/petsphilia" target="_blank" rel="noopener noreferrer">
              Instagram
            </a>.
          </p>
        </section>
      </main>

      <footer className="sp-footer">
        <Link href="/">Back to Home</Link>
      </footer>
    </div>
  );
}
