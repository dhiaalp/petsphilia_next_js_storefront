import Link from "next/link";

export const dynamic = "force-dynamic";
import { getOrCreateCart, getLocalCart } from "@/lib/cart";
import { formatMoney } from "@/lib/medusa";
import CheckoutForm from "@/app/components/checkout-form";

/* eslint-disable @typescript-eslint/no-explicit-any */
type CartItem = any;

export default async function CheckoutPage() {
  const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
  const data = await getOrCreateCart().catch(() => null);
  const cart = data?.cart;
  const localItems = await getLocalCart();

  const hasMedusaItems = !!cart?.items?.length;
  const hasLocalItems = localItems.length > 0;
  const hasAnyItems = hasMedusaItems || hasLocalItems;

  if (!hasAnyItems) {
    return (
      <main className="checkout-page">
        <nav className="cart-nav">
          <Link href="/" className="cart-nav-logo">Petsphilia</Link>
          <Link href="/cart" className="cart-nav-back">← Back to Cart</Link>
        </nav>
        <div className="checkout-inner">
          <div className="cart-empty">
            <div className="cart-empty-icon">🛒</div>
            <h2>Nothing to checkout</h2>
            <p>Add some products to your cart first.</p>
            <Link href="/#products" className="btn-main">🐾 Start Customizing</Link>
          </div>
        </div>
      </main>
    );
  }

  // Build order summary
  const SHIPPING_COST = 15;
  const FREE_SHIPPING_THRESHOLD = 150;

  const orderItems: { title: string; variant: string; price: string; thumb?: string }[] = [];
  let subtotal = 0;

  if (hasMedusaItems) {
    for (const item of cart.items! as CartItem[]) {
      const meta = (item.metadata ?? {}) as Record<string, string>;
      orderItems.push({
        title: item.title,
        variant: item.variant?.title ?? "",
        price: formatMoney(item.unit_price, cart.currency_code),
        thumb: meta.custom_mockup || meta.custom_artwork || undefined,
      });
      subtotal += item.unit_price ?? 0;
    }
  } else {
    for (const item of localItems) {
      orderItems.push({
        title: item.productTitle,
        variant: item.size ? `Size: ${item.size}` : "",
        price: item.price,
        thumb: item.mockupUrl || item.artworkUrl || undefined,
      });
      subtotal += parseInt(item.price.replace(/[^0-9]/g, ""), 10) || 0;
    }
  }

  const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const shippingCost = freeShipping ? 0 : SHIPPING_COST;
  const total = subtotal + shippingCost;
  const currencyCode = cart?.currency_code ?? "aed";
  const subtotalDisplay = hasMedusaItems ? formatMoney(subtotal, currencyCode) : `AED ${subtotal}`;
  const shippingDisplay = freeShipping ? "FREE" : `AED ${shippingCost}`;
  const totalDisplay = hasMedusaItems ? formatMoney(total, currencyCode) : `AED ${total}`;

  return (
    <main className="checkout-page">
      <nav className="cart-nav">
        <Link href="/" className="cart-nav-logo">Petsphilia</Link>
        <Link href="/cart" className="cart-nav-back">← Back to Cart</Link>
      </nav>

      <div className="checkout-inner">
        <div className="cart-heading">
          <span className="section-kicker">Checkout</span>
          <h1>Complete Your Order</h1>
        </div>

        <div className="checkout-layout">
          <CheckoutForm
            cartId={cart?.id ?? ""}
            stripePublishableKey={stripePublishableKey}
          />

          <aside className="checkout-summary">
            <h2>Order Summary</h2>
            <div className="checkout-items">
              {orderItems.map((item, i) => (
                <div key={i} className="checkout-item">
                  {item.thumb && (
                    <div className="cart-item-thumb">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.thumb} alt="" />
                    </div>
                  )}
                  <div className="checkout-item-info">
                    <strong>{item.title}</strong>
                    {item.variant && <span>{item.variant}</span>}
                  </div>
                  <span className="checkout-item-price">{item.price}</span>
                </div>
              ))}
            </div>
            <div className="cart-summary-divider" />
            <div className="cart-summary-row">
              <span>Subtotal</span>
              <strong>{subtotalDisplay}</strong>
            </div>
            <div className="cart-summary-row">
              <span>Shipping</span>
              <strong className={freeShipping ? "cart-free-shipping" : ""}>
                {shippingDisplay}
              </strong>
            </div>
            {!freeShipping && (
              <div className="cart-shipping-hint">
                Add AED {FREE_SHIPPING_THRESHOLD - subtotal} more for free shipping
              </div>
            )}
            <div className="cart-summary-divider" />
            <div className="cart-summary-row cart-total">
              <span>Total</span>
              <strong>{totalDisplay}</strong>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
