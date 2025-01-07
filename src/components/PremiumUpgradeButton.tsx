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

         // Start polling more frequently initially
         const checkPaymentStatus = setInterval(async () => {
            const isPremium = await PaymentService.checkPaymentStatus(user.uid);
            if (isPremium) {
               clearInterval(checkPaymentStatus);
               await onUpgradeSuccess();
               setLoading(false);
            }
         }, 500); // Check every 500ms

         // Stop checking after 2 minutes
         setTimeout(() => {
            clearInterval(checkPaymentStatus);
            setLoading(false);
         }, 120000);
      } catch (error) {
         console.error("Error initiating payment:", error);
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
         className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center gap-3 disabled:opacity-50 shadow-lg hover:shadow-purple-500/20"
      >
         {loading ? (
            <div className="flex items-center gap-3">
               <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
               <span className="font-medium">Processing...</span>
            </div>
         ) : (
            <>
               <span className="font-semibold">Upgrade to Premium</span>
               <span className="text-yellow-300 text-lg">⭐️</span>
               <span className="text-sm font-medium text-gray-200">
                  (₹100/month)
               </span>
            </>
         )}
      </button>
   );
}
