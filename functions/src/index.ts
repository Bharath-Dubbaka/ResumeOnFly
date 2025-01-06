import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as corsLib from "cors";
import { PaymentService } from "./PaymentService";

admin.initializeApp();

// Initialize cors middleware
const corsHandler = corsLib.default({
   origin: true,
   credentials: true,
});

export const createPaymentLink = functions.https.onRequest(
   (request, response) => {
      return corsHandler(request, response, async () => {
         try {
            const { uid } = request.body.data;
            const paymentLink = await PaymentService.createPaymentLink(uid);
            response.json({ data: paymentLink });
         } catch (error) {
            console.error("Error creating payment link:", error);
            response.status(500).json({ error: "Internal server error" });
         }
      });
   }
);

export const razorpayWebhook = functions.https.onRequest(
   async (request, response) => {
      return corsHandler(request, response, async () => {
         try {
            console.log("Raw webhook body:", request.body);
            // Razorpay sends the data in a different structure
            const { event, payload } = request.body;
            console.log("Event:", event);

            if (event === "payment.captured") {
               const { payment } = payload;
               const { notes, id: payment_id, status } = payment;
               const { uid, session } = notes;

               if (status === "captured") {
                  const quotaDoc = await admin
                     .firestore()
                     .collection("quotas")
                     .doc(uid)
                     .get();
                  const quota = quotaDoc.data();

                  if (quota?.lastPaymentAttempt === parseInt(session)) {
                     await PaymentService.updateToPremiumQuota(uid, payment_id);
                     response.status(200).send("Success");
                  } else {
                     response.status(400).send("Invalid payment session");
                  }
               }
            }
            response.status(200).send("Webhook received");
         } catch (error) {
            console.error("Webhook error:", error);
            response.status(500).send("Internal server error");
         }
      });
   }
);
