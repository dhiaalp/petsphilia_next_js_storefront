"use client";

import Link from "next/link";
import { useState, useRef, useCallback } from "react";

type Variant = {
  id: string;
  title: string;
  price: number;
  currencyCode: string;
};

type Props = {
  productHandle: string;
  productTitle: string;
  productIcon: string;
  productPrice: string;
  productType: string;
  variants: Variant[];
};

const artStyles = [
  { id: "pencil", name: "Pencil Sketch", desc: "Classic pencil drawing", img: "pencil.png" },
  { id: "watercolor", name: "Watercolor", desc: "Soft artistic painting", img: "watercolor.png" },
  { id: "cartoon", name: "Cartoon", desc: "Fun animated style", img: "cartoon.png" },
  { id: "tattoo", name: "Tattoo Ink", desc: "Blackwork tattoo style", img: "tattoo.png" },
  { id: "vangogh", name: "Oil Paint Van Gogh", desc: "Thick brush strokes", img: "vangogh.png" },
];

type Step = "upload" | "style" | "name" | "generate" | "preview" | "done";

export default function CustomizeWizard({
  productHandle,
  productTitle,
  productIcon,
  productPrice,
  productType,
  variants,
}: Props) {
  const [step, setStep] = useState<Step>("upload");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [petName, setPetName] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedBase64, setGeneratedBase64] = useState<string | null>(null);
  const [generatedMime, setGeneratedMime] = useState<string>("image/png");
  const [mockupImage, setMockupImage] = useState<string | null>(null);
  const [mockupBase64, setMockupBase64] = useState<string | null>(null);
  const [mockupMime, setMockupMime] = useState<string>("image/png");
  const [generating, setGenerating] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const hasSize = productType === "pc-shirt" || productType === "pc-hoodie";
  const sizes = ["XS", "S", "M", "L", "XL"];

  // Find the matching variant for selected size
  const getVariantForSize = (size: string | null): Variant | undefined => {
    if (!variants.length) return undefined;
    if (!hasSize) return variants[0]; // mugs: just use first variant
    if (!size) return undefined;
    // Match variant title to size (e.g. "XS", "S", "M", "L", "XL")
    return variants.find(
      (v) => v.title.toUpperCase() === size.toUpperCase()
    ) || variants.find(
      (v) => v.title.toUpperCase().includes(size.toUpperCase())
    );
  };

  const stepOrder: Step[] = ["upload", "style", "name", "generate", "preview", "done"];
  const currentIndex = stepOrder.indexOf(step);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG, WebP)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be under 10MB");
      return;
    }
    setError(null);
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPhotoPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect],
  );

  const handleGenerate = async () => {
    if (!photoFile || !selectedStyle) return;

    setGenerating(true);
    setError(null);
    setStep("generate");

    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const base64Data = result.split(",")[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(photoFile);
      });

      const styleName = artStyles.find((s) => s.id === selectedStyle)?.name ?? selectedStyle;

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: photoFile.type,
          style: styleName,
          petName: petName || undefined,
          product: productHandle,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Generation failed");
      }

      setGeneratedBase64(data.image);
      setGeneratedMime(data.mimeType);
      setGeneratedImage(`data:${data.mimeType};base64,${data.image}`);
      if (data.mockup) {
        setMockupBase64(data.mockup);
        setMockupMime(data.mockupMimeType);
        setMockupImage(`data:${data.mockupMimeType};base64,${data.mockup}`);
      }
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStep("name");
    } finally {
      setGenerating(false);
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!generatedBase64 || addingToCart) return;

    setAddingToCart(true);
    setError(null);

    try {
      // Upload original pet photo
      let petPhotoUrl = "";
      if (photoPreview) {
        const petPhotoRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: photoPreview, mimeType: photoFile?.type || "image/jpeg" }),
        });
        const petPhotoData = await petPhotoRes.json().catch(() => null);
        if (petPhotoRes.ok && petPhotoData?.url) petPhotoUrl = petPhotoData.url;
      }

      // Upload design artwork
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: generatedBase64, mimeType: generatedMime }),
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error("Failed to save artwork");
      const artworkUrl = uploadData.url;

      // Upload mockup image if available
      let mockupUrl = "";
      if (mockupBase64) {
        const mockupRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: mockupBase64, mimeType: mockupMime }),
        });
        const mockupData = await mockupRes.json().catch(() => null);
        if (mockupRes.ok && mockupData?.url) mockupUrl = mockupData.url;
      }

      // Find the right variant
      const variant = getVariantForSize(hasSize ? selectedSize : null);
      const variantId = variant?.id ?? "";

      // Add to cart
      const formData = new FormData();
      formData.set("variantId", variantId);
      formData.set("petPhotoUrl", petPhotoUrl);
      formData.set("artworkUrl", artworkUrl);
      formData.set("mockupUrl", mockupUrl);
      formData.set("artStyle", artStyles.find((s) => s.id === selectedStyle)?.name ?? "");
      formData.set("petName", petName);
      if (hasSize && selectedSize) formData.set("size", selectedSize);
      formData.set("productHandle", productHandle);

      const res = await fetch("/api/cart/add", {
        method: "POST",
        body: formData,
      });

      const resData = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(resData?.error || "Failed to add to cart");
      }

      setAddingToCart(false);
      setStep("done");
    } catch (err) {
      setAddingToCart(false);
      setError(err instanceof Error ? err.message : "Failed to add to cart");
    }
  };

  const handleRegenerate = () => {
    setGeneratedImage(null);
    setGeneratedBase64(null);
    setMockupImage(null);
    setMockupBase64(null);
    setStep("name");
  };

  const stepLabels = ["Upload", "Style", "Details", "Generate", "Preview"];

  return (
    <div className="cw-wrapper">
      {/* Header */}
      <div className="cw-header">
        <Link href="/" className="cw-back">
          ← Back
        </Link>
        <div className="cw-product-badge">
          <span className="cw-product-icon">{productIcon}</span>
          <div>
            <strong>{productTitle}</strong>
            <span>{productPrice}</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {step !== "done" && (
        <div className="cw-progress">
          {stepLabels.map((label, i) => (
            <div
              key={label}
              className={`cw-progress-step${i <= currentIndex ? " active" : ""}${i < currentIndex ? " done" : ""}`}
            >
              <div className="cw-progress-dot">
                {i < currentIndex ? "✓" : i + 1}
              </div>
              <span>{label}</span>
            </div>
          ))}
          <div className="cw-progress-line">
            <div
              className="cw-progress-fill"
              style={{ width: `${(currentIndex / (stepLabels.length - 1)) * 100}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="cw-error">
          <span>⚠️</span> {error}
          <button type="button" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Step 1: Upload */}
      {step === "upload" && (
        <div className="cw-step">
          <div className="cw-step-heading">
            <h1>Upload Your Pet&apos;s Photo</h1>
            <p>A clear, well-lit photo works best. Make sure your pet&apos;s face is fully visible.</p>
          </div>

          <div
            className={`cw-dropzone${dragOver ? " drag-over" : ""}${photoPreview ? " has-photo" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {photoPreview ? (
              <div className="cw-photo-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoPreview} alt="Your pet" />
                <button
                  type="button"
                  className="cw-photo-change"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPhotoFile(null);
                    setPhotoPreview(null);
                  }}
                >
                  Change Photo
                </button>
              </div>
            ) : (
              <div className="cw-dropzone-content">
                <div className="cw-dropzone-icon">📸</div>
                <p className="cw-dropzone-title">Drop your pet&apos;s photo here</p>
                <p className="cw-dropzone-sub">or click to browse</p>
                <span className="cw-dropzone-hint">JPG, PNG, WebP · Max 10MB</span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />
          </div>

          <div className="cw-tips">
            <h3>Tips for best results</h3>
            <div className="cw-tips-grid">
              <div className="cw-tip">✅ Clear, well-lit photo</div>
              <div className="cw-tip">✅ Pet facing camera</div>
              <div className="cw-tip">✅ Single pet per photo</div>
              <div className="cw-tip">❌ Blurry or dark photos</div>
            </div>
          </div>

          <button
            type="button"
            className="cw-next-btn"
            disabled={!photoPreview}
            onClick={() => setStep("style")}
          >
            Continue — Choose Style <span className="arr">→</span>
          </button>
        </div>
      )}

      {/* Step 2: Style */}
      {step === "style" && (
        <div className="cw-step">
          <div className="cw-step-heading">
            <h1>Choose Your Art Style</h1>
            <p>Each style gives your pet a completely different look. Pick the one you love!</p>
          </div>

          <div className="cw-styles-grid">
            {artStyles.map((style) => (
              <button
                key={style.id}
                type="button"
                className={`cw-style-card${selectedStyle === style.id ? " selected" : ""}`}
                onClick={() => setSelectedStyle(style.id)}
              >
                <div className="cw-style-img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/legacy/styles/${style.img}`}
                    alt={style.name}
                  />
                </div>
                <div className="cw-style-info">
                  <strong>{style.name}</strong>
                  <span>{style.desc}</span>
                </div>
                {selectedStyle === style.id && (
                  <div className="cw-style-check">✓</div>
                )}
              </button>
            ))}
          </div>

          <div className="cw-step-actions">
            <button type="button" className="cw-back-btn" onClick={() => setStep("upload")}>
              ← Back
            </button>
            <button
              type="button"
              className="cw-next-btn"
              disabled={!selectedStyle}
              onClick={() => setStep("name")}
            >
              Continue — Pet Details <span className="arr">→</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Name (optional) */}
      {step === "name" && (
        <div className="cw-step">
          <div className="cw-step-heading">
            <h1>Add Your Pet&apos;s Name</h1>
            <p>Optional — we can add your pet&apos;s name as a subtle detail in the artwork.</p>
          </div>

          <div className="cw-name-section">
            <div className="cw-preview-summary">
              <div className="cw-summary-photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {photoPreview && <img src={photoPreview} alt="Your pet" />}
              </div>
              <div className="cw-summary-details">
                <div className="cw-summary-item">
                  <span className="cw-summary-label">Product</span>
                  <span>{productIcon} {productTitle}</span>
                </div>
                <div className="cw-summary-item">
                  <span className="cw-summary-label">Style</span>
                  <span>🎨 {artStyles.find((s) => s.id === selectedStyle)?.name}</span>
                </div>
                <div className="cw-summary-item">
                  <span className="cw-summary-label">Price</span>
                  <strong>{productPrice}</strong>
                </div>
              </div>
            </div>

            <div className="cw-name-input-wrap">
              <label htmlFor="petName">Pet&apos;s Name <span className="cw-optional">(optional)</span></label>
              <input
                id="petName"
                type="text"
                placeholder="e.g. Buddy, Luna, Milo..."
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                maxLength={30}
              />
            </div>
          </div>

          <div className="cw-step-actions">
            <button type="button" className="cw-back-btn" onClick={() => setStep("style")}>
              ← Back
            </button>
            <button type="button" className="cw-generate-btn" onClick={handleGenerate}>
              ✨ Generate Artwork
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Generating */}
      {step === "generate" && generating && (
        <div className="cw-step cw-generating">
          <div className="cw-loader">
            <div className="cw-loader-spinner" />
            <h2>Creating your artwork...</h2>
            <p>Our AI is transforming your pet into a {artStyles.find((s) => s.id === selectedStyle)?.name} masterpiece.</p>
            <div className="cw-loader-sub">This usually takes 20–40 seconds</div>
          </div>
        </div>
      )}

      {/* Step 5: Preview */}
      {step === "preview" && generatedImage && (
        <div className="cw-step">
          <div className="cw-step-heading">
            <h1>Your Artwork is Ready!</h1>
            <p>Here&apos;s how your pet looks in {artStyles.find((s) => s.id === selectedStyle)?.name} style.</p>
          </div>

          <div className="cw-preview-area">
            {/* Before / After comparison */}
            <div className="cw-preview-card">
              <div className="cw-preview-before">
                <span className="cw-preview-label">Original</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {photoPreview && <img src={photoPreview} alt="Original pet photo" />}
              </div>
              <div className="cw-preview-arrow">→</div>
              <div className="cw-preview-after">
                <span className="cw-preview-label">
                  {artStyles.find((s) => s.id === selectedStyle)?.name}
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={generatedImage} alt="Generated artwork" />
              </div>
            </div>

            {/* Realistic AI-generated product mockup */}
            {mockupImage && (
              <div className="cw-mockup-section">
                <h3 className="cw-mockup-title">{productIcon} How it looks on your {productTitle}</h3>
                <div className="cw-mockup-realistic">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mockupImage} alt={`${productTitle} with your artwork`} />
                  <div className="cw-mockup-info">
                    <span className="cw-mockup-product-name">{productTitle}</span>
                    <span className="cw-mockup-product-price">{productPrice}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Size selector for t-shirts and hoodies */}
          {hasSize && (
            <div className="cw-size-section">
              <h3 className="cw-size-title">Select Size</h3>
              <div className="cw-size-options">
                {sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={`cw-size-btn${selectedSize === size ? " selected" : ""}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {!variants.length && (
                <p className="cw-size-note">Sizes will be confirmed at checkout</p>
              )}
            </div>
          )}

          <div className="cw-step-actions cw-preview-actions">
            <button type="button" className="cw-back-btn" onClick={handleRegenerate}>
              🔄 Regenerate
            </button>
            <button
              type="button"
              className="cw-cart-btn"
              disabled={(hasSize && !selectedSize) || addingToCart}
              onClick={handleAddToCart}
            >
              {addingToCart ? "Adding..." : `🛒 Add to Cart — ${productPrice}`}
            </button>
          </div>
        </div>
      )}

      {/* Step 6: Added to Cart */}
      {step === "done" && (
        <div className="cw-step cw-done">
          <div className="cw-done-content">
            <div className="cw-done-icon">🎉</div>
            <h1>Added to Cart!</h1>
            <p>
              Your custom {productTitle}
              {hasSize && selectedSize ? ` (${selectedSize})` : ""} with personalized artwork is ready for checkout.
            </p>

            <div className="cw-done-actions">
              <Link href="/cart" className="cw-cart-btn">
                🛒 View Cart & Checkout
              </Link>
              <Link href="/#products" className="cw-continue-btn">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
