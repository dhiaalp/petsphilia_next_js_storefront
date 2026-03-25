import HomepageBehavior from "./components/homepage-behavior";
import HomepageFaq from "./components/homepage-faq";
import { formatMoney, listProducts } from "@/lib/medusa";

export const dynamic = "force-dynamic";

const sectionIds = ["products", "how", "styles", "reviews", "faq"];

const heroMockups = [
  {
    img: "/legacy/home/aAsset-24sc-300x300.png",
    alt: "Custom pet mug",
    name: "Custom Mug",
    handle: "custom-mug",
    tag: "🎨 Cartoon Style",
    cls: "mockup-card-1",
  },
  {
    img: "/legacy/styles/tshirt.png",
    alt: "Custom pet t-shirt",
    name: "Custom T-Shirt",
    handle: "custom-tshirt",
    tag: "🔥 Most Popular",
    cls: "mockup-card-2",
  },
  {
    img: "/legacy/styles/hoodie.png",
    alt: "Custom pet hoodie",
    name: "Custom Hoodie",
    handle: "custom-hoodie",
    tag: "✏️ Pencil Sketch",
    cls: "mockup-card-3",
  },
];

const products = [
  {
    id: "mug",
    handle: "custom-mug",
    title: "Custom Mug",
    desc: "Your pet's cartoon portrait printed on a premium 11oz ceramic mug. Start every morning with your furry best friend.",
    tags: ["Premium Ceramic", "Dishwasher Safe", "11oz"],
    img: "/products/mug.jpg",
    type: "pc-mug",
    featured: false,
  },
  {
    id: "tshirt",
    handle: "custom-tshirt",
    title: "Custom T-Shirt",
    desc: "Soft breathable unisex tee with your pet's cartoon printed front and center. Available in multiple sizes and colors.",
    tags: ["100% Cotton", "Unisex Fit", "Multi Colors"],
    img: "/products/tshirt.jpg",
    type: "pc-shirt",
    featured: true,
  },
  {
    id: "hoodie",
    handle: "custom-hoodie",
    title: "Custom Hoodie",
    desc: "Cozy premium hoodie with your pet cartoon. The most memorable gift for any pet lover in your life.",
    tags: ["Premium Fleece", "Unisex", "Gift Ready"],
    img: "/products/hoodie.jpg",
    type: "pc-hoodie",
    featured: false,
  },
  {
    id: "keychain",
    handle: "custom-keychain",
    title: "3D Pet Keychain",
    desc: "Your pet transformed into a collectible 3D-printed resin keychain sculpture. A miniature masterpiece you can carry everywhere.",
    tags: ["3D Printed", "Resin Sculpture", "Collectible"],
    img: "/products/keychain.png",
    type: "pc-keychain",
    featured: false,
  },
];

const styleCards = [
  { name: "Pencil Sketch", desc: "Classic pencil drawing", img: "pencil.png", hot: false },
  { name: "Watercolor", desc: "Soft artistic painting", img: "watercolor.png", hot: false },
  { name: "Cartoon", desc: "Fun animated style", img: "cartoon.png", hot: true },
  { name: "Tattoo Ink", desc: "Blackwork tattoo style, stippling shading", img: "tattoo.png", hot: true },
  { name: "Oil Paint Van Gogh", desc: "Thick brush strokes, expressive style", img: "vangogh.png", hot: false },
];

const reviewPhotos = [
  { src: "/legacy/home/sAsset-10sc.webp", fallback: "🐶" },
  { src: "/legacy/home/sAsset-11sc.webp", fallback: "🐱" },
  { src: "/legacy/home/sAsset-12sc.webp", fallback: "🐾" },
];

const reviews = [
  {
    name: "Farah",
    text: '"I uploaded a picture of my parrot just to try it and the cartoon came out so funny! I printed it on a phone case and now I show it to everyone!"',
    tag: "☕ Custom Mug",
  },
  {
    name: "Layla",
    text: '"I love how my cat turned out! The cartoon looks super cute, and the hoodie I ordered feels great. It was really easy to use too."',
    tag: "🧥 Custom Hoodie",
  },
  {
    name: "Hani",
    text: '"Really cool idea. The cartoon of my dog looked so good, like something from a movie. I\'ll be ordering more for my friends."',
    tag: "👕 Custom T-Shirt",
  },
];

const faqItems = [
  {
    id: "delivery",
    question: "How long does it take to receive my order?",
    answer:
      "Orders are processed within 1–2 business days. Delivery within Dubai takes 2–3 days, and across the UAE 3–5 business days. You'll receive a tracking link once your order ships.",
  },
  {
    id: "preview",
    question: "Can I preview the cartoon before paying?",
    answer:
      "Yes! You'll see a full preview of your cartoon on the product before adding to cart. If you're not happy, you can regenerate with a different photo or style — completely free.",
  },
  {
    id: "photo",
    question: "What kind of photo works best?",
    answer:
      "A clear, well-lit photo of your pet facing forward works best. Make sure your pet's face is visible and not blurred. Natural light photos tend to produce the best results.",
  },
  {
    id: "pets",
    question: "Can I order for any type of pet?",
    answer:
      "Absolutely! Our system works with dogs, cats, rabbits, birds, hamsters, and virtually any pet. If you can photograph it, we can cartoonize it.",
  },
  {
    id: "returns",
    question: "What's your return policy?",
    answer:
      "Since every product is custom-made just for you, we don't accept returns on personalized items. However, if your order arrives damaged or with a printing error, we'll replace it at no cost.",
  },
];

export default async function HomePage() {
  const medusaProducts = await listProducts().catch(() => []);
  const medusaPriceByHandle = new Map(
    medusaProducts
      .filter((product) => product.handle)
      .map((product) => {
        const firstVariant = product.variants?.[0];
        const amount = firstVariant?.calculated_price?.calculated_amount;
        const currencyCode = firstVariant?.calculated_price?.currency_code ?? "aed";

        return [
          product.handle as string,
          typeof amount === "number" ? formatMoney(amount, currencyCode) : "Unavailable",
        ];
      }),
  );

  const heroStartPrice =
    medusaPriceByHandle.get("custom-mug")
    ?? medusaPriceByHandle.get("custom-tshirt")
    ?? medusaPriceByHandle.get("custom-hoodie")
    ?? medusaPriceByHandle.get("custom-keychain")
    ?? "Unavailable";

  return (
    <main className="home-page">
      <HomepageBehavior sectionIds={sectionIds} />

      {/* ── HERO ── */}
      <section className="home-hero">
        <div className="hero-glow hero-glow-orange" />
        <div className="hero-glow hero-glow-teal" />
        <div className="hero-dots" />

        <div className="home-hero-copy">
          <span className="hero-badge">
            <span className="badge-pulse" />
            Personalized Pet Art · UAE
          </span>

          <h1>
            Wear Your Pet.<br />
            Gift Your Pet.<br />
            Love Your Pet.
          </h1>

          <p>Upload a photo — we&apos;ll create personalized artwork printed on any product.</p>

          <div className="hero-actions-row">
            <a href="#products" className="hero-primary-button">🐾 Shop &amp; Customize</a>
            <a href="#how" className="hero-secondary-link">
              <span className="hero-secondary-arrow">▶</span>
              How It Works
            </a>
          </div>

          <div className="hero-stat-row">
            <div className="hero-stat">
              <strong>500+</strong>
              <span>Happy Pet Parents</span>
            </div>
            <div className="hero-stat">
              <strong>5</strong>
              <span>Cartoon Styles</span>
            </div>
            <div className="hero-stat">
              <strong>{heroStartPrice}</strong>
              <span>Starting From</span>
            </div>
            <div className="hero-stat">
              <strong>⭐ 4.9</strong>
              <span>Customer Rating</span>
            </div>
          </div>
        </div>

        <div className="home-hero-visual">
          <span className="mockup-badge mockup-badge-top">🎨 5 Art Styles</span>
          <span className="mockup-badge mockup-badge-bottom">🇦🇪 Ships UAE-wide</span>

          <div className="mockup-stack">
            {heroMockups.map((card) => (
              <a key={card.cls} href="#products" className={`mockup-card ${card.cls}`}>
                <div className="mockup-image">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={card.img} alt={card.alt} />
                </div>
                <div className="mockup-copy">
                  <p>{card.name}</p>
                  <strong>{medusaPriceByHandle.get(card.handle) ?? "Unavailable"}</strong>
                  <span className="mockup-tag">{card.tag}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUCTS ── */}
      <section className="home-section" id="products">
        <div className="home-section-heading reveal">
          <span className="section-kicker">Choose Your Product</span>
          <h2>What do you want to customize?</h2>
          <p>
            Pick your product first — then upload your pet&apos;s photo and we&apos;ll create the
            artwork just for you.
          </p>
        </div>

        <div className="shop-grid">
          {products.map((p, i) => (
            <article
              key={p.id}
              className={`shop-card ${p.featured ? "featured" : ""} reveal d${i + 1}`}
            >
              {p.featured && <div className="prod-pop">⭐ Most Popular</div>}
              <div className={`shop-card-media ${p.type}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.img} alt={p.title} className="prod-photo" />
              </div>
              <div className="shop-card-body">
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
                <div className="prod-tags">
                  {p.tags.map((tag) => (
                    <span key={tag} className="prod-tag">{tag}</span>
                  ))}
                </div>
                <div className="shop-card-footer">
                  <div className="prod-price">
                    {(medusaPriceByHandle.get(p.handle) ?? "Unavailable")} <small>/ piece</small>
                  </div>
                  <a href={`/customize/${p.handle}`} className="btn-cust">
                    Customize <span className="arr">→</span>
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="home-band" id="how">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/legacy/home/cropped-logoAsset-5sc-197x53.png"
          alt="Petsphilia"
          className="how-logo"
        />
        <div className="home-section-heading invert reveal">
          <h2>How It Works?</h2>
          <p>From photo to product — simple, fast, and fun!</p>
        </div>

        <div className="steps-grid">
          {[
            { icon: "🛒", title: "Pick a Product", desc: "Choose from mug, t-shirt, or hoodie. Prices shown upfront — no surprises." },
            { icon: "📸", title: "Upload Your Pet", desc: "Add a clear, well-lit photo of your furry friend. One good photo is all it takes." },
            { icon: "🎨", title: "Choose a Style", desc: "Pick from 5 art styles — Cartoon, Watercolor, Pencil, Tattoo Ink, or Van Gogh." },
            { icon: "✨", title: "Order & Receive", desc: "Preview your design, add to cart, and we'll deliver anywhere in the UAE." },
          ].map((step, i) => (
            <div key={step.title} className={`step reveal d${i + 1}`}>
              <div className="step-ring">{step.icon}</div>
              <div className="step-title">{step.title}</div>
              <p className="step-desc">{step.desc}</p>
            </div>
          ))}
        </div>

        <div className="how-video reveal">
          <div className="how-video-frame">
            <iframe
              src="https://www.youtube.com/embed/kwgvQ9Qxodg?autoplay=1&mute=1&loop=1&playlist=kwgvQ9Qxodg&controls=1&rel=0"
              title="How it works video"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      {/* ── ART STYLES ── */}
      <section className="home-section" id="styles">
        <div className="home-section-heading reveal">
          <span className="section-kicker">Art Styles</span>
          <h2>5 styles. Endless possibilities.</h2>
          <p>Every pet looks completely different in every style. Try them all.</p>
        </div>

        <div className="styles-grid">
          {styleCards.map((style, i) => (
            <div key={style.name} className={`style-tile reveal d${i + 1}`}>
              {style.hot && <span className="style-hot">🔥</span>}
              <div className="style-tile-icon">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/legacy/styles/${style.img}`}
                  alt={style.name}
                />
              </div>
              <h3>{style.name}</h3>
              <p>{style.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── REVIEWS ── */}
      <section className="home-reviews" id="reviews">
        <div className="paw-bg p1">🐾</div>
        <div className="paw-bg p2">🐾</div>

        <div className="rev-inner">
          <div className="home-section-heading invert reveal">
            <h2>Loved by All Pet Parents</h2>
            <p>Hear from real pet lovers who turned their photos into something special</p>
          </div>

          <div className="rev-photos reveal">
            {reviewPhotos.map((photo, i) => (
              <div key={i} className="rev-photo">
                <div className="rev-photo-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.src} alt="" />
                </div>
              </div>
            ))}
          </div>

          <div className="review-cards">
            {reviews.map((review, i) => (
              <div key={review.name} className={`review-tile reveal d${i + 1}`}>
                <h3>{review.name}</h3>
                <p>{review.text}</p>
                <div className="rev-tag-wrap">
                  <span className="rev-tag">✓ {review.tag}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="home-section faq-section" id="faq">
        <div className="home-section-heading reveal">
          <span className="section-kicker">FAQ</span>
          <h2>Got questions?</h2>
          <p>Everything you need to know before you order.</p>
        </div>
        <HomepageFaq items={faqItems} />
      </section>

      {/* ── CLOSING CTA ── */}
      <section className="closing-cta">
        <h2 className="reveal">
          Your pet deserves<br />to be on a mug.
        </h2>
        <p className="reveal">Pick a product and create your personalized artwork in minutes.</p>
        <a href="#products" className="btn-main reveal">🐾 Start Customizing</a>
      </section>

      {/* ── FOOTER ── */}
      <footer>
        <div className="ft-top">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/legacy/home/cropped-logoAsset-5sc-197x53.png"
              alt="Petsphilia"
              className="ft-logo"
            />
            <p className="ft-brand-txt">
              Celebrate your pet with one-of-a-kind cartoon artwork, printed on products
              you&apos;ll actually use and love. Based in Dubai, shipping across the UAE.
            </p>
            <a href="https://wa.me/971585573621" className="ft-wa">
              💬 Chat on WhatsApp
            </a>
          </div>
          <div className="ft-col">
            <h4>Products</h4>
            <ul>
              <li><a href="/products/custom-mug">Custom Mug</a></li>
              <li><a href="/products/custom-tshirt">Custom T-Shirt</a></li>
              <li><a href="/products/custom-hoodie">Custom Hoodie</a></li>
              <li><a href="/products/custom-keychain">3D Pet Keychain</a></li>
              <li><a href="/shop/">All Products</a></li>
            </ul>
          </div>
          <div className="ft-col">
            <h4>Help</h4>
            <ul>
              <li><a href="#faq">FAQ</a></li>
              <li><a href="/shipping/">Shipping Info</a></li>
              <li><a href="/returns/">Returns</a></li>
              <li><a href="/contact/">Contact Us</a></li>
            </ul>
          </div>
          <div className="ft-col">
            <h4>Company</h4>
            <ul>
              <li><a href="/about/">About Us</a></li>
              <li><a href="/privacy/">Privacy Policy</a></li>
              <li><a href="/terms/">Terms of Service</a></li>
              <li>
                <a href="https://instagram.com/petsphilia" target="_blank" rel="noopener noreferrer">
                  Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="ft-bot">
          <div className="ft-copy">Copyright © 2026 Petsphilia. Made with ❤️ in Dubai 🇦🇪</div>
          <div className="ft-legal">
            <a href="/privacy/">Privacy</a>
            <a href="/terms/">Terms</a>
            <a href="/cookies/">Cookies</a>
          </div>
        </div>
      </footer>

      {/* ── WHATSAPP BUTTON ── */}
      <a href="https://wa.me/971585573621" className="wa-btn" title="Chat on WhatsApp">
        <div className="wa-ring" />
        💬
      </a>
    </main>
  );
}
