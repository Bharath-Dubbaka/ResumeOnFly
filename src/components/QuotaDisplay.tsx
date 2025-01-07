import { useState } from "react";
import { UserQuota } from "../types/types";
// import { RefreshCcw } from "lucide-react";
import { CrownIcon } from "lucide-react";
import { PaymentService } from "../services/PaymentService";
import { UserData } from "../types/types";

interface QuotaDisplayProps {
   userQuota: UserQuota | null;
   onRefresh: () => Promise<void>;
   user: UserData;
   onUpgradeSuccess: () => Promise<void>;
}

export function QuotaDisplay({
   userQuota,
   // onRefresh,
   user,
   onUpgradeSuccess,
}: QuotaDisplayProps) {
   const [loading, setLoading] = useState(false);

   const handleUpgradeClick = async () => {
      setLoading(true);
      try {
         const paymentLink = await PaymentService.getPaymentLink(user.uid);
         window.open(paymentLink, "_blank");

         const checkPaymentStatus = setInterval(async () => {
            const isPremium = await PaymentService.checkPaymentStatus(user.uid);
            if (isPremium) {
               clearInterval(checkPaymentStatus);
               await onUpgradeSuccess();
               setLoading(false);
            }
         }, 500);

         setTimeout(() => {
            clearInterval(checkPaymentStatus);
            setLoading(false);
         }, 120000);
      } catch (error) {
         console.error("Error initiating payment:", error);
         setLoading(false);
      }
   };

   if (!userQuota) return null;

   const quotaItems = [
      {
         label: "Parsing",
         used: userQuota.parsing.used,
         limit: userQuota.parsing.limit,
      },
      {
         label: "Generates",
         used: userQuota.generates.used,
         limit: userQuota.generates.limit,
      },
      {
         label: "Downloads",
         used: userQuota.downloads.used,
         limit: userQuota.downloads.limit,
      },
   ];

   return (
      <div className="w-[24%] bg-slate-800/80 backdrop-blur-sm m-2 p-3 rounded-xl shadow-lg">
         <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-700/50">
            {userQuota?.subscription?.type === "premium" ? (
               <div className="w-full p-1 bg-black/20 flex justify-center items-center gap-2 text-yellow-400 rounded-sm ">
                  <CrownIcon size={18} />
                  <span className="font-medium">Premium Member</span>
               </div>
            ) : (
               <div className="w-full">
                  {/* <h3 className="text-base font-semibold text-gray-400">
                     Free Plan
                  </h3> */}
                  <div className="relative group">
                     <button
                        onClick={handleUpgradeClick}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-2 py-1 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg hover:shadow-purple-500/20"
                     >
                        {loading ? (
                           <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span className="font-medium">Processing...</span>
                           </div>
                        ) : (
                           <>
                              <div className="flex flex-col">
                                 <span className="font-medium">
                                    Upgrade to Premium ⭐️
                                 </span>
                                 <span className="text-sm font-normal">
                                    (₹100/month)
                                 </span>
                              </div>
                           </>
                        )}
                     </button>
                     {/* Tooltip */}
                     <div className="absolute left-0 top-[50px] mt-1 w-[180px] px-2 py-1 bg-gray-700 text-gray-100 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        Upgrade to Premium: Get{" "}
                        <span className="font-bold">300</span>:Parsing,{" "}
                        <span className="font-bold">200</span>:Generates, and{" "}
                        <span className="font-bold">100</span>:Downloads in a
                        month
                     </div>
                  </div>
               </div>
            )}
         </div>

         <div className="px-1.5">
            {quotaItems.map((item) => (
               <div key={item.label} className="mb-1">
                  <div className="flex justify-between text-sm">
                     <span className="text-gray-300">{item.label}</span>
                     <span className="text-gray-200 font-medium">
                        {item.used}/{item.limit}
                     </span>
                  </div>
                  <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                     <div
                        className="h-full transition-all duration-300 ease-out"
                        style={{
                           width: `${(item.used / item.limit) * 100}%`,
                           backgroundColor:
                              item.used >= item.limit
                                 ? "#ef4444"
                                 : item.used > item.limit * 0.8
                                 ? "#eab308"
                                 : "#3b82f6",
                        }}
                     />
                  </div>
               </div>
            ))}
         </div>

         {/* {userQuota?.subscription?.type !== "premium" && (
            <div className="mt-5 pt-4 border-t border-slate-700/50">
               
            </div>
         )} */}
      </div>
   );
}
