import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
const Razorpay = require("razorpay");

export class PaymentService {
   private static razorpay = new Razorpay({
      key_id: functions.config().razorpay.key_id,
      key_secret: functions.config().razorpay.key_secret,
   });

   static async updateToPremiumQuota(uid: string, paymentId: string) {
      // Get user details from Firebase Auth
      const user = await admin.auth().getUser(uid);

      await admin
         .firestore()
         .collection("quotas")
         .doc(uid)
         .update({
            downloads: { used: 0, limit: 100 },
            generates: { used: 0, limit: 200 },
            parsing: { used: 0, limit: 300 },
            subscription: {
               type: "premium",
               startDate: new Date().toISOString(),
               endDate: new Date(
                  Date.now() + 30 * 24 * 60 * 60 * 1000
               ).toISOString(),
               paymentId: paymentId,
               userEmail: user.email,
               userName: user.displayName,
               updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
         });
   }

   static async createPaymentLink(uid: string): Promise<string> {
      try {
         // Get user details from Firebase Auth
         const user = await admin.auth().getUser(uid);

         const session = Date.now().toString();

         // Update quota doc with payment attempt
         await admin
            .firestore()
            .collection("quotas")
            .doc(uid)
            .update({
               lastPaymentAttempt: parseInt(session),
            });

         const paymentLinkData = {
            amount: 10000, // Amount in paise (₹100)
            currency: "INR",
            accept_partial: false,
            description: "PREMIUM (1month) - ResumeOnFly",
            customer: {
               name: user.displayName || uid,
               email: user.email,
               contact: user.phoneNumber || "",
            },
            notes: {
               uid: uid,
               session: session,
               userEmail: user.email,
               userName: user.displayName,
            },
            reminder_enable: true,
            notify: {
               sms: true,
               email: true,
            },
            callback_url:
               "chrome-extension://cepccnjniaighekofbjageangfeofhlg/payment-success.html",
            callback_method: "get",
         };

         const paymentLink = await this.razorpay.paymentLink.create(
            paymentLinkData
         );
         return paymentLink.short_url;
      } catch (error) {
         console.error("Error creating payment link:", error);
         throw error;
      }
   }
}
