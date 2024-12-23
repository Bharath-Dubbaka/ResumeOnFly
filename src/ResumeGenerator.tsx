import React, { useState } from "react";
import { Download } from "lucide-react";
import {
   Document,
   Packer,
   Paragraph,
   TextRun,
   HeadingLevel,
   TabStopType,
} from "docx";

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
   softSkills,
   yearsOfExperience,
   jobDescription,
   userDetails,
}) => {
   const [resumeContent, setResumeContent] = useState<string>("");
   const [loading, setLoading] = useState(false);
   const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

   const cleanJsonResponse = (text: string) => {
      return text
         .replace(/^```json\s*/, "")
         .replace(/```$/, "")
         .trim();
   };

   const generateResume = async () => {
      setLoading(true);
      try {
         const API_KEY = apiKey;
         const API_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
         const prompt = `Generate a JSON object (with no markdown formatting) containing the following resume sections. For each work experience, generate 8 detailed responsibilities based on the job description and technical skills only, NOT of title or employer:
      {
        "fullName": "${userDetails.fullName}",
        "contactInformation": "${userDetails.email} | ${
            userDetails.phone
         } | Location",
        "professionalSummary": "Brief summary based on experience and job description and skills minimum of 6 sentences",
        "technicalSkills": "${technicalSkills.join(", ")}",
        "professionalExperience": [
          {
            "title": string,
            "employer";string,
            "startDate": string,
            "endDate": string,
            "location":string;
            "responsibilities": string[] // Array of 8 detailed responsibilities based on the job description and technical skills only, NOT of title or employer
          }
        ],
        "education": ${JSON.stringify(userDetails.education)},
        "softSkills": "${softSkills.join(", ")}",
        "certifications": ${JSON.stringify(userDetails.certifications)},
        "projects": ${JSON.stringify(userDetails.projects)}
      }

      Use this information to populate the JSON:
      Job Description: ${jobDescription}
      Years of Experience: ${yearsOfExperience}
      Work Experience: ${JSON.stringify(
         userDetails.experience
      )}, but do use this to generate responsibilities

      For each role in professional experience:
      1. Keep the original title, employer, startDate, and endDate
      2. Generate detailed, specific responsibilities that align with the job description and skills only, NOT of the title or employer
      3. Focus on quantifiable achievements and technical contributions

      Return only the JSON object with no additional text or formatting.`;

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
         setResumeContent(generatedContent);
      } catch (error) {
         console.error("Error generating resume:", error);
         alert("Error generating resume content. Please try again.");
      } finally {
         setLoading(false);
      }
   };

   const downloadAsWord = async () => {
      try {
         const cleanedContent = cleanJsonResponse(resumeContent);
         const resumeData = JSON.parse(cleanedContent);

         const doc = new Document({
            sections: [
               {
                  properties: {},
                  children: [
                     // Header with name and contact
                     new Paragraph({
                        heading: HeadingLevel.TITLE,
                        children: [
                           new TextRun({
                              text: resumeData.fullName,
                              bold: true,
                              size: 32,
                           }),
                        ],
                     }),
                     new Paragraph({
                        children: [
                           new TextRun({
                              text: resumeData.contactInformation,
                              size: 24,
                           }),
                        ],
                     }),

                     // Professional Summary
                     new Paragraph({
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 400 },
                        children: [
                           new TextRun({
                              text: "Professional Summary",
                              bold: true,
                              size: 28,
                           }),
                        ],
                     }),
                     new Paragraph({
                        children: [
                           new TextRun({
                              text: resumeData.professionalSummary,
                              size: 24,
                           }),
                        ],
                     }),
                     // Technical Skills
                     new Paragraph({
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 400 },
                        children: [
                           new TextRun({
                              text: "Technical Skills",
                              bold: true,
                              size: 28,
                           }),
                        ],
                     }),
                     new Paragraph({
                        children: [
                           new TextRun({
                              text: resumeData.technicalSkills,
                              size: 24,
                           }),
                        ],
                     }),
                     // Professional Experience
                     new Paragraph({
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 400 },
                        children: [
                           new TextRun({
                              text: "Professional Experience",
                              bold: true,
                              size: 28,
                           }),
                        ],
                     }),
                     ...resumeData.professionalExperience.flatMap(
                        (exp: any) => [
                           new Paragraph({
                              children: [
                                 new TextRun({
                                    text: `Job Title: ${exp.title}`,
                                    bold: true,
                                    size: 24,
                                 }),
                                 new TextRun({
                                    text: `\tDuration: (${exp.startDate} - ${exp.endDate})`,
                                    bold: true,
                                    size: 24,
                                 }),
                              ],
                              tabStops: [
                                 {
                                    type: TabStopType.RIGHT,
                                    position: 9000, // Adjust the position based on your document width
                                 },
                              ],
                           }),
                           new Paragraph({
                              children: [
                                 new TextRun({
                                    text: `Employer: ${exp.employer}`,
                                    bold: true,
                                    size: 24,
                                 }),
                                 new TextRun({
                                    text: `, ${exp.location}`,
                                    bold: true,
                                    size: 24,
                                 }),
                              ],
                           }),
                           // Add responsibilities as bullet points
                           ...(exp.responsibilities || []).map(
                              (responsibility: string) =>
                                 new Paragraph({
                                    bullet: {
                                       level: 0,
                                    },
                                    children: [
                                       new TextRun({
                                          text: responsibility,
                                          size: 24,
                                       }),
                                    ],
                                 })
                           ),
                        ]
                     ),

                     // Education
                     new Paragraph({
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 400 },
                        children: [
                           new TextRun({
                              text: "Education",
                              bold: true,
                              size: 28,
                           }),
                        ],
                     }),
                     ...resumeData.education.map(
                        (edu: any) =>
                           new Paragraph({
                              children: [
                                 new TextRun({
                                    text: `${edu.degree}, ${edu.institution} (${edu.year})`,
                                    size: 24,
                                 }),
                              ],
                           })
                     ),

                     // Soft Skills
                     new Paragraph({
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 400 },
                        children: [
                           new TextRun({
                              text: "Soft Skills",
                              bold: true,
                              size: 28,
                           }),
                        ],
                     }),
                     new Paragraph({
                        children: [
                           new TextRun({
                              text: resumeData.softSkills,
                              size: 24,
                           }),
                        ],
                     }),

                     // Certifications
                     new Paragraph({
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 400 },
                        children: [
                           new TextRun({
                              text: "Certifications",
                              bold: true,
                              size: 28,
                           }),
                        ],
                     }),
                     ...resumeData.certifications.map(
                        (cert: string) =>
                           new Paragraph({
                              children: [
                                 new TextRun({
                                    text: cert,
                                    size: 24,
                                 }),
                              ],
                           })
                     ),

                     // Projects
                     new Paragraph({
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 400 },
                        children: [
                           new TextRun({
                              text: "Projects",
                              bold: true,
                              size: 28,
                           }),
                        ],
                     }),
                     ...resumeData.projects.map(
                        (project: any) =>
                           new Paragraph({
                              children: [
                                 new TextRun({
                                    text: `${project.name}: ${project.description}`,
                                    size: 24,
                                 }),
                              ],
                           })
                     ),
                  ],
               },
            ],
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
               <div className="bg-white text-black p-8 rounded-lg max-h-[500px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap">{resumeContent}</pre>
               </div>

               <button
                  onClick={downloadAsWord}
                  className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 py-2 px-4 rounded-lg font-bold text-sm"
               >
                  <Download size={16} />
                  Download as Word Document
               </button>
            </div>
         )}
      </div>
   );
};

export default ResumeGenerator;
