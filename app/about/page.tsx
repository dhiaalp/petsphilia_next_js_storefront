import Link from "next/link";

export const metadata = {
  title: "About Us | Pets Philia",
  description: "Learn about Pets Philia — personalized pet art products based in Dubai, UAE.",
};

export default function AboutPage() {
  return (
    <div className="static-page">
      <nav className="sp-nav">
        <Link href="/" className="sp-logo">Pets Philia</Link>
      </nav>

      <main className="sp-content">
        <h1>About Us</h1>

        <section>
          <h2>Our Story</h2>
          <p>
            Pets Philia was born out of a simple belief: pets are family, and they deserve
            to be celebrated. Based in Dubai, UAE, we create one-of-a-kind personalized
            products that turn your favorite pet photos into lasting keepsakes.
          </p>
        </section>

        <section>
          <h2>What We Do</h2>
          <p>
            Using cutting-edge AI technology, we transform your pet&apos;s photo into
            stunning cartoon artwork, then print it on premium products — mugs, t-shirts,
            hoodies, and even 3D-printed keychain sculptures. Every item is made to order
            and crafted with care.
          </p>
        </section>

        <section>
          <h2>Our Mission</h2>
          <p>
            We want every pet owner to have a unique, high-quality way to show off the
            bond they share with their furry (or feathery, or scaly) companion. Whether
            it&apos;s a mug on your desk or a keychain on your bag, we make sure your pet
            is always with you.
          </p>
        </section>

        <section>
          <h2>Based in Dubai</h2>
          <p>
            We proudly operate from Dubai and ship across the UAE. Have a question or
            want to say hello? Reach out via{" "}
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
