"use client";

import Link from "next/link";
import Script from "next/script";
import { useState, useRef, useCallback, useEffect } from "react";

type Variant = {
  id: string;
  title: string;
  price: number;
  currencyCode: string;
};

type Props = {
  productHandle: string;
  productTitle: string;
  productPrice: string;
  variants: Variant[];
};

type Step = "upload" | "generate-sculpture" | "preview-sculpture" | "generate-3d" | "preview-3d" | "done";

export default function KeychainWizard({
  productHandle,
  productTitle,
  productPrice,
  variants,
}: Props) {
  const [step, setStep] = useState<Step>("upload");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [petName, setPetName] = useState("");
  const [sculptureImage, setSculptureImage] = useState<string | null>(null);
  const [sculptureBase64, setSculptureBase64] = useState<string | null>(null);
  const [sculptureMime, setSculptureMime] = useState<string>("image/png");
  const [meshyTaskId, setMeshyTaskId] = useState<string | null>(null);
  const [meshyProgress, setMeshyProgress] = useState(0);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generating3d, setGenerating3d] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const stepLabels = ["Upload", "Sculpture", "Preview", "3D Model", "3D Preview"];
  const stepOrder: Step[] = ["upload", "generate-sculpture", "preview-sculpture", "generate-3d", "preview-3d", "done"];
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

  // Single call: Generate sculpture via Gemini + start Meshy 3D, all server-side
  const handleGenerate = async () => {
    if (!photoFile) return;

    setGenerating(true);
    setError(null);
    setStep("generate-sculpture");

    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(photoFile);
      });

      const res = await fetch("/api/meshy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: photoFile.type,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sculpture generation failed");

      // Set sculpture preview
      setSculptureBase64(data.sculptureImage);
      setSculptureMime(data.sculptureMimeType);
      setSculptureImage(`data:${data.sculptureMimeType};base64,${data.sculptureImage}`);
      setGenerating(false);

      // If Meshy task started successfully, begin polling
      if (data.taskId) {
        setStep("generate-3d");
        setGenerating3d(true);
        setMeshyTaskId(data.taskId);
        startPolling(data.taskId);
      } else {
        // Meshy failed but sculpture is ready — show preview with option to retry
        setStep("preview-sculpture");
        if (data.meshyError) setError(data.meshyError);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStep("upload");
      setGenerating(false);
    }
  };

  const startPolling = (taskId: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const pollRes = await fetch(`/api/meshy?taskId=${taskId}`);
        const pollData = await pollRes.json();

        if (!pollRes.ok) return;

        setMeshyProgress(pollData.progress);

        if (pollData.status === "SUCCEEDED") {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          setModelUrl(pollData.modelUrl);
          setThumbnailUrl(pollData.thumbnailUrl);
          setGenerating3d(false);
          setStep("preview-3d");
        } else if (pollData.status === "FAILED" || pollData.status === "EXPIRED") {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          setGenerating3d(false);
          setError("3D model generation failed. Please try again.");
          setStep("preview-sculpture");
        }
      } catch {
        // Silently retry on poll errors
      }
    }, 5000);
  };

  // Retry Meshy from the sculpture preview (if first attempt failed)
  const handleRetryMeshy = async () => {
    if (!sculptureBase64) return;
    setGenerating3d(true);
    setError(null);
    setStep("generate-3d");

    try {
      // Re-send the original photo to regenerate everything server-side
      // For retry, we need the original photo again
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(photoFile!);
      });

      const res = await fetch("/api/meshy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: photoFile!.type,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      if (data.taskId) {
        setMeshyTaskId(data.taskId);
        startPolling(data.taskId);
      } else {
        setGenerating3d(false);
        setError(data.meshyError || "Failed to start 3D generation");
        setStep("preview-sculpture");
      }
    } catch (err) {
      setGenerating3d(false);
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStep("preview-sculpture");
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!modelUrl || addingToCart) return;

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

      // Upload sculpture image
      let artworkUrl = "";
      if (sculptureBase64) {
        const artRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: sculptureBase64, mimeType: sculptureMime }),
        });
        const artData = await artRes.json().catch(() => null);
        if (artRes.ok && artData?.url) artworkUrl = artData.url;
      }

      const variant = variants[0];
      const variantId = variant?.id ?? "";

      const formData = new FormData();
      formData.set("variantId", variantId);
      formData.set("petPhotoUrl", petPhotoUrl);
      formData.set("artworkUrl", artworkUrl);
      formData.set("mockupUrl", thumbnailUrl || "");
      formData.set("artStyle", "3D Keychain Sculpture");
      formData.set("petName", petName);
      formData.set("productHandle", productHandle);
      formData.set("modelUrl", modelUrl);

      const res = await fetch("/api/cart/add", {
        method: "POST",
        body: formData,
      });

      const resData = await res.json().catch(() => null);
      if (!res.ok) throw new Error(resData?.error || "Failed to add to cart");

      setAddingToCart(false);
      setStep("done");
    } catch (err) {
      setAddingToCart(false);
      setError(err instanceof Error ? err.message : "Failed to add to cart");
    }
  };

  const handleRegenerate = () => {
    setSculptureImage(null);
    setSculptureBase64(null);
    setModelUrl(null);
    setThumbnailUrl(null);
    setMeshyTaskId(null);
    setMeshyProgress(0);
    if (pollRef.current) clearInterval(pollRef.current);
    setStep("upload");
  };

  return (
    <div className="cw-wrapper">
      <Script
        src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js"
        type="module"
      />

      {/* Header */}
      <div className="cw-header">
        <Link href="/" className="cw-back">
          ← Back
        </Link>
        <div className="cw-product-badge">
          <span className="cw-product-icon">🔑</span>
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
            <p>We&apos;ll transform your pet into a collectible 3D keychain sculpture.</p>
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

          <div className="cw-name-input-wrap" style={{ marginTop: "1.5rem" }}>
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

          <div className="cw-tips">
            <h3>Tips for best results</h3>
            <div className="cw-tips-grid">
              <div className="cw-tip">✅ Clear, well-lit photo</div>
              <div className="cw-tip">✅ Full body visible</div>
              <div className="cw-tip">✅ Single pet per photo</div>
              <div className="cw-tip">❌ Blurry or dark photos</div>
            </div>
          </div>

          <button
            type="button"
            className="cw-next-btn"
            disabled={!photoPreview}
            onClick={handleGenerate}
          >
            ✨ Generate 3D Sculpture <span className="arr">→</span>
          </button>
        </div>
      )}

      {/* Step 2: Generating Sculpture */}
      {step === "generate-sculpture" && generating && (
        <div className="cw-step cw-generating">
          <div className="cw-loader">
            <div className="cw-loader-spinner" />
            <h2>Creating your sculpture design...</h2>
            <p>Our AI is transforming your pet into a collectible resin sculpture.</p>
            <div className="cw-loader-sub">This usually takes 20–40 seconds</div>
          </div>
        </div>
      )}

      {/* Step 3: Preview Sculpture */}
      {step === "preview-sculpture" && sculptureImage && (
        <div className="cw-step">
          <div className="cw-step-heading">
            <h1>Your Sculpture Design is Ready!</h1>
            <p>Here&apos;s how your pet looks as a collectible keychain sculpture.</p>
          </div>

          <div className="cw-preview-area">
            <div className="cw-preview-card">
              <div className="cw-preview-before">
                <span className="cw-preview-label">Original</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {photoPreview && <img src={photoPreview} alt="Original pet photo" />}
              </div>
              <div className="cw-preview-arrow">→</div>
              <div className="cw-preview-after">
                <span className="cw-preview-label">Sculpture Design</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sculptureImage} alt="Sculpture design" />
              </div>
            </div>
          </div>

          <div className="cw-step-actions cw-preview-actions">
            <button type="button" className="cw-back-btn" onClick={handleRegenerate}>
              🔄 Regenerate
            </button>
            <button
              type="button"
              className="cw-next-btn"
              onClick={handleRetryMeshy}
            >
              🎯 Generate 3D Model <span className="arr">→</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Generating 3D Model */}
      {step === "generate-3d" && generating3d && (
        <div className="cw-step cw-generating">
          <div className="cw-loader">
            <div className="cw-loader-spinner" />
            <h2>Building your 3D model...</h2>
            <p>Meshy AI is turning your sculpture into a real 3D model.</p>
            <div className="kw-progress-bar">
              <div className="kw-progress-fill" style={{ width: `${meshyProgress}%` }} />
            </div>
            <div className="cw-loader-sub">{meshyProgress}% complete · This may take 2–4 minutes</div>
          </div>
        </div>
      )}

      {/* Step 5: 3D Preview */}
      {step === "preview-3d" && modelUrl && (
        <div className="cw-step">
          <div className="cw-step-heading">
            <h1>Your 3D Keychain is Ready!</h1>
            <p>Interact with your 3D model below — rotate, zoom, and inspect every angle.</p>
          </div>

          <div className="kw-3d-viewer-wrap">
            {/* @ts-expect-error model-viewer is a web component */}
            <model-viewer
              src={modelUrl}
              alt={`3D keychain of ${petName || "your pet"}`}
              auto-rotate
              auto-rotate-delay="0"
              rotation-per-second="30deg"
              camera-controls
              touch-action="pan-y"
              interaction-prompt="auto"
              interaction-prompt-threshold="0"
              poster={thumbnailUrl || undefined}
              shadow-intensity="1.2"
              shadow-softness="0.8"
              exposure="1.1"
              environment-image="neutral"
              camera-orbit="0deg 75deg 105%"
              min-camera-orbit="auto auto 50%"
              max-camera-orbit="Infinity 150deg 300%"
              field-of-view="30deg"
              interpolation-decay="100"
              style={{
                width: "100%",
                height: "500px",
                borderRadius: "16px",
                background: "radial-gradient(ellipse at center, #fafafa 0%, #e8e8e8 70%, #d4d4d4 100%)",
              }}
            />
            <div className="kw-viewer-controls-hint">
              <span>🖱 Drag to rotate</span>
              <span>🔍 Scroll to zoom</span>
              <span>⇧ + Drag to pan</span>
            </div>
          </div>

          {sculptureImage && (
            <div className="kw-comparison">
              <div className="kw-comparison-item">
                <span>Original Photo</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {photoPreview && <img src={photoPreview} alt="Original" />}
              </div>
              <div className="kw-comparison-item">
                <span>Sculpture Design</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sculptureImage} alt="Sculpture" />
              </div>
            </div>
          )}

          <div className="cw-step-actions cw-preview-actions">
            <button type="button" className="cw-back-btn" onClick={handleRegenerate}>
              🔄 Start Over
            </button>
            <button
              type="button"
              className="cw-cart-btn"
              disabled={addingToCart}
              onClick={handleAddToCart}
            >
              {addingToCart ? "Adding..." : `🛒 Add to Cart — ${productPrice}`}
            </button>
          </div>
        </div>
      )}

      {/* Step 6: Done */}
      {step === "done" && (
        <div className="cw-step cw-done">
          <div className="cw-done-content">
            <div className="cw-done-icon">🎉</div>
            <h1>Added to Cart!</h1>
            <p>
              Your custom 3D {productTitle} with personalized sculpture is ready for checkout.
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
