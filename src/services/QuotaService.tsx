import { db } from "./firebase";
import type { UserQuota } from "../types/types";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

export class QuotaService {
   private static DEFAULT_FREE_QUOTA: UserQuota = {
      downloads: { used: 0, limit: 5 },
      generates: { used: 0, limit: 10 },
      parsing: { used: 0, limit: 15 },
      subscription: {
         type: "free" as const, // explicitly type as "free"
         startDate: new Date().toISOString(),
         endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
   };

   private static DEFAULT_PREMIUM_QUOTA: UserQuota = {
      downloads: { used: 0, limit: 100 },
      generates: { used: 0, limit: 200 },
      parsing: { used: 0, limit: 300 },
      subscription: {
         type: "premium" as const, // explicitly type as "premium"
         startDate: new Date().toISOString(),
         endDate: new Date(
            Date.now() + 365 * 24 * 60 * 60 * 1000
         ).toISOString(),
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
      // Ensure the data matches our UserQuota type
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
      return quota;
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

   static async resetQuota(uid: string): Promise<void> {
      const userRef = doc(db, "quotas", uid);
      const quota = await this.getUserQuota(uid);
      const defaultQuota =
         quota.subscription.type === "premium"
            ? this.DEFAULT_PREMIUM_QUOTA
            : this.DEFAULT_FREE_QUOTA;

      await setDoc(userRef, {
         ...defaultQuota,
         subscription: quota.subscription, // Preserve existing subscription
      });
   }
}
