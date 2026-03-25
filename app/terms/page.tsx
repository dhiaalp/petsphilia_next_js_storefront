import Link from "next/link";

export const metadata = {
  title: "Terms of Service | Pets Philia",
  description: "Terms of Service for Pets Philia — rules and conditions for using our store.",
};

export default function TermsPage() {
  return (
    <div className="static-page">
      <nav className="sp-nav">
        <Link href="/" className="sp-logo">Pets Philia</Link>
      </nav>

      <main className="sp-content">
        <h1>Terms of Service</h1>
        <p className="sp-updated">Last updated: March 25, 2026</p>

        <section>
          <h2>1. Overview</h2>
          <p>
            These Terms of Service govern your use of the Pets Philia website
            (petsphilia.store) and the purchase of products from our store. By placing
            an order, you agree to these terms.
          </p>
        </section>

        <section>
          <h2>2. Products and Customization</h2>
          <ul>
            <li>All products are custom-made based on the pet photo you provide.</li>
            <li>AI-generated artwork may vary slightly from the preview shown during ordering.</li>
            <li>We reserve the right to refuse orders with inappropriate or non-pet images.</li>
          </ul>
        </section>

        <section>
          <h2>3. Orders and Pricing</h2>
          <ul>
            <li>All prices are listed in AED (UAE Dirham) unless otherwise stated.</li>
            <li>Prices are subject to change without prior notice.</li>
            <li>Orders are confirmed only after successful payment.</li>
          </ul>
        </section>

        <section>
          <h2>4. Payment</h2>
          <p>
            We accept payments through Stripe. All transactions are processed securely.
            By providing payment information, you confirm that you are authorized to use
            the payment method.
          </p>
        </section>

        <section>
          <h2>5. Shipping and Delivery</h2>
          <ul>
            <li>We currently ship within the UAE.</li>
            <li>Production time is typically 3-7 business days for printed products and 7-14 business days for 3D-printed keychains.</li>
            <li>Delivery times may vary depending on your location.</li>
            <li>Shipping costs are calculated at checkout.</li>
          </ul>
        </section>

        <section>
          <h2>6. Returns and Refunds</h2>
          <p>
            Because all products are custom-made to order:
          </p>
          <ul>
            <li>We do not accept returns on personalized items unless they arrive damaged or defective.</li>
            <li>If your product arrives damaged, contact us within 48 hours with photos of the damage.</li>
            <li>We will replace damaged items or issue a refund at our discretion.</li>
          </ul>
        </section>

        <section>
          <h2>7. Intellectual Property</h2>
          <ul>
            <li>You retain ownership of the pet photos you upload.</li>
            <li>By uploading a photo, you grant us a limited license to use it for fulfilling your order.</li>
            <li>All AI-generated artwork, website content, and branding are the property of Pets Philia.</li>
          </ul>
        </section>

        <section>
          <h2>8. Limitation of Liability</h2>
          <p>
            Pets Philia is not liable for any indirect, incidental, or consequential
            damages arising from the use of our products or services. Our total liability
            is limited to the amount paid for the specific product in question.
          </p>
        </section>

        <section>
          <h2>9. Changes to Terms</h2>
          <p>
            We may update these Terms of Service at any time. Continued use of our
            website after changes constitutes acceptance of the updated terms.
          </p>
        </section>

        <section>
          <h2>10. Contact Us</h2>
          <p>
            For questions about these terms, reach out via{" "}
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
