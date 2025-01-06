import { getFunctions, httpsCallable } from "firebase/functions";
import { getDoc, doc } from "firebase/firestore";
import { db } from "./firebase";

export class PaymentService {
   static async getPaymentLink(uid: string): Promise<string> {
      try {
         const functions = getFunctions();
         const createPaymentLink = httpsCallable(
            functions,
            "createPaymentLink"
         );
         const result = await createPaymentLink({ uid });
         return result.data as string;
      } catch (error) {
         console.error("Error getting payment link:", error);
         throw error;
      }
   }

   static async updateToPremiumQuota(uid: string): Promise<void> {
      try {
         const functions = getFunctions();
         const updateQuota = httpsCallable(functions, "updateToPremiumQuota");
         await updateQuota({ uid });
      } catch (error) {
         console.error("Error updating to premium quota:", error);
         throw error;
      }
   }

   static async checkPaymentStatus(uid: string): Promise<boolean> {
      try {
         const quotaDoc = await getDoc(doc(db, "quotas", uid));
         const quota = quotaDoc.data();
         return quota?.subscription?.type === "premium";
      } catch (error) {
         console.error("Error checking payment status:", error);
         return false;
      }
   }
}
