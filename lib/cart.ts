import { cookies } from "next/headers";
import { medusa } from "./medusa";

const CART_COOKIE = "_petsphilia_cart_id";
const LOCAL_CART_COOKIE = "_petsphilia_local_cart";

export async function getOrCreateCart() {
  const cookieStore = await cookies();
  const regionId = process.env.NEXT_PUBLIC_DEFAULT_REGION_ID;
  const existingId = cookieStore.get(CART_COOKIE)?.value;

  if (existingId) {
    try {
      return await medusa.store.cart.retrieve(existingId);
    } catch {
      cookieStore.delete(CART_COOKIE);
    }
  }

  const created = await medusa.store.cart.create({ region_id: regionId });
  if (created.cart?.id) {
    cookieStore.set(CART_COOKIE, created.cart.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }

  return created;
}

/* ── Local cart (works without Medusa) ── */

export type LocalCartItem = {
  id: string;
  productHandle: string;
  productTitle: string;
  petPhotoUrl: string;
  artworkUrl: string;
  mockupUrl: string;
  artStyle: string;
  petName: string;
  size: string;
  price: string;
  addedAt: string;
};

export async function getLocalCart(): Promise<LocalCartItem[]> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(LOCAL_CART_COOKIE)?.value;
  if (!raw) return [];
  try {
    return JSON.parse(decodeURIComponent(raw)) as LocalCartItem[];
  } catch {
    return [];
  }
}

export async function addToLocalCart(item: Omit<LocalCartItem, "id" | "addedAt">) {
  const cookieStore = await cookies();
  const cart = await getLocalCart();

  const newItem: LocalCartItem = {
    ...item,
    id: crypto.randomUUID(),
    addedAt: new Date().toISOString(),
  };

  cart.push(newItem);

  cookieStore.set(LOCAL_CART_COOKIE, encodeURIComponent(JSON.stringify(cart)), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return newItem;
}

export async function removeFromLocalCart(itemId: string) {
  const cookieStore = await cookies();
  const cart = await getLocalCart();
  const updated = cart.filter((item) => item.id !== itemId);

  cookieStore.set(LOCAL_CART_COOKIE, encodeURIComponent(JSON.stringify(updated)), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

