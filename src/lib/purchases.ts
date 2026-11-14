import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import {
  fetchProducts,
  finishTransaction,
  getActiveSubscriptions,
  getAvailablePurchases,
  initConnection,
  isEligibleForIntroOfferIOS,
  isUserCancelledError,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  restorePurchases as storeRestore,
  type ProductOrSubscription,
  type Purchase,
} from 'expo-iap';

import { ALL_PRODUCT_IDS, PLAN_KIND, PRODUCT_IDS, SUBSCRIPTION_IDS, type PlanKind, type ProductId } from './config';
import { freeTrialDays, type ProductLike } from './introOffer';

let connected = false;
let plus = false;
let listenersReady = false;
const listeners = new Set<(v: boolean) => void>();

function setPlus(v: boolean) {
  plus = v;
  listeners.forEach((l) => l(v));
}

function isKnownId(id: string): id is ProductId {
  return (ALL_PRODUCT_IDS as string[]).includes(id);
}

function isCancel(error: unknown): boolean {
  try {
    if (isUserCancelledError(error)) return true;
  } catch {
    // Fall through.
  }
  const e = error as { code?: string; message?: string } | null;
  const text = `${e?.code ?? ''} ${e?.message ?? ''}`.toLowerCase();
  return text.includes('cancel') || text.includes('user-cancelled');
}

async function introEligible(product: ProductOrSubscription | undefined): Promise<boolean> {
  if (!product) return false;
  if (Platform.OS !== 'ios') return true;
  const group = (product as { subscriptionGroupIdIOS?: string | null }).subscriptionGroupIdIOS;
  if (!group) return false;
  try {
    return !!(await isEligibleForIntroOfferIOS(group));
  } catch {
    return false;
  }
}

function offerTokenFor(product: ProductOrSubscription): string | undefined {
  if ('subscriptionOffers' in product && Array.isArray(product.subscriptionOffers)) {
    const token = product.subscriptionOffers.find((offer) => offer.offerTokenAndroid)?.offerTokenAndroid;
    return token ?? undefined;
  }
  return undefined;
}

function ownedFrom(purchases: Purchase[], subs?: { productId: string; isActive?: boolean; isSuspendedAndroid?: boolean | null }[]): ProductId | null {
  for (const purchase of purchases) {
    if (
      isKnownId(purchase.productId) &&
      purchase.productId === PRODUCT_IDS.lifetime &&
      (purchase.purchaseState === 'purchased' || purchase.purchaseState === 'unknown')
    ) {
      return PRODUCT_IDS.lifetime;
    }
  }
  for (const purchase of purchases) {
    if (isKnownId(purchase.productId) && SUBSCRIPTION_IDS.includes(purchase.productId) && purchase.purchaseState !== 'pending') {
      return purchase.productId;
    }
  }
  if (subs) {
    for (const sub of subs) {
      if (isKnownId(sub.productId) && sub.isActive && !sub.isSuspendedAndroid) {
        return sub.productId;
      }
    }
  }
  return null;
}

async function refreshOwnership(): Promise<boolean> {
  if (!connected) return plus;
  try {
    const purchases = await getAvailablePurchases();
    const active = await getActiveSubscriptions([...SUBSCRIPTION_IDS]);
    const owned = ownedFrom(purchases ?? [], active ?? []);
    setPlus(Boolean(owned));
  } catch {
    // Keep the last known state. The free core still works.
  }
  return plus;
}

function attachListeners() {
  if (listenersReady) return;
  listenersReady = true;
  purchaseUpdatedListener((purchase: Purchase) => {
    void (async () => {
      try {
        await finishTransaction({ purchase, isConsumable: false });
        if (isKnownId(purchase.productId)) setPlus(true);
      } catch {
        // Restore can finish an unsaved purchase later.
      }
    })();
  });
  purchaseErrorListener((error) => {
    if (isCancel(error)) return;
  });
}

export const purchasesReady = () => connected;

export async function initPurchases() {
  if (connected || Platform.OS === 'web') return;
  try {
    connected = !!(await initConnection());
    if (!connected) return;
    attachListeners();
    await refreshOwnership();
  } catch {
    connected = false;
  }
}

export function usePlus(): boolean {
  const [v, setV] = useState(plus);
  useEffect(() => {
    listeners.add(setV);
    setV(plus);
    return () => {
      listeners.delete(setV);
    };
  }, []);
  return v;
}

export type OfferPlan = {
  id: ProductId;
  kind: PlanKind;
  price: string | null;
  product: ProductOrSubscription;
  trialDays: number | null;
};

export type Offer = Partial<Record<PlanKind, OfferPlan>>;

export async function loadOffer(): Promise<Offer> {
  if (Platform.OS === 'web') return {};
  if (!connected) {
    try {
      connected = !!(await initConnection());
      if (connected) attachListeners();
    } catch {
      return {};
    }
  }
  if (!connected) return {};
  let lifetime: ProductOrSubscription[] = [];
  let subs: ProductOrSubscription[] = [];
  try {
    lifetime = (await fetchProducts({ skus: [PRODUCT_IDS.lifetime], type: 'in-app' })) ?? [];
  } catch {
    lifetime = [];
  }
  try {
    subs = (await fetchProducts({ skus: [...SUBSCRIPTION_IDS], type: 'subs' })) ?? [];
  } catch {
    subs = [];
  }
  const byId = new Map<string, ProductOrSubscription>();
  for (const item of [...lifetime, ...subs]) {
    if (item?.id) byId.set(item.id, item);
  }
  const offer: Offer = {};
  for (const id of ALL_PRODUCT_IDS) {
    const item = byId.get(id);
    if (!item) continue;
    const kind = PLAN_KIND[id];
    const daysFromOffer = kind === 'lifetime' ? null : freeTrialDays(item as ProductLike);
    const days = daysFromOffer && (await introEligible(item)) ? daysFromOffer : null;
    offer[kind] = {
      id,
      kind,
      price: item.displayPrice ?? null,
      product: item,
      trialDays: days,
    };
  }
  return offer;
}

/** Returns true when the purchase made the user a Pro member. User cancellation returns false. */
export async function buy(id: ProductId): Promise<boolean> {
  if (!connected) return false;
  try {
    if (id === PRODUCT_IDS.lifetime) {
      await requestPurchase({
        request: { apple: { sku: id }, google: { skus: [id] } },
        type: 'in-app',
      });
    } else {
      const offer = await loadOffer();
      const item = Object.values(offer).find((p) => p?.id === id)?.product;
      const offerToken = item ? offerTokenFor(item) : undefined;
      await requestPurchase({
        request: {
          apple: { sku: id },
          google: {
            skus: [id],
            subscriptionOffers: offerToken ? [{ sku: id, offerToken }] : [],
          },
        },
        type: 'subs',
      });
    }
    return await refreshOwnership();
  } catch (err) {
    if (isCancel(err)) return false;
    throw err;
  }
}

export async function restore(): Promise<boolean> {
  if (!connected) {
    await initPurchases();
  }
  if (!connected) return false;
  await storeRestore();
  return refreshOwnership();
}
