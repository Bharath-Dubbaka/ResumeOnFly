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

// Initialize OpenAI client
const openai = new OpenAI({
   apiKey: import.meta.env.VITE_OPENAI_API_SECRET_KEY,
   dangerouslyAllowBrowser: true, // Only if using in browser
});

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

   const generateResume = async () => {
      setLoading(true);
      try {
         // const formattedPrompt = ResumeFormattingEngine.formatPrompt(
         //    userDetails,
         //    technicalSkills,
         //    totalExperience
         // );
         // console.log(
         //    formattedPrompt,
         //    "formattedPrompt inside generateResumeFN before LLM call"
         // );
         const formattedPrompt = `Generate a JSON object with the following structure. For responsibilities use the following rules:
         1. Retain the original title, employer, startDate, and endDate for each role.
         2. For experiences with 'skillBased' type, focus ONLY on current technical skills.
         3. For experiences with 'titleBased' type, focus ONLY on title/roles typical responsibilities.
         4. Return only the JSON object with no additional text or formatting.

         {
           "fullName": "${userDetails.fullName}",
           "contactInformation": "${userDetails.email} | ${
            userDetails.phone
         } | Location",
           "professionalSummary": "A detailed summary highlighting ${totalExperience} years of experience in ${technicalSkills.join(
            ", "
         )}, exactly 6 sentences",
           "technicalSkills": "${technicalSkills.join(", ")}",
           "professionalExperience": [
               ${userDetails?.experience
                  .map(
                     (experience) => `{
                  "title": "${experience.title}",
                  "employer": "${experience.employer}", 
                  "startDate": "${experience.startDate}",
                  "endDate": "${experience.endDate}", 
                  "location": "${experience.location}", 
                  "responsibilities": [
                        ${
                           experience.responsibilityType === "skillBased"
                              ? `"Generate at least 8 detailed responsibilities using ONLY technical skills irrespective of the role title and covering each technical skill (${technicalSkills.join(
                                   ", "
                                )})`
                              : `"Generate at least 8 detailed responsibilities using ONLY the role title '${experience.title}' and typical responsibilities for that position"`
                        }
                     ]
                  }`
                  )
                  .join(",\n")}
           ],
           "education": ${JSON.stringify(userDetails.education)},
           "certifications": ${JSON.stringify(userDetails.certifications)},
           "projects": ${JSON.stringify(userDetails.projects)}
         }`;

         const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
               {
                  role: "system",
                  content:
                     "You are a professional resume writer. Use the provided input to generate relevant JSON-based content. Do NOT echo input text or instructions. Focus on generating meaningful, original responsibilities and content based on the context.",
               },
               {
                  role: "user",
                  content: formattedPrompt,
               },
            ],
            temperature: 0.7,
            max_tokens: 2000,
            response_format: { type: "json_object" },
         });

         const generatedContent = completion.choices[0].message.content;
         if (!generatedContent) throw new Error("No content generated");

         // Clean and validate the response
         const parsedContent = JSON.parse(cleanJsonResponse(generatedContent));

         // if (!ResumeFormattingEngine.validateResponse(parsedContent)) {
         //    throw new Error("Generated content failed validation");
         // }

         // Merge custom responsibilities for each experience
         parsedContent.professionalExperience =
            parsedContent.professionalExperience.map(
               (exp: any, index: number) => ({
                  ...exp,
                  responsibilities: [
                     ...exp.responsibilities,
                     ...(userDetails.experience[index].customResponsibilities ||
                        []),
                  ],
               })
            );

         // Again Stringify before storing in state
         setResumeContent(JSON.stringify(parsedContent));
         // console.log(parsedContent, "parsedContent inside generateResumeFN");
         // Trigger a refresh for preview
         setRefreshPreview((prev) => !prev);

         // Increment the usage
         await QuotaService.incrementUsage(uid, "generates");

         // Refresh the quota display
         await refreshUserQuota();
      } catch (error) {
         console.error("Error generating resume:", error);
         alert("Error generating resume content. Please try again.");
      } finally {
         setLoading(false);
      }
   };

   const downloadAsWord = async () => {
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
                              spacing: { before: 200, after: 100 },
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
                                    text: edu.degree,
                                    bold: true,
                                    size: 24,
                                    font: "Roboto",
                                 }),
                              ],
                              spacing: { before: 100 },
                           }),
                           new Paragraph({
                              children: [
                                 new TextRun({
                                    text: `${edu.institution}, ${edu.year}`,
                                    size: 24,
                                    color: "666666", // Gray color to match preview
                                    font: "Roboto",
                                 }),
                              ],
                              spacing: { after: 200 },
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
                                            text: cert.name,
                                            size: 24,
                                            font: "Roboto",
                                         }),
                                      ],
                                      spacing: { before: 100, after: 100 },
                                   }),
                                   new Paragraph({
                                      children: [
                                         new TextRun({
                                            text: `${cert.institution} - ${cert.year}`,
                                            size: 24,
                                            color: "666666", // Gray color to match preview
                                            font: "Roboto",
                                         }),
                                      ],
                                      spacing: { after: 200 },
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
                                      spacing: { before: 100 },
                                   }),
                                   new Paragraph({
                                      children: [
                                         new TextRun({
                                            text: project.description,
                                            size: 24,
                                            color: "666666", // Gray color to match preview
                                            font: "Roboto",
                                         }),
                                      ],
                                      spacing: { after: 200 },
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
                        font: "Calibri",
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

   return (
      <div className="mt-4 space-y-4">
         <button
            onClick={generateResume}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 py-2 px-4 rounded-lg font-bold text-sm"
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
               />
            </div>
         )}
      </div>
   );
};

export default ResumeGenerator;
