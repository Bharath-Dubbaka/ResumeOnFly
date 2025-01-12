// src/services/QuotaServices.tsx
import { db } from "./firebase";
import type { UserQuota } from "../types/types";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

export class QuotaService {
   private static DEFAULT_FREE_QUOTA: UserQuota = {
      downloads: { used: 0, limit: 25 },
      generates: { used: 0, limit: 25 },
      parsing: { used: 0, limit: 25 },
      subscription: {
         type: "free" as const,
         startDate: new Date().toISOString(),
         endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
   };

   private static DEFAULT_PREMIUM_QUOTA: UserQuota = {
      downloads: { used: 0, limit: 100 },
      generates: { used: 0, limit: 150 },
      parsing: { used: 0, limit: 100 },
      subscription: {
         type: "premium" as const,
         startDate: new Date().toISOString(),
         endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
   };

   static async getUserQuota(uid: string): Promise<UserQuota> {
      const userRef = doc(db, "quotas", uid);
      const docSnap = await getDoc(userRef);

      if (!docSnap.exists()) {
         // Initialize with default free quota
         const defaultQuota = this.DEFAULT_FREE_QUOTA;
         await setDoc(userRef, defaultQuota);
         return defaultQuota;
      }

      const data = docSnap.data();
      const quota: UserQuota = {
         downloads: data.downloads,
         generates: data.generates,
         parsing: data.parsing,
         subscription: {
            type: data.subscription.type as "free" | "premium",
            startDate: data.subscription.startDate,
            endDate: data.subscription.endDate,
         },
      };

      // Check if quota needs to be refreshed
      if (await this.shouldRefreshQuota(quota)) {
         return await this.refreshQuota(uid, quota);
      }

      return quota;
   }

   private static async shouldRefreshQuota(quota: UserQuota): Promise<boolean> {
      const currentDate = new Date();
      const endDate = new Date(quota.subscription.endDate);

      // Simply check if current date is past the end date
      // This works for both free and premium users
      return currentDate > endDate;
   }

   private static async refreshQuota(
      uid: string,
      currentQuota: UserQuota
   ): Promise<UserQuota> {
      const userRef = doc(db, "quotas", uid);
      const currentDate = new Date();

      // If premium subscription has ended, revert to free
      const hasExpired =
         new Date(currentQuota.subscription.endDate) < currentDate;
      const newQuota: UserQuota = hasExpired
         ? {
              ...this.DEFAULT_FREE_QUOTA,
              subscription: {
                 type: "free" as const,
                 startDate: currentDate.toISOString(),
                 endDate: new Date(
                    currentDate.getTime() + 30 * 24 * 60 * 60 * 1000
                 ).toISOString(),
              },
           }
         : {
              ...currentQuota,
              downloads: { ...currentQuota.downloads, used: 0 },
              generates: { ...currentQuota.generates, used: 0 },
              parsing: { ...currentQuota.parsing, used: 0 },
              subscription: {
                 ...currentQuota.subscription,
                 startDate: currentDate.toISOString(),
                 endDate: new Date(
                    currentDate.getTime() + 30 * 24 * 60 * 60 * 1000
                 ).toISOString(),
              },
           };

      await setDoc(userRef, newQuota);
      return newQuota;
   }

   static async checkQuota(
      uid: string,
      type: keyof Omit<UserQuota, "subscription">
   ): Promise<boolean> {
      const quota = await this.getUserQuota(uid);
      return quota[type].used < quota[type].limit;
   }

   static async incrementUsage(
      uid: string,
      type: keyof Omit<UserQuota, "subscription">
   ): Promise<void> {
      const userRef = doc(db, "quotas", uid);
      const quota = await this.getUserQuota(uid);

      quota[type].used += 1;
      await updateDoc(userRef, {
         [`${type}.used`]: quota[type].used,
      });
   }

   static async upgradeToPremium(uid: string): Promise<void> {
      const userRef = doc(db, "quotas", uid);
      const currentDate = new Date();

      const premiumQuota = {
         ...this.DEFAULT_PREMIUM_QUOTA,
         subscription: {
            type: "premium",
            startDate: currentDate.toISOString(),
            endDate: new Date(
               currentDate.getTime() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
         },
      };

      await setDoc(userRef, premiumQuota);
   }
}
