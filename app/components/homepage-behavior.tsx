"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Props = {
  sectionIds: string[];
};

export default function HomepageBehavior({ sectionIds }: Props) {
  const [progress, setProgress] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [announcementVisible, setAnnouncementVisible] = useState(true);

  useEffect(() => {
    const onScroll = () => {
      const maxScroll = document.body.scrollHeight - window.innerHeight || 1;
      setProgress((window.scrollY / maxScroll) * 100);
      setScrolled(window.scrollY > 60);

      let current = "";
      sectionIds.forEach((id) => {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 120) current = id;
      });
      setActiveSection(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [sectionIds]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            window.setTimeout(() => entry.target.classList.add("visible"), index * 70);
          }
        });
      },
      { threshold: 0.1 },
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div className="scroll-progress" style={{ width: `${progress}%` }} />

      {announcementVisible && (
        <div className="ann-bar">
          🐾 Free delivery on orders over AED 150 across UAE &nbsp;·&nbsp;
          <a href="#products">Shop Now</a>
          <button
            type="button"
            className="ann-close"
            onClick={() => setAnnouncementVisible(false)}
            aria-label="Close announcement"
          >
            ×
          </button>
        </div>
      )}

      <header className={`home-nav${scrolled ? " scrolled" : ""}`}>
        <Link href="/" className="home-logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/legacy/home/cropped-logoAsset-5sc-197x53.png"
            alt="Petsphilia"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
              const next = e.currentTarget.nextElementSibling as HTMLElement | null;
              if (next) next.style.display = "block";
            }}
          />
          <span className="home-logo-text" style={{ display: "none" }}>
            Petsphilia
          </span>
        </Link>

        <nav className="home-nav-links">
          {sectionIds.map((id) => (
            <a key={id} href={`#${id}`} className={activeSection === id ? "active" : ""}>
              {labelForSection(id)}
            </a>
          ))}
          <a href="/shop/">Shop</a>
        </nav>

        <div className="home-nav-actions">
          <Link href="/cart" className="nav-cart-pill">
            🛒 Cart
          </Link>
          <a href="#products" className="nav-cta-pill desktop-only">
            🐾 Customize Now
          </a>
          <button
            type="button"
            className={`menu-toggle${menuOpen ? " open" : ""}`}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <div
        className={`mobile-overlay${menuOpen ? " open" : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setMenuOpen(false);
        }}
      >
        <div className="mobile-drawer">
          <div className="mobile-drawer-head">
            <span className="mobile-drawer-logo">Petsphilia</span>
            <button
              type="button"
              className="mobile-close"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            >
              ×
            </button>
          </div>

          <div className="mobile-links">
            {sectionIds.map((id) => (
              <a key={id} href={`#${id}`} onClick={() => setMenuOpen(false)}>
                {labelForSection(id)}
              </a>
            ))}
            <a href="/shop/" onClick={() => setMenuOpen(false)}>All Products</a>
          </div>

          <div className="mobile-actions">
            <a href="#products" className="mob-cta" onClick={() => setMenuOpen(false)}>
              🐾 Start Customizing
            </a>
            <Link href="/cart" className="mob-cart-btn" onClick={() => setMenuOpen(false)}>
              🛒 View Cart
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

function labelForSection(id: string) {
  const labels: Record<string, string> = {
    products: "Products",
    how: "How It Works",
    styles: "Art Styles",
    reviews: "Reviews",
    faq: "FAQ",
  };
  return labels[id] ?? id;
}
