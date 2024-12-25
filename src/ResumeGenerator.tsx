import React, { useState } from "react";
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
      responsibilities?: string[]; // Added responsibilities
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
}

const ResumeGenerator: React.FC<ResumeGeneratorProps> = ({
   technicalSkills,
   // softSkills,
   yearsOfExperience,
   // jobDescription,
   userDetails,
}) => {
   const [resumeContent, setResumeContent] = useState<string>("");
   const [loading, setLoading] = useState(false);
   const [refreshPreview, setRefreshPreview] = useState(false); // Added for forcing re-render of preview
   const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

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
         const API_KEY = apiKey;
         const API_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
         console.log(userDetails.experience, "userDetails.experience");

         const prompt = `Generate a JSON object with the following structure. For responsibilities:
         1. Include at least one sentence for **each technical skill (${technicalSkills.join(
            ", "
         )}),** for every work experience.
         2. Ensure responsibilities are unique and relevant for each work experience.
         
         {
           "fullName": "${userDetails.fullName}",
           "contactInformation": "${userDetails.email} | ${
            userDetails.phone
         } | Location",
           "professionalSummary": "A detailed summary (minimum 6 sentences) based on ${yearsOfExperience} years of experience, the job description, and skills (${technicalSkills.join(
            ", "
         )}).",
           "technicalSkills": "${technicalSkills.join(", ")}",
           "professionalExperience": [
             ${userDetails.experience
                .map(
                   (experience) => `{
                 "title": "${experience.title}",
                 "employer": "${experience.employer}",
                 "startDate": "${experience.startDate}",
                 "endDate": "${experience.endDate}",
                 "location": "${experience.location}",
                 "responsibilities": ["Generate one responsibility for each technical skill (${technicalSkills.join(
                    ", "
                 )}) based on the job description and ensure all skills are covered uniquely for this role."]
               }`
                )
                .join(",\n")}
           ],
           "education": ${JSON.stringify(userDetails.education)},
           "certifications": ${JSON.stringify(userDetails.certifications)},
           "projects": ${JSON.stringify(userDetails.projects)}
         }
         
         Use this information:
         - technicalSkills: ${technicalSkills}
         - Years of Experience: ${yearsOfExperience}
         
         Important Notes:
         1. Retain the original title, employer, startDate, and endDate for each role.
         2. Ensure each work experience has unique responsibilities that include all the listed technical skills.
         3. Return only the JSON object with no additional text or formatting.`;

         const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
            },
            body: JSON.stringify({
               contents: [{ parts: [{ text: prompt }] }],
            }),
         });

         const data = await response.json();
         const generatedContent = data.candidates[0].content.parts[0].text;

         // Clean up the generated content before storing
         const cleanedContent = cleanJsonResponse(generatedContent);
         setResumeContent(cleanedContent);

         // Trigger a refresh for preview
         setRefreshPreview((prev) => !prev);
      } catch (error) {
         console.error("Error generating resume:", error);
         alert("Error generating resume content. Please try again.");
      } finally {
         setLoading(false);
      }
   };

   const downloadAsWord = async () => {
      // Directly use the resumeContent assuming it is already cleaned
      const resumeData = JSON.parse(resumeContent); // resumeContent is now used directly without cleaning

      try {
         const doc = new Document({
            sections: [
               {
                  properties: {},
                  children: [
                     // Header Section - Centered
                     new Paragraph({
                        children: [
                           new TextRun({
                              text: resumeData.fullName,
                              bold: true,
                              size: 36, // Increased for better header visibility
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
                           new Paragraph({
                              children: [
                                 new TextRun({
                                    text: exp.title,
                                    bold: true,
                                    size: 26,
                                 }),
                                 new TextRun({
                                    text: `\t${exp.startDate} - ${exp.endDate}`,
                                    size: 24,
                                    color: "666666", // Gray color to match preview
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
                           new Paragraph({
                              children: [
                                 new TextRun({
                                    text: exp.employer,
                                    size: 24,
                                 }),
                                 new TextRun({
                                    text: `, ${exp.location}`,
                                    size: 24,
                                 }),
                              ],
                              spacing: { before: 100, after: 200 },
                           }),
                           ...exp.responsibilities.map(
                              (responsibility: string) =>
                                 new Paragraph({
                                    children: [
                                       new TextRun({
                                          text: responsibility,
                                          size: 24,
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
      } catch (error) {
         console.error("Error generating Word document:", error);
         alert(
            "Error generating document. Please check the console for details and try again."
         );
      }
   };

   return (
      <div className="mt-6 space-y-4">
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
               "Generate Resume"
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
