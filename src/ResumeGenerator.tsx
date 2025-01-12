import React, { useState } from "react";
// import { firestore } from "./services/firebase";
// import { doc, onSnapshot } from "firebase/firestore";
import {
   Document,
   Packer,
   Paragraph,
   TextRun,
   // HeadingLevel,
   TabStopType,
   AlignmentType,
   BorderStyle,
} from "docx";
import ResumePreview from "./ResumePreview";
import { QuotaService } from "./services/QuotaService";
import { Bug } from "lucide-react";
// import { ResumeFormattingEngine } from "./components/ResumeFormattingEngine";
import OpenAI from "openai";
import { UserDetailsService } from "./services/UserDetailsService";

// Initialize OpenAI client
const openai = new OpenAI({
   apiKey: import.meta.env.VITE_OPENAI_API_SECRET_KEY,
   dangerouslyAllowBrowser: true, // Only if using in browser
});

// Add this interface for skill mapping
interface SkillMapping {
   skill: string;
   experienceMappings: string[]; // Array of experience titles where this skill should be used
}

interface UserDetails {
   fullName: string;
   email: string;
   phone: string;
   experience: {
      title: string;
      employer: string;
      startDate: string;
      endDate: string;
      location: string;
      responsibilityType: "skillBased" | "titleBased";
      customResponsibilities: string[];
   }[];
   education: { degree: string; institution: string; year: string }[];
   certifications: string[];
   projects: { name: string; description: string }[];
}

interface ResumeGeneratorProps {
   technicalSkills: string[];
   softSkills: string[];
   yearsOfExperience: number;
   jobDescription: string;
   userDetails: UserDetails;
   refreshUserQuota: () => Promise<void>;
   uid: string;
   totalExperience: string | number;
   skillMappings: SkillMapping[];
}

const ResumeGenerator: React.FC<ResumeGeneratorProps> = ({
   technicalSkills,
   // softSkills,
   // yearsOfExperience,
   // jobDescription,
   userDetails,
   refreshUserQuota,
   totalExperience,
   uid,
   skillMappings,
}) => {
   const [resumeContent, setResumeContent] = useState<string>("");
   const [loading, setLoading] = useState(false);
   const [refreshPreview, setRefreshPreview] = useState(false); // Added for forcing re-render of preview
   // const [userDetails, setUserDetails] = useState(null); // Added for forcing re-render of preview
   // const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

   // useEffect(() => {
   //    const fetchUserDetails = async () => {
   //       const userDoc = doc(firestore, "users", uid);

   //       const unsubscribe = onSnapshot(userDoc, (docSnapshot) => {
   //          if (docSnapshot.exists()) {
   //             const userData = docSnapshot.data();
   //             setUserDetails(userData); // Update state with Firestore data
   //          } else {
   //             console.warn("No such document!");
   //          }
   //       });

   //       return () => unsubscribe(); // Cleanup listener on unmount
   //    };

   //    fetchUserDetails();
   // }, [uid]);

   // Clean the JSON response to remove any extra text or formatting
   function cleanJsonResponse(response: string): string {
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
   }
   // Generate Responsibilities based on the User preference
   const generateResponsibilities = async (
      experience: {
         title: string;
         responsibilityType: "skillBased" | "titleBased";
      },
      technicalSkills: string[],
      skillMappings: SkillMapping[]
   ): Promise<string[]> => {
      console.log(skillMappings, "skillMappings");
      console.log(technicalSkills, "technicalSkills");
      // Filter skills based on mappings
      const relevantSkills = technicalSkills.filter((skill) => {
         const mapping = skillMappings.find((m) => m.skill === skill);
         return mapping?.experienceMappings.includes(experience.title);
      });

      console.log(relevantSkills, "relevantSkills");

      const prompt =
         experience.responsibilityType === "skillBased"
            ? `Generate EXACTLY 8 detailed technical responsibilities that:
       1. Use ONLY these technical skills: ${relevantSkills.join(", ")}
       2. MUST NOT mention or reference the job title
       3. Focus purely on technical implementation and achievements
       4. Each responsibility should demonstrate hands-on technical work
       Return ONLY an array of 8 responsibilities in JSON format.`
            : `Generate EXACTLY 8 detailed responsibilities that:
       1. Are specific to the role of ${experience.title}
       2. MUST NOT mention any technical skills
       3. Focus on business impact and role-specific achievements
       4. Describe typical duties and accomplishments
       Return ONLY an array of 8 responsibilities in JSON format.`;

      const completion = await openai.chat.completions.create({
         model: "gpt-3.5-turbo",
         messages: [
            {
               role: "system",
               content:
                  "You are a professional resume writer. Generate specific, detailed responsibilities in JSON format. Return ONLY the array of responsibilities, no additional text.",
            },
            {
               role: "user",
               content: prompt,
            },
         ],
         temperature: 0.7,
         max_tokens: 1000,
         response_format: { type: "json_object" },
      });

      const response = JSON.parse(
         completion.choices[0].message.content || "{}"
      );
      return response.responsibilities || [];
   };

   // Add this new function to generate summary
   const generateProfessionalSummary = async (
      totalExperience: string | number,
      technicalSkills: string[],
      latestRole: string
   ): Promise<string> => {
      const prompt = `Generate a detailed professional summary that:
      1. Highlights ${totalExperience} years of total experience
      2. Incorporates key technical skills: ${technicalSkills.join(", ")}
      3. Mentions current/latest role as ${latestRole}
      4. Focuses on career progression and expertise
      5. Is approximately 6-8 sentences long
      Return ONLY the summary text in JSON format.`;

      const completion = await openai.chat.completions.create({
         model: "gpt-3.5-turbo",
         messages: [
            {
               role: "system",
               content:
                  "You are a professional resume writer. Generate a compelling professional summary in JSON format. Return ONLY the summary text.",
            },
            {
               role: "user",
               content: prompt,
            },
         ],
         temperature: 0.7,
         max_tokens: 500,
         response_format: { type: "json_object" },
      });

      const response = JSON.parse(
         completion.choices[0].message.content || "{}"
      );
      return response.summary || "";
   };

   // Generate the Resume using the generated Responsibilities and hardcoded userDetails
   const generateResume = async () => {
      // Check quota before proceeding
      const hasQuota = await QuotaService.checkQuota(uid, "generates");
      if (!hasQuota) {
         alert("Generate quota exceeded. Please upgrade your plan."); // Alert for user feedback
         return; // Exit the function if no quota
      }

      setLoading(true);
      try {
         // Generate responsibilities for each experience separately
         const generatedResponsibilities = await Promise.all(
            userDetails.experience.map((exp) =>
               generateResponsibilities(exp, technicalSkills, skillMappings)
            )
         );

         // Generate professional summary
         const latestRole = userDetails.experience[0]?.title || "Professional";
         const generatedSummary = await generateProfessionalSummary(
            totalExperience,
            technicalSkills,
            latestRole
         );

         // Create the final resume content
         const resumeContent = {
            fullName: userDetails.fullName,
            contactInformation: `${userDetails.email} | ${userDetails.phone}`,
            professionalSummary: generatedSummary, // Use the generated summary
            technicalSkills: technicalSkills.join(", "),
            professionalExperience: userDetails.experience.map(
               (exp, index) => ({
                  title: exp.title,
                  employer: exp.employer,
                  startDate: exp.startDate,
                  endDate: exp.endDate,
                  location: exp.location,
                  responsibilities: [
                     ...generatedResponsibilities[index],
                     ...(exp.customResponsibilities || []),
                  ],
               })
            ),
            education: userDetails.education || [],
            certifications: userDetails.certifications || [],
            projects: userDetails.projects || [],
         };

         // Clean and validate the response
         const cleanedContent = cleanJsonResponse(
            JSON.stringify(resumeContent)
         );
         const parsedContent = JSON.parse(cleanedContent);

         // Again Stringify before storing in state
         setResumeContent(JSON.stringify(parsedContent));
         // Trigger a refresh for preview
         setRefreshPreview((prev) => !prev);
         // Increment the usage
         await QuotaService.incrementUsage(uid, "generates");
         // Refresh the quota display
         await refreshUserQuota();
         setRefreshPreview(!refreshPreview);
      } catch (error) {
         console.error("Error generating resume:", error);
         alert("Error generating resume content. Please try again.");
      } finally {
         setLoading(false);
      }
   };

   const downloadAsWord = async () => {
      // Check quota before proceeding
      const hasQuota = await QuotaService.checkQuota(uid, "downloads");
      if (!hasQuota) {
         alert("Download quota exceeded. Please upgrade your plan."); // Alert for user feedback
         return; // Exit the function if no quota
      }

      // Directly use the resumeContent assuming it is already cleaned
      // console.log(resumeContent, "ResumeContent inside downloadAsWord");
      const resumeData = JSON.parse(resumeContent); // resumeContent is now used directly without cleaning
      // console.log(resumeData, "after json  inside downloadAsWord");
      try {
         const doc = new Document({
            sections: [
               {
                  properties: {
                     page: {
                        margin: {
                           top: 720, // 0.5 inches
                           right: 720, // 0.5 inches
                           bottom: 720, // 0.5 inches
                           left: 720, // 0.5 inches
                        },
                     },
                  },
                  children: [
                     // Header Section - Centered
                     new Paragraph({
                        children: [
                           new TextRun({
                              text: resumeData.fullName,
                              bold: true,
                              size: 36, // Increased for better header visibility
                              font: "Roboto",
                           }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 200 },
                     }),
                     new Paragraph({
                        children: [
                           new TextRun({
                              text: resumeData.contactInformation,
                              size: 24,
                              color: "666666", // Gray color to match preview
                              font: "Roboto",
                           }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 },
                     }),

                     // Professional Summary
                     new Paragraph({
                        children: [
                           new TextRun({
                              text: "Professional Summary",
                              bold: true,
                              size: 28,
                              font: "Roboto",
                           }),
                        ],
                        spacing: { before: 400, after: 200 },
                        border: {
                           bottom: {
                              color: "999999",
                              size: 1,
                              style: BorderStyle.SINGLE,
                           },
                        },
                     }),
                     new Paragraph({
                        children: [
                           new TextRun({
                              text: resumeData.professionalSummary,
                              size: 24,
                              font: "Roboto",
                           }),
                        ],
                        spacing: { after: 400 },
                     }),

                     // Technical Skills
                     new Paragraph({
                        children: [
                           new TextRun({
                              text: "Technical Skills",
                              bold: true,
                              size: 28,
                              font: "Roboto",
                           }),
                        ],
                        spacing: { before: 400, after: 200 },
                        border: {
                           bottom: {
                              color: "999999",
                              size: 1,
                              style: BorderStyle.SINGLE,
                           },
                        },
                     }),
                     new Paragraph({
                        children: [
                           new TextRun({
                              text: resumeData.technicalSkills,
                              size: 24,
                              font: "Roboto",
                           }),
                        ],
                        spacing: { after: 400 },
                     }),

                     // Professional Experience
                     new Paragraph({
                        children: [
                           new TextRun({
                              text: "Professional Experience",
                              bold: true,
                              size: 28,
                              font: "Roboto",
                           }),
                        ],
                        spacing: { before: 400, after: 200 },
                        border: {
                           bottom: {
                              color: "999999",
                              size: 1,
                              style: BorderStyle.SINGLE,
                           },
                        },
                     }),
                     ...resumeData.professionalExperience.flatMap(
                        (exp: any) => [
                           // Title and Dates
                           new Paragraph({
                              children: [
                                 new TextRun({
                                    text: exp.title,
                                    bold: true,
                                    size: 26,
                                    font: "Roboto",
                                 }),
                                 new TextRun({
                                    text: `\t${exp.startDate} - ${exp.endDate}`,
                                    size: 24,
                                    color: "666666", // Gray color to match preview
                                    font: "Roboto",
                                 }),
                              ],
                              spacing: { before: 300, after: 100 },
                              tabStops: [
                                 {
                                    type: TabStopType.RIGHT,
                                    position: 9000,
                                 },
                              ],
                           }),
                           // Employer and Location
                           new Paragraph({
                              children: [
                                 new TextRun({
                                    text: exp.employer,
                                    size: 24,
                                    font: "Roboto",
                                 }),
                                 new TextRun({
                                    text: `, ${exp.location}`,
                                    size: 24,
                                    font: "Roboto",
                                 }),
                              ],
                              spacing: { before: 100, after: 200 },
                           }),
                           // Responsibilities (custom and generated merged)
                           ...exp.responsibilities.map(
                              (responsibility: string) =>
                                 new Paragraph({
                                    children: [
                                       new TextRun({
                                          text: responsibility,
                                          size: 24,
                                          font: "Roboto",
                                       }),
                                    ],
                                    bullet: {
                                       level: 0,
                                    },
                                    indent: { left: 720 }, // Indent for bullet points
                                    spacing: { before: 100, after: 100 },
                                 })
                           ),
                        ]
                     ),

                     // Education
                     new Paragraph({
                        children: [
                           new TextRun({
                              text: "Education",
                              bold: true,
                              size: 28,
                              font: "Roboto",
                           }),
                        ],
                        spacing: { before: 400, after: 200 },
                        border: {
                           bottom: {
                              color: "999999",
                              size: 1,
                              style: BorderStyle.SINGLE,
                           },
                        },
                     }),
                     ...resumeData.education
                        .map((edu: any) => [
                           new Paragraph({
                              children: [
                                 new TextRun({
                                    text: `${edu.degree} - ${edu.institution}, ${edu.year}`,
                                    bold: true,
                                    size: 24,
                                    font: "Roboto",
                                 }),
                              ],
                              bullet: {
                                 level: 0,
                              },
                              spacing: { before: 100 },
                           }),
                        ])
                        .flat(),

                     // Soft Skills (only if data exists)
                     // ...(resumeData.softSkills &&
                     // resumeData.softSkills.length > 0
                     //    ? [
                     //         new Paragraph({
                     //            children: [
                     //               new TextRun({
                     //                  text: "Soft Skills",
                     //                  bold: true,
                     //                  size: 28,
                     //               }),
                     //            ],
                     //            spacing: { before: 400, after: 200 },
                     //            border: {
                     //               bottom: {
                     //                  color: "999999",
                     //                  size: 1,
                     //                  style: BorderStyle.SINGLE,
                     //               },
                     //            },
                     //         }),
                     //         new Paragraph({
                     //            children: [
                     //               new TextRun({
                     //                  text: resumeData.softSkills.join(", "), // Join skills by commas
                     //                  size: 24,
                     //               }),
                     //            ],
                     //            spacing: { after: 400 },
                     //         }),
                     //      ]
                     //    : []),

                     // Certifications (only if data exists)
                     ...(resumeData.certifications &&
                     resumeData.certifications.length > 0
                        ? [
                             new Paragraph({
                                children: [
                                   new TextRun({
                                      text: "Certifications",
                                      bold: true,
                                      size: 28,
                                      font: "Roboto",
                                   }),
                                ],
                                spacing: { before: 400, after: 200 },
                                border: {
                                   bottom: {
                                      color: "999999",
                                      size: 1,
                                      style: BorderStyle.SINGLE,
                                   },
                                },
                             }),
                             ...resumeData.certifications
                                .map((cert: any) => [
                                   new Paragraph({
                                      children: [
                                         new TextRun({
                                            text: cert,
                                            size: 24,
                                            font: "Roboto",
                                         }),
                                      ],
                                      bullet: {
                                         level: 0,
                                      },
                                      spacing: { before: 100, after: 100 },
                                   }),
                                ])
                                .flat(),
                          ]
                        : []),

                     // Projects (only if data exists)
                     ...(resumeData.projects && resumeData.projects.length > 0
                        ? [
                             new Paragraph({
                                children: [
                                   new TextRun({
                                      text: "Projects",
                                      bold: true,
                                      size: 28,
                                      font: "Roboto",
                                   }),
                                ],
                                spacing: { before: 400, after: 200 },
                                border: {
                                   bottom: {
                                      color: "999999",
                                      size: 1,
                                      style: BorderStyle.SINGLE,
                                   },
                                },
                             }),
                             ...resumeData.projects
                                .map((project: any) => [
                                   new Paragraph({
                                      children: [
                                         new TextRun({
                                            text: project.name,
                                            size: 24,
                                            font: "Roboto",
                                         }),
                                      ],
                                      bullet: {
                                         level: 0,
                                      },
                                      spacing: { before: 100 },
                                   }),
                                   new Paragraph({
                                      children: [
                                         new TextRun({
                                            text: project.description,
                                            size: 24,
                                            font: "Roboto",
                                         }),
                                      ],
                                      spacing: { before: 0, after: 200 }, // Add spacing after description
                                      indent: { left: 720 },
                                   }),
                                ])
                                .flat(),
                          ]
                        : []),
                  ],
               },
            ],
            styles: {
               paragraphStyles: [
                  {
                     id: "Normal",
                     name: "Normal",
                     quickFormat: true,
                     run: {
                        font: "Roboto",
                     },
                     paragraph: {
                        spacing: {
                           line: 360, // 1.5 line spacing
                        },
                     },
                  },
               ],
            },
         });

         Packer.toBlob(doc).then((blob) => {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "resume.docx";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
         });

         await QuotaService.incrementUsage(uid, "downloads");

         // Refresh the quota display
         await refreshUserQuota();
      } catch (error) {
         console.error("Error generating Word document:", error);
         alert(
            "Error generating document. Please check the console for details and try again."
         );
      }
   };

   const handleSaveCustomResponsibility = async (
      expIndex: number,
      responsibility: string
   ) => {
      const updatedUserDetails = { ...userDetails };
      const experience = updatedUserDetails.experience[expIndex];

      if (!experience.customResponsibilities) {
         experience.customResponsibilities = [];
      }

      // Add the responsibility if it's not already in the list
      if (!experience.customResponsibilities.includes(responsibility)) {
         experience.customResponsibilities.push(responsibility);

         try {
            // Save to Firebase
            await UserDetailsService.saveUserDetails(uid, updatedUserDetails);
            // Update local state if needed
            // Trigger any necessary UI updates
         } catch (error) {
            console.error("Error saving custom responsibility:", error);
            alert("Failed to save custom responsibility. Please try again.");
         }
      }
   };

   return (
      <div className="mt-4 space-y-4">
         <button
            onClick={generateResume}
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg font-bold text-base bg-gradient-to-r from-purple-500 to-violet-500 text-white hover:from-purple-600 hover:to-violet-600 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-colors duration-200"
         >
            {loading ? (
               <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating Resume...
               </div>
            ) : (
               <div className="flex items-center justify-center gap-2">
                  <Bug size={16} /> Generate Resume
               </div>
            )}
         </button>

         {resumeContent && (
            <div className="space-y-4">
               {/* <div className="bg-white text-black p-8 rounded-lg max-h-[500px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap">{resumeContent}</pre>
               </div>

               <button
                  onClick={downloadAsWord}
                  className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 py-2 px-4 rounded-lg font-bold text-sm"
               >
                  <Download size={16} />
                  Download as Word Document
               </button> */}
               <ResumePreview
                  initialResumeContent={resumeContent}
                  onUpdate={(cleanedJson: string) => {
                     // Handle the updated resume JSON data here
                     setResumeContent(cleanedJson);
                  }}
                  // generateResume={generateResume}
                  downloadAsWord={downloadAsWord}
                  loading={loading}
                  refresh={refreshPreview} // Pass refresh to force re-render
                  onSaveCustomResponsibility={handleSaveCustomResponsibility}
                  userDetails={userDetails}
               />
            </div>
         )}
      </div>
   );
};

export default ResumeGenerator;
