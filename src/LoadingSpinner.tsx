// import React from 'react';

const LoadingSpinner = () => {
   return (
      <div className="min-h-[600px] w-full flex flex-col items-center justify-center bg-gradient-to-b from-[#370c3e] to-[#243465] p-6 text-white">
         <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-lg font-semibold text-slate-200">
               Initializing...
            </div>
            <div className="text-sm text-slate-400">
               Please wait while we restore your session
            </div>
         </div>
      </div>
   );
};

export default LoadingSpinner;
