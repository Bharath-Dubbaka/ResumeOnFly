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
            console.log(
               "Raw webhook body:",
               JSON.stringify(request.body, null, 2)
            );

            if (!request.body || !request.body.event) {
               console.error("Invalid webhook payload");
               return response.status(400).send("Invalid webhook payload");
            }

            const { event, payload } = request.body;
            console.log(
               "Event type:",
               event,
               "Payload:",
               JSON.stringify(payload, null, 2)
            );

            // Handle payment.captured event
            if (event === "payment.captured") {
               const payment = payload.payment.entity;
               if (!payment || !payment.notes) {
                  console.error("Missing payment or notes in payload");
                  return response.status(400).send("Invalid payment data");
               }

               const { uid, session } = payment.notes;
               if (!uid || !session) {
                  console.error("Missing uid or session in payment notes");
                  return response.status(400).send("Missing payment details");
               }

               console.log(
                  "Processing payment for uid:",
                  uid,
                  "session:",
                  session
               );

               const quotaDoc = await admin
                  .firestore()
                  .collection("quotas")
                  .doc(uid)
                  .get();
               if (!quotaDoc.exists) {
                  console.error("Quota document not found for uid:", uid);
                  return response.status(404).send("User quota not found");
               }

               const quota = quotaDoc.data();
               console.log("Current quota:", quota);

               // Update quota regardless of session match for now (we can add it back later)
               await PaymentService.updateToPremiumQuota(uid, payment.id);
               console.log("Successfully updated premium quota for user:", uid);
               return response.status(200).send("Success");
            }

            console.log("Unhandled event type:", event);
            return response.status(200).send("Event received but not handled");
         } catch (error: any) {
            console.error("Webhook error:", error);
            return response
               .status(500)
               .send(`Internal server error: ${error.message}`);
         }
      });
   }
);
