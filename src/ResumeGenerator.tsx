import React, { useState } from "react";
import { Download } from "lucide-react";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

interface UserDetails {
   fullName: string;
   email: string;
   phone: string;
   experience: { title: string; startDate: string; endDate: string }[];
   education: { degree: string; institution: string; year: string }[];
   certifications: string[];
   projects: { name: string; description: string }[];
}

interface ResumeGeneratorProps {
   technicalSkills: string[];
   softSkills: string[];
   yearsOfExperience: number;
   jobDescription: string;
   userDetails: UserDetails; // Accept userDetails as prop
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
      // Remove markdown code block syntax and any surrounding whitespace
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
         const prompt = `Generate a JSON object (with no markdown formatting) containing the following resume sections:
      {
        "fullName": "${userDetails.fullName}",
        "contactInformation": "${userDetails.email} | ${
            userDetails.phone
         } | Location", // Replace Location as needed
        "professionalSummary": "Brief summary based on experience and job description",
        "technicalSkills": "${technicalSkills.join(", ")}",
        "softSkills": "${softSkills.join(", ")}",
        "professionalExperience": ${JSON.stringify(userDetails.experience)},
        "education": ${JSON.stringify(userDetails.education)},
        "certifications": ${JSON.stringify(userDetails.certifications)},
        "projects": ${JSON.stringify(userDetails.projects)}
      }

      Use this information to populate the JSON:
      Job Description: ${jobDescription}
      Years of Experience: ${yearsOfExperience}


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
         // Clean and parse the JSON content
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
                     ...resumeData.professionalExperience.map(
                        (exp: string) =>
                           new Paragraph({
                              children: [new TextRun({ text: exp, size: 24 })],
                              spacing: { before: 200 },
                           })
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
                     new Paragraph({
                        children: [
                           new TextRun({
                              text: resumeData.education,
                              size: 24,
                           }),
                        ],
                     }),
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
