import React, { useState, useEffect } from "react";
import { Download } from "lucide-react";

interface Education {
   degree: string;
   institution: string;
   year: string;
}

interface Experience {
   title: string;
   employer: string;
   startDate: string;
   endDate: string;
   location: string;
   responsibilities: string[];
}

interface ResumeData {
   fullName: string;
   contactInformation: string;
   professionalSummary: string;
   technicalSkills: string;
   professionalExperience: Experience[];
   education: Education[];
   softSkills: string;
   certifications: string[];
   projects: string[];
}

interface ResumePreviewProps {
   initialResumeContent: string | ResumeData;
   onUpdate: (data: string) => void;
   //    generateResume: () => void;
   downloadAsWord: () => void;
   loading: boolean;
   refresh: boolean;
}

const cleanJsonResponse = (response: string): string => {
   try {
      const jsonMatch = response.match(/{[\s\S]*}/);
      if (jsonMatch) {
         const cleanedJson = jsonMatch[0];
         return JSON.stringify(JSON.parse(cleanedJson));
      } else {
         throw new Error("No valid JSON found in the response.");
      }
   } catch (error) {
      console.error("Error cleaning JSON response:", error);
      throw new Error("Failed to parse JSON from response.");
   }
};

const ResumePreview: React.FC<ResumePreviewProps> = ({
   initialResumeContent,
   onUpdate,
   //    generateResume,
   downloadAsWord,
   refresh,
   loading,
}) => {
   const [isEditing, setIsEditing] = useState<boolean>(false);
   const [resumeData, setResumeData] = useState<ResumeData>(
      typeof initialResumeContent === "string"
         ? JSON.parse(initialResumeContent)
         : initialResumeContent
   );

   useEffect(() => {
      // Update resumeData whenever refresh or initialResumeContent changes
      setResumeData(
         typeof initialResumeContent === "string"
            ? JSON.parse(initialResumeContent)
            : initialResumeContent
      );
   }, [initialResumeContent, refresh]);

   const handleEdit = (field: keyof ResumeData, value: any) => {
      const updatedData = {
         ...resumeData,
         [field]: value,
      };
      setResumeData(updatedData);

      try {
         const jsonString = JSON.stringify(updatedData);
         const cleanedJson = cleanJsonResponse(jsonString);
         onUpdate(cleanedJson);
      } catch (error) {
         console.error("Error processing resume data:", error);
      }
   };

   const handleExperienceEdit = (
      expIndex: number,
      field: keyof Experience,
      value: any
   ) => {
      const updatedExperience = [...resumeData.professionalExperience];
      updatedExperience[expIndex] = {
         ...updatedExperience[expIndex],
         [field]: value,
      };
      handleEdit("professionalExperience", updatedExperience);
   };

   const handleResponsibilityEdit = (
      expIndex: number,
      respIndex: number,
      value: string
   ) => {
      const updatedExperience = [...resumeData.professionalExperience];
      const updatedResponsibilities = [
         ...updatedExperience[expIndex].responsibilities,
      ];
      updatedResponsibilities[respIndex] = value;
      updatedExperience[expIndex] = {
         ...updatedExperience[expIndex],
         responsibilities: updatedResponsibilities,
      };
      handleEdit("professionalExperience", updatedExperience);
   };

   //Loader
   if (loading) {
      return (
         <div className="flex flex-col items-center justify-center h-64 space-y-4">
            {/* Spinner */}
            <div className="relative">
               <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
               <div className="absolute inset-0 flex items-center justify-center text-blue-400 text-sm font-bold"></div>
            </div>

            {/* Text */}
            <p className="text-lg font-semibold text-blue-600 text-center">
               ResumeOnFly is generating your resume, please hold on.
            </p>

            {/* Subtext */}
            <p className="text-sm text-gray-500 text-center">
               This process may take a few moments. We appreciate your patience!
            </p>
         </div>
      );
   }

   return (
      <div className="mt-6 space-y-4">
         {/* <button
            onClick={generateResume}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-bold text-sm"
         >
            {loading ? (
               <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating Resume...
               </div>
            ) : (
               "Generate Resume"
            )}
         </button> */}

         {resumeData && (
            <div className="space-y-4">
               <div className="flex gap-4">
                  <button
                     onClick={() => setIsEditing(!isEditing)}
                     className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-bold text-sm"
                  >
                     {isEditing ? "Save Changes" : "Edit Resume"}
                  </button>

                  <button
                     onClick={downloadAsWord}
                     className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-bold text-sm"
                  >
                     <Download size={16} />
                     Download as Word
                  </button>
               </div>

               {/* PREVIEW */}
               <div className="bg-white text-black p-8 rounded-lg max-h-[600px] overflow-y-auto">
                  <div className="space-y-6">
                     {/* Header Section */}
                     <div className="text-center space-y-2">
                        <h1 className="text-2xl font-bold">
                           {isEditing ? (
                              <input
                                 type="text"
                                 value={resumeData.fullName}
                                 onChange={(e) =>
                                    handleEdit("fullName", e.target.value)
                                 }
                                 className="w-full text-center border rounded p-1"
                              />
                           ) : (
                              resumeData.fullName
                           )}
                        </h1>
                        <p className="text-gray-600">
                           {isEditing ? (
                              <input
                                 type="text"
                                 value={resumeData.contactInformation}
                                 onChange={(e) =>
                                    handleEdit(
                                       "contactInformation",
                                       e.target.value
                                    )
                                 }
                                 className="w-full text-center border rounded p-1"
                              />
                           ) : (
                              resumeData.contactInformation
                           )}
                        </p>
                     </div>

                     {/* Professional Summary */}
                     <div>
                        <h2 className="text-xl font-bold border-b-2 mb-2">
                           Professional Summary
                        </h2>
                        {isEditing ? (
                           <textarea
                              value={resumeData.professionalSummary}
                              onChange={(e) =>
                                 handleEdit(
                                    "professionalSummary",
                                    e.target.value
                                 )
                              }
                              className="w-full border rounded p-2"
                              rows={4}
                           />
                        ) : (
                           <p className="text-sm">
                              {resumeData.professionalSummary}
                           </p>
                        )}
                     </div>

                     {/* Technical Skills */}
                     <div>
                        <h2 className="text-xl font-bold border-b-2 mb-2">
                           Technical Skills
                        </h2>
                        {isEditing ? (
                           <textarea
                              value={resumeData.technicalSkills}
                              onChange={(e) =>
                                 handleEdit("technicalSkills", e.target.value)
                              }
                              className="w-full border rounded p-2"
                              rows={2}
                           />
                        ) : (
                           <p className="text-sm">
                              {resumeData.technicalSkills}
                           </p>
                        )}
                     </div>

                     {/* Professional Experience */}
                     <div>
                        <h2 className="text-xl font-bold border-b-2 mb-2">
                           Professional Experience
                        </h2>
                        {resumeData.professionalExperience.map(
                           (exp, expIndex) => (
                              <div key={expIndex} className="mb-4">
                                 <div className="flex justify-between items-start">
                                    <div>
                                       {isEditing ? (
                                          <div className="space-y-2">
                                             <input
                                                type="text"
                                                value={exp.title}
                                                onChange={(e) =>
                                                   handleExperienceEdit(
                                                      expIndex,
                                                      "title",
                                                      e.target.value
                                                   )
                                                }
                                                className="w-full border rounded p-1 font-bold"
                                             />
                                             <input
                                                type="text"
                                                value={exp.employer}
                                                onChange={(e) =>
                                                   handleExperienceEdit(
                                                      expIndex,
                                                      "employer",
                                                      e.target.value
                                                   )
                                                }
                                                className="w-full border rounded p-1"
                                             />
                                          </div>
                                       ) : (
                                          <>
                                             <h3 className="font-bold">
                                                {exp.title}
                                             </h3>
                                             <p className="text-sm">
                                                {exp.employer}
                                             </p>
                                          </>
                                       )}
                                    </div>
                                    {isEditing ? (
                                       <div className="space-x-2">
                                          <input
                                             type="text"
                                             value={exp.startDate}
                                             onChange={(e) =>
                                                handleExperienceEdit(
                                                   expIndex,
                                                   "startDate",
                                                   e.target.value
                                                )
                                             }
                                             className="w-24 border rounded p-1 text-sm"
                                          />
                                          <span>-</span>
                                          <input
                                             type="text"
                                             value={exp.endDate}
                                             onChange={(e) =>
                                                handleExperienceEdit(
                                                   expIndex,
                                                   "endDate",
                                                   e.target.value
                                                )
                                             }
                                             className="w-24 border rounded p-1 text-sm"
                                          />
                                       </div>
                                    ) : (
                                       <p className="text-sm text-gray-600">
                                          {exp.startDate} - {exp.endDate}
                                       </p>
                                    )}
                                 </div>
                                 <ul className="list-disc ml-6 mt-2">
                                    {exp.responsibilities.map(
                                       (resp, respIndex) => (
                                          <li
                                             key={respIndex}
                                             className="text-sm mb-1"
                                          >
                                             {isEditing ? (
                                                <textarea
                                                   value={resp}
                                                   onChange={(e) =>
                                                      handleResponsibilityEdit(
                                                         expIndex,
                                                         respIndex,
                                                         e.target.value
                                                      )
                                                   }
                                                   className="w-full border rounded p-2 min-h-[60px]"
                                                />
                                             ) : (
                                                resp
                                             )}
                                          </li>
                                       )
                                    )}
                                 </ul>
                              </div>
                           )
                        )}
                     </div>

                     {/* Education */}
                     <div>
                        <h2 className="text-xl font-bold border-b-2 mb-2">
                           Education
                        </h2>
                        {resumeData.education.map((edu, index) => (
                           <div key={index} className="mb-2">
                              <p className="font-bold">{edu.degree}</p>
                              <p className="text-sm">
                                 {edu.institution}, {edu.year}
                              </p>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default ResumePreview;
