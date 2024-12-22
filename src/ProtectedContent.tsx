import ResumeGenerator from "./ResumeGenerator";
import { UserData, UserDetails, AnalysisResult } from "./types/types";
// import UserDetailsForm from "./UserDetailsForm";

interface ProtectedContentProps {
   user: UserData;
   userDetails: UserDetails;
   selectedText: string;
   setSelectedText: React.Dispatch<React.SetStateAction<string>>;
   analysisResult: AnalysisResult | null;
   setAnalysisResult: React.Dispatch<
      React.SetStateAction<AnalysisResult | null>
   >;
   loading: boolean;
   setLoading: React.Dispatch<React.SetStateAction<boolean>>;
   // handleSaveUserDetails: (details: UserDetails) => void;
   loginLoading: boolean;
   setLoginLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const ProtectedContent = ({
   user,
   userDetails,
   selectedText,
   // setSelectedText,
   analysisResult,
   // setAnalysisResult,
   loading,
   // setLoginLoading,
   loginLoading,
}: ProtectedContentProps) => {
   if (!user) {
      return (
         <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-blue-900/30 rounded-lg">
            <div className="text-center">
               <h3 className="text-lg font-bold mb-2">Login Required</h3>
               <p className="text-sm text-blue-200 mb-4">
                  Please sign in to analyze job descriptions
               </p>
               <button
                  // onClick={handleGoogleLogin}
                  disabled={loginLoading}
                  className="bg-blue-600 px-6 py-2 text-sm font-bold rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
               >
                  {loginLoading ? (
                     <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Signing in...
                     </div>
                  ) : (
                     <>
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                           <path
                              fill="currentColor"
                              d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                           />
                        </svg>
                        Sign in with Google
                     </>
                  )}
               </button>
            </div>
         </div>
      );
   }
   return (
      <>
         {/* Selected Text - Collapsible */}
         <div className="mb-4">
            <details className="bg-blue-800 rounded-lg">
               <summary className="cursor-pointer p-2 text-sm font-semibold">
                  {selectedText
                     ? "View Selected Job-Description"
                     : "Please select Job description, then right-click, then send to ResumeOnFly"}
               </summary>
               <div className="p-2 text-sm text-blue-200 max-h-[100px] overflow-y-auto">
                  {selectedText || "No Job description selected"}
               </div>
            </details>
         </div>
         {/* Loading State */}
         {loading && (
            <div className="flex justify-center p-2">
               <div className="animate-pulse-slow flex space-x-2">
                  <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
                  <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
                  <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
               </div>
            </div>
         )}
         {/* Analysis Results */}
         {analysisResult && (
            <div className="space-y-4">
               {/* Experience Badge */}
               <div className="flex items-center bg-green-800 p-2 rounded-lg">
                  <span className="text-sm font-semibold">
                     Experience Required:
                  </span>
                  <span className="ml-auto font-bold text-green-300">
                     {analysisResult.yearsOfExperience} years
                  </span>
               </div>
               {/* Technical Skills */}
               <div>
                  <h3 className="text-sm font-bold mb-2">Technical Skills</h3>
                  <div className="flex flex-wrap gap-1 font-semibold">
                     {analysisResult.technicalSkills.map((skill, index) => (
                        <span
                           key={index}
                           className="px-2 py-1 bg-purple-800 text-purple-200 rounded text-xs"
                        >
                           {skill}
                        </span>
                     ))}
                  </div>
               </div>
               {/* Soft Skills */}
               <div>
                  <h3 className="text-sm font-bold mb-2">Soft Skills</h3>
                  <div className="flex flex-wrap gap-1 font-semibold">
                     {analysisResult.softSkills.map((skill, index) => (
                        <span
                           key={index}
                           className="px-2 py-1 bg-blue-800 text-blue-200 rounded text-xs"
                        >
                           {skill}
                        </span>
                     ))}
                  </div>
               </div>
            </div>
         )}
         {/* Inside your ProtectedContent component, after the analysis
      results: */}
         <div>
            {/* Render UserDetailsForm if userDetails is not set */}
            {/* {!userDetails && (
            <UserDetailsForm onSave={handleSaveUserDetails} />
         )} */}
            {/* Render ResumeGenerator only if userDetails is available */}
            {userDetails && analysisResult && (
               <ResumeGenerator
                  userDetails={userDetails} // Pass userDetails here
                  technicalSkills={analysisResult.technicalSkills}
                  softSkills={analysisResult.softSkills}
                  yearsOfExperience={analysisResult.yearsOfExperience}
                  jobDescription={selectedText}
               />
            )}
         </div>
      </>
   );
};

export default ProtectedContent;
