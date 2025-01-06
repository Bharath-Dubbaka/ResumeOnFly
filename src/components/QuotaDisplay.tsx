import { UserQuota } from "../types/types";
import { RefreshCcw } from "lucide-react";

interface QuotaDisplayProps {
   userQuota: UserQuota | null;
   onRefresh: () => Promise<void>;
}

export function QuotaDisplay({ userQuota, onRefresh }: QuotaDisplayProps) {
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
      <div className="bg-slate-800 p-4 rounded-lg">
         <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Monthly Quota</h3>
            <button
               onClick={onRefresh}
               className="p-1 hover:bg-slate-700 rounded-full"
               title="Refresh quota"
            >
               <RefreshCcw size={14} />
            </button>
         </div>

         <div className="space-y-3">
            {quotaItems.map((item) => (
               <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                     <span>{item.label}</span>
                     <span>
                        {item.used}/{item.limit}
                     </span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                     <div
                        className="h-full bg-blue-500 transition-all"
                        style={{
                           width: `${(item.used / item.limit) * 100}%`,
                           backgroundColor:
                              item.used >= item.limit ? "#ef4444" : undefined,
                        }}
                     />
                  </div>
               </div>
            ))}
         </div>
      </div>
   );
}
