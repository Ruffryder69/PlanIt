import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  PurchasesPackage,
  LOG_LEVEL,
} from 'react-native-purchases';
import {
  REVENUECAT_API_KEY_IOS,
  REVENUECAT_API_KEY_ANDROID,
  ENTITLEMENT_PRO,
  PRODUCT_ID_PRO,
} from '../constants/revenueCat';

type PurchaseContextType = {
  isPro: boolean;
  isLoading: boolean;
  purchasePro: () => Promise<void>;
  restorePurchases: () => Promise<void>;
  paywallVisible: boolean;
  openPaywall: () => void;
  closePaywall: () => void;
};

const PurchaseContext = createContext<PurchaseContextType | null>(null);

function checkIsPro(info: CustomerInfo): boolean {
  return typeof info.entitlements.active[ENTITLEMENT_PRO] !== 'undefined';
}

export function PurchaseProvider({ children }: { children: React.ReactNode }) {
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [paywallVisible, setPaywallVisible] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        const apiKey = Platform.OS === 'ios'
          ? REVENUECAT_API_KEY_IOS
          : REVENUECAT_API_KEY_ANDROID;
        Purchases.configure({ apiKey });
        const info = await Purchases.getCustomerInfo();
        setIsPro(checkIsPro(info));
      } catch (e) {
        console.warn('RevenueCat init error:', e);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const purchasePro = useCallback(async () => {
    setIsLoading(true);
    try {
      const offerings = await Purchases.getOfferings();
      const pkg: PurchasesPackage | undefined =
        offerings.current?.availablePackages.find(
          p => p.product.identifier === PRODUCT_ID_PRO,
        ) ?? offerings.current?.availablePackages[0];

      if (!pkg) {
        Alert.alert('Fehler', 'Kein Kaufpaket gefunden. Bitte versuche es später erneut.');
        return;
      }

      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const nowPro = checkIsPro(customerInfo);
      setIsPro(nowPro);
      if (nowPro) setPaywallVisible(false);
    } catch (e: any) {
      if (!e.userCancelled) {
        Alert.alert('Kauf fehlgeschlagen', e.message ?? 'Bitte versuche es erneut.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const restorePurchases = useCallback(async () => {
    setIsLoading(true);
    try {
      const info = await Purchases.restorePurchases();
      const nowPro = checkIsPro(info);
      setIsPro(nowPro);
      if (nowPro) {
        setPaywallVisible(false);
        Alert.alert('Wiederhergestellt', 'Dein Pro-Kauf wurde wiederhergestellt.');
      } else {
        Alert.alert('Kein Kauf gefunden', 'Mit diesem Account wurde PlanIt Pro noch nicht gekauft.');
      }
    } catch (e: any) {
      Alert.alert('Fehler', e.message ?? 'Wiederherstellung fehlgeschlagen.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openPaywall = useCallback(() => setPaywallVisible(true), []);
  const closePaywall = useCallback(() => setPaywallVisible(false), []);

  return (
    <PurchaseContext.Provider value={{
      isPro, isLoading, purchasePro, restorePurchases,
      paywallVisible, openPaywall, closePaywall,
    }}>
      {children}
    </PurchaseContext.Provider>
  );
}

export function usePurchase() {
  const ctx = useContext(PurchaseContext);
  if (!ctx) throw new Error('usePurchase must be used within PurchaseProvider');
  return ctx;
}
