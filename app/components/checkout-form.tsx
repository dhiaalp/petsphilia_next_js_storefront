"use client";

import { FormEvent, useMemo, useState } from "react";
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { formatMoney } from "@/lib/medusa";

type Props = {
  cartId: string;
  stripePublishableKey: string;
};

type Receipt = {
  id: string;
  displayId?: number;
  email?: string;
  currencyCode: string;
  subtotal: number;
  shippingTotal: number;
  total: number;
};

const cardElementOptions = {
  style: {
    base: {
      fontSize: "16px",
      color: "#333333",
      fontFamily: "system-ui, sans-serif",
      "::placeholder": {
        color: "#999999",
      },
    },
    invalid: {
      color: "#dc2626",
    },
  },
};

export default function CheckoutForm({ cartId, stripePublishableKey }: Props) {
  const [initializing, setInitializing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [formValues, setFormValues] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
  });

  const stripeConfigured = Boolean(stripePublishableKey);
  const stripePromise = useMemo(
    () => (stripePublishableKey ? loadStripe(stripePublishableKey) : null),
    [stripePublishableKey],
  );
  const customerName = useMemo(
    () => `${formValues.firstName} ${formValues.lastName}`.trim(),
    [formValues.firstName, formValues.lastName],
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setInitializing(true);
    setError("");

    if (!stripeConfigured) {
      setError("Stripe is not configured yet. Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY first.");
      setInitializing(false);
      return;
    }

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        body: JSON.stringify({
          cartId,
          firstName: formValues.firstName,
          lastName: formValues.lastName,
          email: formValues.email,
          phone: formValues.phone,
          address: formValues.address,
          city: formValues.city,
          country: "ae",
        }),
        headers: { "Content-Type": "application/json" },
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Checkout failed");

      setClientSecret(result.clientSecret || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setInitializing(false);
    }
  };

  if (success) {
    return (
      <div className="checkout-success">
        <div className="cw-done-icon">🎉</div>
        <h2>Payment Received</h2>
        <p>Thank you. Your order has been paid successfully and the receipt is below.</p>
        {receipt && (
          <div className="checkout-receipt">
            <div className="checkout-receipt-row">
              <span>Order</span>
              <strong>#{receipt.displayId || receipt.id}</strong>
            </div>
            {receipt.email && (
              <div className="checkout-receipt-row">
                <span>Email</span>
                <strong>{receipt.email}</strong>
              </div>
            )}
            <div className="checkout-receipt-row">
              <span>Subtotal</span>
              <strong>{formatMoney(receipt.subtotal, receipt.currencyCode)}</strong>
            </div>
            <div className="checkout-receipt-row">
              <span>Shipping</span>
              <strong>{formatMoney(receipt.shippingTotal, receipt.currencyCode)}</strong>
            </div>
            <div className="cart-summary-divider" />
            <div className="checkout-receipt-row checkout-receipt-total">
              <span>Total Paid</span>
              <strong>{formatMoney(receipt.total, receipt.currencyCode)}</strong>
            </div>
          </div>
        )}
        <a href="/" className="btn-main">Back to Home</a>
      </div>
    );
  }

  return (
    <form className="checkout-form" onSubmit={handleSubmit}>
      <h2>{clientSecret ? "Payment Details" : "Shipping Details"}</h2>

      {error && (
        <div className="cw-error">
          <span>⚠️</span> {error}
          <button type="button" onClick={() => setError("")}>×</button>
        </div>
      )}

      <div className="checkout-row">
        <div className="checkout-field">
          <label htmlFor="firstName">First Name</label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            required
            placeholder="First name"
            value={formValues.firstName}
            disabled={Boolean(clientSecret)}
            onChange={(e) => setFormValues((prev) => ({ ...prev, firstName: e.target.value }))}
          />
        </div>
        <div className="checkout-field">
          <label htmlFor="lastName">Last Name</label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            required
            placeholder="Last name"
            value={formValues.lastName}
            disabled={Boolean(clientSecret)}
            onChange={(e) => setFormValues((prev) => ({ ...prev, lastName: e.target.value }))}
          />
        </div>
      </div>

      <div className="checkout-field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          value={formValues.email}
          disabled={Boolean(clientSecret)}
          onChange={(e) => setFormValues((prev) => ({ ...prev, email: e.target.value }))}
        />
      </div>

      <div className="checkout-field">
        <label htmlFor="phone">Phone (WhatsApp)</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          placeholder="+971 50 000 0000"
          value={formValues.phone}
          disabled={Boolean(clientSecret)}
          onChange={(e) => setFormValues((prev) => ({ ...prev, phone: e.target.value }))}
        />
      </div>

      <div className="checkout-field">
        <label htmlFor="address">Delivery Address</label>
        <input
          id="address"
          name="address"
          type="text"
          required
          placeholder="Building, Street, Area"
          value={formValues.address}
          disabled={Boolean(clientSecret)}
          onChange={(e) => setFormValues((prev) => ({ ...prev, address: e.target.value }))}
        />
      </div>

      <div className="checkout-row">
        <div className="checkout-field">
          <label htmlFor="city">City</label>
          <input
            id="city"
            name="city"
            type="text"
            required
            placeholder="Dubai"
            value={formValues.city}
            disabled={Boolean(clientSecret)}
            onChange={(e) => setFormValues((prev) => ({ ...prev, city: e.target.value }))}
          />
        </div>
        <div className="checkout-field">
          <label htmlFor="country">Country</label>
          <input id="country" name="country" type="text" value="United Arab Emirates" disabled />
        </div>
      </div>

      <div className="checkout-payment-note">
        <span>💳</span>
        <div>
          <strong>Pay Securely with Stripe</strong>
          <p>Your card is processed securely before the order is completed.</p>
        </div>
      </div>

      {!clientSecret ? (
        <button type="submit" className="cart-checkout-btn" disabled={initializing}>
          {initializing ? "Preparing Secure Checkout..." : "Continue to Payment"}
        </button>
      ) : (
        <>
          <div className="checkout-field">
            <label>Card Details</label>
            <div className="checkout-card-input">
              <Elements stripe={stripePromise}>
                <StripeCardFields
                  cartId={cartId}
                  clientSecret={clientSecret}
                  customerName={customerName}
                  email={formValues.email}
                  phone={formValues.phone}
                  city={formValues.city}
                  address={formValues.address}
                  confirming={confirming}
                  setConfirming={setConfirming}
                  setError={setError}
                  setReceipt={setReceipt}
                  onSuccess={() => setSuccess(true)}
                />
              </Elements>
            </div>
          </div>
          <button
            type="button"
            className="cart-checkout-btn"
            onClick={() => {
              setClientSecret("");
              setError("");
            }}
            disabled={confirming}
          >
            Edit Shipping Details
          </button>
        </>
      )}
    </form>
  );
}

type StripeCardFieldsProps = {
  cartId: string;
  clientSecret: string;
  customerName: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  confirming: boolean;
  setConfirming: (value: boolean) => void;
  setError: (value: string) => void;
  setReceipt: (receipt: Receipt | null) => void;
  onSuccess: () => void;
};

function StripeCardFields({
  cartId,
  clientSecret,
  customerName,
  email,
  phone,
  city,
  address,
  confirming,
  setConfirming,
  setError,
  setReceipt,
  onSuccess,
}: StripeCardFieldsProps) {
  const stripe = useStripe();
  const elements = useElements();

  const handleConfirm = async () => {
    if (!stripe || !elements) {
      setError("Stripe has not loaded yet. Please wait a moment and try again.");
      return;
    }

    const card = elements.getElement(CardElement);

    if (!card) {
      setError("Card details are missing.");
      return;
    }

    setConfirming(true);
    setError("");

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card,
          billing_details: {
            name: customerName,
            email,
            phone,
            address: {
              city,
              country: "AE",
              line1: address,
            },
          },
        },
      });

      if (error) {
        throw new Error(error.message || "Payment confirmation failed");
      }

      if (paymentIntent?.status !== "succeeded") {
        throw new Error("Payment was not completed. Please try again.");
      }

      const res = await fetch("/api/checkout/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Order completion failed");
      }

      setReceipt(data.order ?? null);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to process payment");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <>
      <CardElement options={cardElementOptions} />
      <button
        type="button"
        className="cart-checkout-btn"
        onClick={handleConfirm}
        disabled={confirming || !stripe || !elements}
      >
        {confirming ? "Processing Payment..." : "🐾 Pay with Card"}
      </button>
    </>
  );
}
