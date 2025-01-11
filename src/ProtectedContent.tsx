import ResumeGenerator from "./ResumeGenerator";
import { UserData, UserDetails, AnalysisResult } from "./types/types";
// import UserDetailsForm from "./UserDetailsForm";
import { useState, useEffect, useRef } from "react";

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
            <div>
               <div className="flex justify-center p-2">
                  <div className="animate-pulse-slow flex space-x-2">
                     <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
                     <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
                     <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
                  </div>
               </div>
               <div className="flex justify-center p-2 font-bold text-white text-lg">
                  Parsing the Job Description...
               </div>
            </div>
         )}

         {/* Analysis Results */}
         {analysisResult && (
            <div className="space-y-4">
               <div className="flex items-center rounded-lg justify-between">
                  {/* Experience Required */}
                  <div className="relative bg-green-800 w-[49%] p-2 rounded-lg group">
                     <span className="text-sm font-semibold">
                        Experience Required:
                     </span>
                     <span className="ml-2 font-bold text-green-300 text-sm">
                        {analysisResult.yearsOfExperience} years
                     </span>
                     {/* Tooltip */}
                     <div className="absolute left-0 top-full mt-1 w-max px-2 py-1 bg-gray-700 text-gray-100 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        Based on the job description.
                     </div>
                  </div>
                  {/* Total Experience */}
                  <div className="relative bg-green-800 w-[49%] p-2 rounded-lg group">
                     <span className="text-sm font-semibold">
                        Your Experience:
                     </span>
                     <span className="ml-2 font-bold text-green-300 text-sm">
                        {totalExperience} years
                     </span>
                     {/* Tooltip */}
                     <div className="absolute left-0 top-full mt-1 w-max px-2 py-1 bg-gray-700 text-gray-100 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        Can edit this in the Edit Details section.
                     </div>
                  </div>
               </div>

               {/* Technical Skills */}
               <div className="border border-slate-700 rounded-lg p-3">
                  <div className="relative">
                     <h3 className="text-sm font-bold mb-2 text-white bg-slate-900 px-2 py-1 w-fit rounded-lg group">
                        Technical Skills
                        <div className="absolute left-0 bottom-full mt-2 w-[150px] px-2 py-1 bg-gray-700 text-gray-100 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
                           You can modify below skills: add, edit, or delete.
                        </div>
                     </h3>
                  </div>
                  <div className="flex flex-wrap m-0">
                     {analysisResult.technicalSkills.map((skill, index) => (
                        <div
                           key={index}
                           className="w-[23%] flex flex-col mb-2 mr-[2%] last:mr-0"
                        >
                           <div className="relative group flex items-center">
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
                                 className="text-xs px-3 py-2 rounded-l font-semibold bg-blue-800 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full border border-gray-600 hover:bg-blue-600"
                                 placeholder="Enter skill"
                                 title="Edit Skill"
                              />
                              <button
                                 onClick={(e) => {
                                    e.stopPropagation();
                                    handleDropdownToggle(index);
                                 }}
                                 className={`px-2 py-2 rounded-r border-t border-r border-b border-gray-600 hover:bg-blue-600 ${
                                    openDropdown === index
                                       ? "bg-blue-400"
                                       : "bg-blue-800"
                                 }`}
                                 title="Map to Experiences"
                              >
                                 <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                 >
                                    <path
                                       fillRule="evenodd"
                                       d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 100-2h-4a1 1 0 100 2h4zm-9 7a1 1 0 011-1h4a1 1 0 110 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 14.414V16a1 1 0 01-2 0v-4zm9 1a1 1 0 100-2h-4a1 1 0 100 2h4z"
                                       clipRule="evenodd"
                                    />
                                 </svg>
                              </button>
                              <button
                                 onClick={() =>
                                    handleRemoveSkill(index, "technical")
                                 }
                                 className="text-sm px-2 py-1 bg-red-600 text-white rounded ml-1 hover:bg-red-700"
                                 title="Remove Skill"
                              >
                                 ✖
                              </button>
                           </div>

                           {openDropdown === index && (
                              <div
                                 ref={dropdownRef}
                                 className="mt-6 absolute z-10 w-[23%] bg-slate-700 rounded-lg p-2 shadow-lg"
                              >
                                 {userDetails.experience.map(
                                    (exp, expIndex) => {
                                       const isSelected =
                                          skillMappings
                                             .find((m) => m.skill === skill)
                                             ?.experienceMappings.includes(
                                                exp.title
                                             ) || false;
                                       const isTitleBased =
                                          exp.responsibilityType ===
                                          "titleBased";

                                       return (
                                          <label
                                             key={expIndex}
                                             className={`flex items-center gap-2 p-1 rounded cursor-pointer ${
                                                isTitleBased
                                                   ? "opacity-50 cursor-not-allowed bg-slate-800"
                                                   : "hover:bg-slate-600"
                                             }`}
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
                                                className="rounded border-gray-400"
                                             />
                                             <span className="text-xs text-white">
                                                {exp.title}
                                                {isTitleBased &&
                                                   " (Title-based)"}
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
                  <div className="relative group">
                     <button
                        onClick={() => handleAddSkill("technical")}
                        className="flex mt-3 text-sm bg-green-800 px-3 py-1 rounded font-semibold text-green-100 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
                     >
                        Add Skill
                     </button>
                     <div className="absolute left-0 top-full mt-1 w-max px-2 py-1 bg-gray-700 text-gray-100 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        Click to Add new Skill
                     </div>
                  </div>
               </div>

               {/* Soft Skills */}
               {/* <div className="mt-6">
                  <h3 className="text-sm font-bold mb-2 text-blue-300">
                     Soft Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                     {analysisResult.softSkills.map((skill, index) => (
                        <span
                           key={index}
                           className="px-3 py-1 bg-green-800 text-green-200 rounded text-xs"
                        >
                           {skill}
                        </span>
                     ))}
                  </div>
               </div> */}
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
      </>
   );
};

export default ProtectedContent;
