import Image from "next/image";
import { notFound } from "next/navigation";
import { addToCart } from "@/app/actions";
import { formatMoney, getProductByHandle } from "@/lib/medusa";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const product = await getProductByHandle(handle);

  if (!product) {
    notFound();
  }

  const firstVariant = product.variants?.[0];

  return (
    <main className="product-page">
      <div className="product-page-media">
        {product.thumbnail ? (
          <Image src={product.thumbnail} alt={product.title} fill sizes="50vw" />
        ) : (
          <span>🐾</span>
        )}
      </div>

      <div className="product-page-content">
        <p className="eyebrow">Petsphilia Product</p>
        <h1>{product.title}</h1>
        <p className="lead">
          {product.description ?? product.subtitle ?? "Personalized pet artwork printed with love."}
        </p>
        <strong className="price">
          {formatMoney(
            firstVariant?.calculated_price?.calculated_amount,
            firstVariant?.calculated_price?.currency_code,
          )}
        </strong>

        <form action={addToCart} className="add-form">
          <label htmlFor="variantId">Variant</label>
          <select id="variantId" name="variantId" defaultValue={firstVariant?.id}>
            {product.variants?.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.title}
              </option>
            ))}
          </select>
          <button type="submit" className="solid-button large">
            Add to Cart
          </button>
        </form>
      </div>
    </main>
  );
}

