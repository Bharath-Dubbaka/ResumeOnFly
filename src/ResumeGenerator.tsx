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
import axios from "axios";

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
   const apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;

   // Function to clean the response and remove any extra data
   const cleanJsonResponse = (text: string) => {
      try {
         // Regex to extract the JSON from the response if there is extra text before or after
         const match = text.match(/({.*})/);
         if (match && match[1]) {
            return match[1].trim(); // Return only the JSON part
         } else {
            console.error("Failed to extract valid JSON");
            return null;
         }
      } catch (error) {
         console.error("Error parsing JSON:", error);
         return null;
      }
   };

   // Generate the resume content from the API
   const generateResume = async () => {
      setLoading(true);
      try {
         const experience = userDetails.experience || [];

         // Map over the experience to format it
         const formattedExperience = experience.map((exp) => ({
            title: exp.title || "N/A",
            employer: exp.employer || "N/A",
            startDate: exp.startDate || "N/A",
            endDate: exp.endDate || "N/A",
            location: exp.location || "N/A",
            responsibilities: ["No responsibilities listed"], // Example fallback
         }));

         const prompt = `{
        "fullName": "${userDetails.fullName}",
        "contactInformation": {
          "email": "${userDetails.email}",
          "phone": "${userDetails.phone}",
          "location": "Location"
        },
        "professionalSummary": "Brief summary based on ${yearsOfExperience} and ${jobDescription} and ${technicalSkills.join(
            ", "
         )}",
        "technicalSkills": "${technicalSkills.join(", ")}",
        "experience": ${JSON.stringify(formattedExperience)},
        "education": ${JSON.stringify(userDetails.education)},
        "softSkills": "${softSkills.join(", ")}",
        "certifications": ${JSON.stringify(userDetails.certifications)},
        "projects": ${JSON.stringify(userDetails.projects)}
      }`;

         console.log("Generated JSON Prompt: ", prompt);

         // Parse and log to ensure it's valid
         const validJson = JSON.parse(prompt); // This ensures the prompt is well-formed
         console.log(validJson);

         const response = await axios.post(
            "https://api-inference.huggingface.co/models/EleutherAI/gpt-neo-2.7B",
            { inputs: prompt },
            { headers: { Authorization: `Bearer ${apiKey}` } }
         );

         const generatedContent = response.data[0].generated_text;

         // Clean the generated content (remove extra data)
         const cleanedContent = cleanJsonResponse(generatedContent);

         if (cleanedContent) {
            // Set the cleaned content as the final resume content
            setResumeContent(cleanedContent);
         } else {
            console.error("Error: Invalid or malformed generated content.");
            alert("Error generating resume content. Please try again.");
         }
      } catch (error) {
         console.error("Error generating resume:", error);
         alert("Error generating resume content. Please try again.");
      } finally {
         setLoading(false);
      }
   };

   // Download the resume as a Word document
   const downloadAsWord = async () => {
      try {
         const cleanedContent = cleanJsonResponse(resumeContent);

         if (cleanedContent) {
            // Ensure the content is valid before proceeding
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
                                 text: `${resumeData.contactInformation.email}, ${resumeData.contactInformation.phone}`,
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

                        // Experience, Education, and other sections...
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
         } else {
            alert("Error: Invalid resume content.");
         }
      } catch (error) {
         console.error("Error generating Word document:", error);
         alert("Error generating document. Please try again.");
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
