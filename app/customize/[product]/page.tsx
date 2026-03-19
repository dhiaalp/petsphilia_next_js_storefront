import CustomizeWizard from "@/app/components/customize-wizard";
import { getProductByHandle, formatMoney } from "@/lib/medusa";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ product: string }>;
};

const fallbackInfo: Record<string, { title: string; icon: string; price: string; type: string }> = {
  "custom-mug": { title: "Custom Mug", icon: "☕", price: "AED 60", type: "pc-mug" },
  "custom-tshirt": { title: "Custom T-Shirt", icon: "👕", price: "AED 89", type: "pc-shirt" },
  "custom-hoodie": { title: "Custom Hoodie", icon: "🧥", price: "AED 120", type: "pc-hoodie" },
};

const iconMap: Record<string, string> = {
  mug: "☕",
  tshirt: "👕",
  shirt: "👕",
  hoodie: "🧥",
};

function getProductType(handle: string): string {
  if (handle.includes("tshirt") || handle.includes("shirt")) return "pc-shirt";
  if (handle.includes("hoodie")) return "pc-hoodie";
  return "pc-mug";
}

function getIcon(handle: string): string {
  for (const [key, icon] of Object.entries(iconMap)) {
    if (handle.includes(key)) return icon;
  }
  return "🎁";
}

export default async function CustomizePage({ params }: Props) {
  const { product: handle } = await params;

  // Try fetching from Medusa first
  const medusaProduct = await getProductByHandle(handle).catch(() => null);

  if (medusaProduct) {
    // Real Medusa product found — pass real variants
    const variants = (medusaProduct.variants ?? []).map((v) => ({
      id: v.id,
      title: v.title,
      price: v.calculated_price?.calculated_amount ?? 0,
      currencyCode: v.calculated_price?.currency_code ?? "aed",
    }));

    const firstPrice = variants[0];
    const priceLabel = firstPrice
      ? formatMoney(firstPrice.price, firstPrice.currencyCode)
      : "—";

    return (
      <main className="customize-page">
        <CustomizeWizard
          productHandle={handle}
          productTitle={medusaProduct.title}
          productIcon={getIcon(handle)}
          productPrice={priceLabel}
          productType={getProductType(handle)}
          variants={variants}
        />
      </main>
    );
  }

  // Fallback to hardcoded info if Medusa is unavailable
  const info = fallbackInfo[handle];

  if (!info) {
    return (
      <main className="customize-page">
        <h1>Product not found</h1>
        <a href="/" className="solid-button">Back to Home</a>
      </main>
    );
  }

  return (
    <main className="customize-page">
      <CustomizeWizard
        productHandle={handle}
        productTitle={info.title}
        productIcon={info.icon}
        productPrice={info.price}
        productType={info.type}
        variants={[]}
      />
    </main>
  );
}
