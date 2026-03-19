"use client";

import { useState } from "react";

type Props = {
  cartId: string;
};

export default function CheckoutForm({ cartId }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        body: JSON.stringify({
          cartId,
          firstName: data.get("firstName"),
          lastName: data.get("lastName"),
          email: data.get("email"),
          phone: data.get("phone"),
          address: data.get("address"),
          city: data.get("city"),
          country: "ae",
        }),
        headers: { "Content-Type": "application/json" },
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Checkout failed");

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="checkout-success">
        <div className="cw-done-icon">🎉</div>
        <h2>Order Placed!</h2>
        <p>Thank you for your order. We&apos;ll send you a confirmation email with tracking details.</p>
        <a href="/" className="btn-main">Back to Home</a>
      </div>
    );
  }

  return (
    <form className="checkout-form" onSubmit={handleSubmit}>
      <h2>Shipping Details</h2>

      {error && (
        <div className="cw-error">
          <span>⚠️</span> {error}
          <button type="button" onClick={() => setError("")}>×</button>
        </div>
      )}

      <div className="checkout-row">
        <div className="checkout-field">
          <label htmlFor="firstName">First Name</label>
          <input id="firstName" name="firstName" type="text" required placeholder="First name" />
        </div>
        <div className="checkout-field">
          <label htmlFor="lastName">Last Name</label>
          <input id="lastName" name="lastName" type="text" required placeholder="Last name" />
        </div>
      </div>

      <div className="checkout-field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required placeholder="you@example.com" />
      </div>

      <div className="checkout-field">
        <label htmlFor="phone">Phone (WhatsApp)</label>
        <input id="phone" name="phone" type="tel" required placeholder="+971 50 000 0000" />
      </div>

      <div className="checkout-field">
        <label htmlFor="address">Delivery Address</label>
        <input id="address" name="address" type="text" required placeholder="Building, Street, Area" />
      </div>

      <div className="checkout-row">
        <div className="checkout-field">
          <label htmlFor="city">City</label>
          <input id="city" name="city" type="text" required placeholder="Dubai" />
        </div>
        <div className="checkout-field">
          <label htmlFor="country">Country</label>
          <input id="country" name="country" type="text" value="United Arab Emirates" disabled />
        </div>
      </div>

      <div className="checkout-payment-note">
        <span>💵</span>
        <div>
          <strong>Cash on Delivery</strong>
          <p>Pay when your order arrives at your doorstep.</p>
        </div>
      </div>

      <button type="submit" className="cart-checkout-btn" disabled={submitting}>
        {submitting ? "Placing Order..." : "🐾 Place Order — Cash on Delivery"}
      </button>
    </form>
  );
}
