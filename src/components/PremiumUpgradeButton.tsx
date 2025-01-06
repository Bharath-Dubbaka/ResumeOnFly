import { useState } from "react";
import { PaymentService } from "../services/PaymentService";
import { UserData, UserQuota } from "../types/types";
import { CrownIcon } from "lucide-react";

interface PremiumUpgradeButtonProps {
   user: UserData;
   userQuota: UserQuota;
   onUpgradeSuccess: () => Promise<void>;
}

export function PremiumUpgradeButton({
   user,
   userQuota,
   onUpgradeSuccess,
}: PremiumUpgradeButtonProps) {
   const [loading, setLoading] = useState(false);

   const handleUpgradeClick = async () => {
      setLoading(true);
      try {
         const paymentLink = await PaymentService.getPaymentLink(user.uid);
         window.open(paymentLink, "_blank");

         // Start polling for payment status
         const checkPaymentStatus = setInterval(async () => {
            const isPremium = await PaymentService.checkPaymentStatus(user.uid);
            if (isPremium) {
               clearInterval(checkPaymentStatus);
               // Update the quota when payment is confirmed
               await PaymentService.updateToPremiumQuota(user.uid);
               await onUpgradeSuccess();
            }
         }, 3000); // Check every 3 seconds

         // Stop checking after 5 minutes
         setTimeout(() => {
            clearInterval(checkPaymentStatus);
            setLoading(false);
         }, 300000);
      } catch (error) {
         console.error("Error initiating payment:", error);
      } finally {
         setLoading(false);
      }
   };

   if (userQuota?.subscription?.type === "premium") {
      return (
         <div className="flex items-center gap-2 text-sm text-yellow-400">
            <CrownIcon size={16} />
            <span>Premium Member</span>
         </div>
      );
   }

   return (
      <button
         onClick={handleUpgradeClick}
         disabled={loading}
         className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
      >
         {loading ? (
            <div className="flex items-center gap-2">
               <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
               Processing...
            </div>
         ) : (
            <>
               <span>Upgrade to Premium</span>
               <span className="text-yellow-300">⭐️</span>
               <span className="text-sm font-normal">(₹100/month)</span>
            </>
         )}
      </button>
   );
}
