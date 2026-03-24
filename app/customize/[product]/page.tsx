import CustomizeWizard from "@/app/components/customize-wizard";
import KeychainWizard from "@/app/components/keychain-wizard";
import { getProductByHandle, formatMoney } from "@/lib/medusa";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ product: string }>;
};

const iconMap: Record<string, string> = {
  mug: "☕",
  tshirt: "👕",
  shirt: "👕",
  hoodie: "🧥",
  keychain: "🔑",
};

function getProductType(handle: string): string {
  if (handle.includes("tshirt") || handle.includes("shirt")) return "pc-shirt";
  if (handle.includes("hoodie")) return "pc-hoodie";
  if (handle.includes("keychain")) return "pc-keychain";
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
  const medusaProduct = await getProductByHandle(handle).catch(() => null);

  if (medusaProduct) {
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

    const isKeychain = handle.includes("keychain");

    return (
      <main className="customize-page">
        {isKeychain ? (
          <KeychainWizard
            productHandle={handle}
            productTitle={medusaProduct.title}
            productPrice={priceLabel}
            variants={variants}
          />
        ) : (
          <CustomizeWizard
            productHandle={handle}
            productTitle={medusaProduct.title}
            productIcon={getIcon(handle)}
            productPrice={priceLabel}
            productType={getProductType(handle)}
            variants={variants}
          />
        )}
      </main>
    );
  }

  return (
    <main className="customize-page">
      <h1>Product unavailable</h1>
      <p>This product could not be loaded from Medusa.</p>
      <a href="/" className="solid-button">Back to Home</a>
    </main>
  );
}
