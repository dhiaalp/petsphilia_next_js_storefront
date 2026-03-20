import Link from "next/link";

export const dynamic = "force-dynamic";
import { getOrCreateCart, getLocalCart } from "@/lib/cart";
import { formatMoney } from "@/lib/medusa";

/* eslint-disable @typescript-eslint/no-explicit-any */
type CartItem = any;

export default async function CartPage() {
  const data = await getOrCreateCart().catch(() => null);
  const cart = data?.cart;
  const localItems = await getLocalCart();

  const hasMedusaItems = !!cart?.items?.length;
  const hasLocalItems = localItems.length > 0;
  const hasAnyItems = hasMedusaItems || hasLocalItems;

  return (
    <main className="cart-page">
      <nav className="cart-nav">
        <Link href="/" className="cart-nav-logo">Petsphilia</Link>
        <Link href="/" className="cart-nav-back">← Continue Shopping</Link>
      </nav>

      <div className="cart-page-inner">
        <div className="cart-heading">
          <span className="section-kicker">Cart</span>
          <h1>Your Petsphilia Cart</h1>
        </div>

        {!hasAnyItems ? (
          <div className="cart-empty">
            <div className="cart-empty-icon">🛒</div>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven&apos;t added any customized products yet.</p>
            <Link href="/#products" className="btn-main">
              🐾 Start Customizing
            </Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-items">
              {/* Medusa cart items */}
              {hasMedusaItems && cart.items!.map((item: CartItem) => {
                const meta = (item.metadata ?? {}) as Record<string, string>;
                const isCustom = String(meta.is_customized) === "true";
                const artworkUrl = meta.custom_artwork;
                const mockupUrl = meta.custom_mockup;
                const artStyle = meta.art_style;
                const petNameMeta = meta.pet_name;

                return (
                  <article key={item.id} className="cart-item">
                    {isCustom && (mockupUrl || artworkUrl) && (
                      <div className="cart-item-thumb">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={mockupUrl || artworkUrl} alt="Custom artwork" />
                      </div>
                    )}
                    <div className="cart-item-info">
                      <h2>{item.title}</h2>
                      <p>{item.variant?.title}</p>
                      {isCustom && (
                        <div className="cart-item-custom">
                          {artStyle && <span className="cart-custom-tag">🎨 {artStyle}</span>}
                          {petNameMeta && <span className="cart-custom-tag">🐾 {petNameMeta}</span>}
                        </div>
                      )}
                      <form action="/api/cart/remove" method="POST" className="cart-item-remove-form">
                        <input type="hidden" name="lineItemId" value={item.id} />
                        <button type="submit" className="cart-item-remove">
                          Remove
                        </button>
                      </form>
                    </div>
                    <strong className="cart-item-price">
                      {formatMoney(item.unit_price, cart.currency_code)}
                    </strong>
                  </article>
                );
              })}

              {/* Local cart items (when Medusa isn't available) */}
              {localItems.map((item) => (
                <article key={item.id} className="cart-item">
                  {(item.mockupUrl || item.artworkUrl) && (
                    <div className="cart-item-thumb">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.mockupUrl || item.artworkUrl} alt="Custom artwork" />
                    </div>
                  )}
                  <div className="cart-item-info">
                    <h2>{item.productTitle}</h2>
                    {item.size && <p>Size: {item.size}</p>}
                    <div className="cart-item-custom">
                      {item.artStyle && <span className="cart-custom-tag">🎨 {item.artStyle}</span>}
                      {item.petName && <span className="cart-custom-tag">🐾 {item.petName}</span>}
                    </div>
                    <form action="/api/cart/remove" method="POST" className="cart-item-remove-form">
                      <input type="hidden" name="localItemId" value={item.id} />
                      <button type="submit" className="cart-item-remove">
                        Remove
                      </button>
                    </form>
                  </div>
                  <strong className="cart-item-price">{item.price}</strong>
                </article>
              ))}
            </div>

            <aside className="cart-summary">
              <h2>Order Summary</h2>

              {hasMedusaItems && (
                <>
                  <div className="cart-summary-row">
                    <span>Subtotal</span>
                    <strong>{formatMoney(cart.subtotal, cart.currency_code)}</strong>
                  </div>
                  <div className="cart-summary-row">
                    <span>Shipping</span>
                    <span className="cart-shipping-note">Calculated at checkout</span>
                  </div>
                  <div className="cart-summary-divider" />
                  <div className="cart-summary-row cart-total">
                    <span>Total</span>
                    <strong>{formatMoney(cart.total, cart.currency_code)}</strong>
                  </div>
                </>
              )}

              {!hasMedusaItems && hasLocalItems && (
                <>
                  {localItems.map((item) => (
                    <div key={item.id} className="cart-summary-row">
                      <span>{item.productTitle}{item.size ? ` (${item.size})` : ""}</span>
                      <strong>{item.price}</strong>
                    </div>
                  ))}
                  <div className="cart-summary-row">
                    <span>Shipping</span>
                    <span className="cart-shipping-note">Calculated at checkout</span>
                  </div>
                  <div className="cart-summary-divider" />
                  <div className="cart-summary-row cart-total">
                    <span>Total</span>
                    <strong>
                      {localItems.reduce((sum, item) => {
                        const num = parseInt(item.price.replace(/[^0-9]/g, ""), 10) || 0;
                        return sum + num;
                      }, 0) > 0
                        ? `AED ${localItems.reduce((sum, item) => {
                            const num = parseInt(item.price.replace(/[^0-9]/g, ""), 10) || 0;
                            return sum + num;
                          }, 0)}`
                        : "—"}
                    </strong>
                  </div>
                </>
              )}

              <Link href="/checkout" className="cart-checkout-btn">
                Proceed to Checkout
              </Link>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
