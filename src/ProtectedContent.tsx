import ResumeGenerator from "./ResumeGenerator";
import { UserData, UserDetails, AnalysisResult } from "./types/types";
// import UserDetailsForm from "./UserDetailsForm";
import { useState, useEffect, useRef } from "react";
import { MapIcon, Trash2, PlusCircle } from "lucide-react";

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
   refreshUserQuota: () => Promise<void>;
   totalExperience: string | number;
}

// Add this interface for skill mapping
interface SkillMapping {
   skill: string;
   experienceMappings: string[]; // Array of experience titles where this skill should be used
}

const ProtectedContent = ({
   user,
   userDetails,
   selectedText,
   // setSelectedText,
   analysisResult,
   refreshUserQuota,
   setAnalysisResult,
   loading,
   // setLoginLoading,
   loginLoading,
   totalExperience,
}: ProtectedContentProps) => {
   const [skillMappings, setSkillMappings] = useState<SkillMapping[]>([]);
   const [openDropdown, setOpenDropdown] = useState<number | null>(null);
   const dropdownRef = useRef<HTMLDivElement>(null);

   const handleDropdownToggle = (index: number) => {
      setOpenDropdown(openDropdown === index ? null : index);
   };

   useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
         if (
            dropdownRef.current &&
            !dropdownRef.current.contains(event.target as Node)
         ) {
            setOpenDropdown(null);
         }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
         document.removeEventListener("mousedown", handleClickOutside);
      };
   }, []);

   const handleAddSkill = (type: "technical" | "soft") => {
      setAnalysisResult((prev) => {
         if (!prev) return null;
         const updatedSkills = [
            ...prev[type === "technical" ? "technicalSkills" : "softSkills"],
            "",
         ];

         // Add default mapping for the new skill
         const allExperienceTitles = userDetails.experience.map(
            (exp) => exp.title
         );
         const updatedMappings = [...skillMappings];
         updatedMappings.push({
            skill: "",
            experienceMappings: allExperienceTitles,
         });
         setSkillMappings(updatedMappings);

         return {
            ...prev,
            [type === "technical" ? "technicalSkills" : "softSkills"]:
               updatedSkills,
         };
      });
   };

   const handleRemoveSkill = (index: number, type: "technical" | "soft") => {
      setAnalysisResult((prev) => {
         if (!prev) return null;
         const updatedSkills = prev[
            type === "technical" ? "technicalSkills" : "softSkills"
         ].filter((_, i) => i !== index);

         // Remove mapping for the deleted skill
         const skillToRemove =
            prev[type === "technical" ? "technicalSkills" : "softSkills"][
               index
            ];
         const updatedMappings = skillMappings.filter(
            (m) => m.skill !== skillToRemove
         );
         setSkillMappings(updatedMappings);

         return {
            ...prev,
            [type === "technical" ? "technicalSkills" : "softSkills"]:
               updatedSkills,
         };
      });
   };

   const handleSkillChange = (
      value: string,
      index: number,
      type: "technical" | "soft"
   ) => {
      setAnalysisResult((prev) => {
         if (!prev) return null;
         const updatedSkills = [
            ...prev[type === "technical" ? "technicalSkills" : "softSkills"],
         ];
         const oldSkill = updatedSkills[index];
         updatedSkills[index] = value;

         // Find existing mapping for this skill
         const mappingIndex = skillMappings.findIndex(
            (m) => m.skill === oldSkill
         );
         const updatedMappings = [...skillMappings];

         if (mappingIndex !== -1) {
            // Update only the skill name, preserve its mappings
            updatedMappings[mappingIndex] = {
               ...updatedMappings[mappingIndex],
               skill: value,
            };
         } else {
            // If no mapping exists, create new with all experiences
            const allExperienceTitles = userDetails.experience.map(
               (exp) => exp.title
            );
            updatedMappings.push({
               skill: value,
               experienceMappings: allExperienceTitles,
            });
         }

         setSkillMappings(updatedMappings);

         return {
            ...prev,
            [type === "technical" ? "technicalSkills" : "softSkills"]:
               updatedSkills,
         };
      });
   };

   // Initialize mappings when skills are first loaded
   useEffect(() => {
      if (analysisResult?.technicalSkills && userDetails) {
         setSkillMappings((prev) => {
            const allExperienceTitles = userDetails.experience.map(
               (exp) => exp.title
            );

            // Create mappings for any new skills while preserving existing mappings
            return analysisResult.technicalSkills.map((skill) => {
               const existingMapping = prev.find((m) => m.skill === skill);
               return (
                  existingMapping || {
                     skill,
                     experienceMappings: allExperienceTitles,
                  }
               );
            });
         });
      }
   }, [analysisResult?.technicalSkills, userDetails]);

   const handleSkillMappingChange = (
      skill: string,
      expTitle: string,
      checked: boolean
   ) => {
      setSkillMappings((prev) =>
         prev.map((mapping) =>
            mapping.skill === skill
               ? {
                    ...mapping,
                    experienceMappings: checked
                       ? [...mapping.experienceMappings, expTitle]
                       : mapping.experienceMappings.filter(
                            (title) => title !== expTitle
                         ),
                 }
               : mapping
         )
      );
   };

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
            <details className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl shadow-lg border border-slate-600/20">
               <summary className="cursor-pointer p-4 text-sm font-semibold bg-gradient-to-r from-slate-700/80 to-slate-800/80 rounded-xl flex items-center justify-between hover:from-slate-800/80 hover:to-slate-900/80 transition-all duration-200">
                  {selectedText ? (
                     <span className="text-blue-300">
                        View Selected Job-Description
                     </span>
                  ) : (
                     <span className="text-slate-300">
                        Please select Job description, then right-click, then
                        send to ResumeOnFly
                     </span>
                  )}
                  <svg
                     className="w-5 h-5 text-blue-400"
                     fill="none"
                     viewBox="0 0 24 24"
                     stroke="currentColor"
                  >
                     <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                     />
                  </svg>
               </summary>
               <div className="p-4 text-sm text-blue-200 max-h-[200px] overflow-y-auto custom-scrollbar">
                  {selectedText || "No Job description selected"}
               </div>
            </details>
         </div>

         {/* Loading State */}
         {loading && (
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl p-6 shadow-lg border border-slate-600/20">
               <div className="flex justify-center p-2">
                  <div className="animate-pulse-slow flex space-x-2">
                     <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce"></div>
                     <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                     <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
               </div>
               <div className="flex justify-center p-2 font-bold text-blue-300 text-lg">
                  Parsing the Job Description...
               </div>
            </div>
         )}

         {/* Analysis Results */}
         {analysisResult && (
            <div className="space-y-6">
               <div className="flex items-center rounded-xl justify-between gap-4">
                  {/* Experience Required */}
                  <div className="relative group bg-gradient-to-br from-green-800/80 to-emerald-900/80 w-1/2 p-3 rounded-xl shadow-lg border border-green-700/30 hover:border-green-600/50 transition-all duration-200">
                     <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-green-200">
                           Experience Required:
                        </span>
                        <span className="font-bold text-emerald-300 text-lg">
                           {analysisResult.yearsOfExperience} years
                        </span>
                     </div>
                     {/* Tooltip */}
                     <div className="absolute left-0 top-full mt-2 w-max px-3 py-2 bg-gray-800 text-gray-200 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-xl">
                        Based on the job description
                     </div>
                  </div>

                  {/* Total Experience */}
                  <div className="relative group bg-gradient-to-br from-green-800/80 to-emerald-900/80 w-1/2 p-3 rounded-xl shadow-lg border border-green-700/30 hover:border-green-600/50 transition-all duration-200">
                     <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-green-200">
                           Your Experience:
                        </span>
                        <span className="font-bold text-emerald-300 text-lg">
                           {totalExperience} years
                        </span>
                     </div>
                     {/* Tooltip */}
                     <div className="absolute left-0 top-full mt-2 w-max px-3 py-2 bg-gray-800 text-gray-200 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-xl">
                        Can edit this in the Edit Details section
                     </div>
                  </div>
               </div>

               {/* Technical Skills */}
               <div className="bg-gradient-to-l from-slate-800/50 to-slate-900/60 rounded-xl p-6 shadow-lg border border-slate-600/20">
                  <div className="relative mb-6">
                     <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent inline-flex items-center gap-2">
                        Technical Skills:
                        <span className="text-xs text-slate-400 font-normal bg-slate-800 px-2 py-1 rounded-lg">
                           Editable
                        </span>
                     </h3>
                  </div>

                  <div className="flex flex-wrap gap-4">
                     {analysisResult.technicalSkills.map((skill, index) => (
                        <div key={index} className="w-[23%] group relative">
                           <div className="relative flex items-center gap-1">
                              <input
                                 type="text"
                                 value={skill}
                                 onChange={(e) =>
                                    handleSkillChange(
                                       e.target.value,
                                       index,
                                       "technical"
                                    )
                                 }
                                 className="w-full px-3 py-2 text-sm bg-slate-600 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-200"
                                 placeholder="Enter skill"
                                 title="Edit Skill"
                              />
                              <button
                                 onClick={() => {
                                    handleDropdownToggle(index);
                                 }}
                                 title="Map Skill to Experience"
                                 className={`p-2 bg-slate-800 text-blue-400 rounded-lg border border-slate-600 hover:bg-slate-700 transition-all duration-200 ${
                                    openDropdown === index
                                       ? "bg-blue-600 text-orange-400"
                                       : ""
                                 }`}
                              >
                                 <MapIcon size={16} />
                              </button>
                              <button
                                 onClick={() =>
                                    handleRemoveSkill(index, "technical")
                                 }
                                 title="Remove Skill"
                                 className="p-2 bg-slate-800 text-rose-400 rounded-lg border border-slate-600 hover:bg-slate-700 transition-all duration-200"
                              >
                                 <Trash2 size={16} />
                              </button>
                           </div>

                           {openDropdown === index && (
                              <div
                                 className="absolute left-0 top-[calc(100%+4px)] w-full bg-slate-800 rounded-xl p-3 shadow-xl border border-slate-600 z-20"
                                 ref={dropdownRef}
                              >
                                 {userDetails.experience.map(
                                    (exp, expIndex) => {
                                       const isSelected = skillMappings
                                          .find((m) => m.skill === skill)
                                          ?.experienceMappings.includes(
                                             exp.title
                                          );
                                       const isTitleBased =
                                          exp.responsibilityType ===
                                          "titleBased";

                                       return (
                                          <label
                                             key={expIndex}
                                             className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer ${
                                                isTitleBased
                                                   ? "opacity-50 cursor-not-allowed bg-slate-700"
                                                   : "hover:bg-slate-700"
                                             } transition-all duration-200`}
                                          >
                                             <input
                                                type="checkbox"
                                                checked={isSelected}
                                                disabled={isTitleBased}
                                                onChange={(e) =>
                                                   handleSkillMappingChange(
                                                      skill,
                                                      exp.title,
                                                      e.target.checked
                                                   )
                                                }
                                                className="rounded border-slate-500 text-blue-500 focus:ring-blue-500"
                                             />
                                             <span className="text-xs text-slate-200">
                                                {exp.title}
                                                {isTitleBased && (
                                                   <span className="ml-1 text-slate-400">
                                                      (Title-based)
                                                   </span>
                                                )}
                                             </span>
                                          </label>
                                       );
                                    }
                                 )}
                              </div>
                           )}
                        </div>
                     ))}
                  </div>

                  <button
                     onClick={() => handleAddSkill("technical")}
                     className="flex items-center gap-2 mt-6 px-4 py-2 text-sm font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg mb-4"
                  >
                     <PlusCircle size={16} />
                     Add Skill
                  </button>
               </div>

               {userDetails && analysisResult && (
                  <ResumeGenerator
                     uid={user.uid}
                     userDetails={userDetails}
                     technicalSkills={analysisResult.technicalSkills}
                     softSkills={analysisResult.softSkills}
                     yearsOfExperience={analysisResult.yearsOfExperience}
                     jobDescription={selectedText}
                     refreshUserQuota={refreshUserQuota}
                     totalExperience={totalExperience}
                     skillMappings={skillMappings}
                  />
               )}
            </div>
         )}
      </>
   );
};

export default ProtectedContent;
