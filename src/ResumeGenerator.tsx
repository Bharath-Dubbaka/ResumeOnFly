// ResumeGenerator.tsx
import React, { useState } from "react";
import { Download } from "lucide-react";
import { jsPDF } from "jspdf";

interface ResumeGeneratorProps {
   technicalSkills: string[];
   softSkills: string[];
   yearsOfExperience: number;
   jobDescription: string;
}

const ResumeGenerator: React.FC<ResumeGeneratorProps> = ({
   technicalSkills,
   softSkills,
   yearsOfExperience,
   jobDescription,
}) => {
   const [resumeContent, setResumeContent] = useState<string>("");
   const [loading, setLoading] = useState(false);
   const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

   const generateResume = async () => {
      setLoading(true);
      try {
         const API_KEY = apiKey;
         const API_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

         const prompt = `Create a professional resume based on the following job description and skills:
      Job Description: ${jobDescription}
      Technical Skills: ${technicalSkills.join(", ")}
      Soft Skills: ${softSkills.join(", ")}
      Years of Experience: ${yearsOfExperience}

      Format the resume in HTML with appropriate sections for:
      1. Professional Summary
      2. Technical Skills
      3. Professional Experience
      4. Education
      5. Certifications (if applicable)

      Make it specific to the job description requirements.`;

         const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
            },
            body: JSON.stringify({
               contents: [
                  {
                     parts: [
                        {
                           text: prompt,
                        },
                     ],
                  },
               ],
            }),
         });

         const data = await response.json();
         const generatedContent = data.candidates[0].content.parts[0].text;
         setResumeContent(generatedContent);
      } catch (error) {
         console.error("Error generating resume:", error);
      } finally {
         setLoading(false);
      }
   };

   const downloadAsPDF = () => {
      if (!resumeContent) {
         alert("Resume content is empty!");
         return;
      }

      const doc = new jsPDF();

      // Use HTML content to create the PDF
      doc.html(resumeContent, {
         callback: function (doc) {
            doc.save("resume.pdf");
         },
         x: 10,
         y: 10,
         autoPaging: "text", // Handle pagination for long resumes
         html2canvas: { scale: 0.6 }, // Adjust rendering scale if needed
      });
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
               <div className="bg-blue-900/30 p-4 rounded-lg max-h-[300px] overflow-y-auto">
                  <div dangerouslySetInnerHTML={{ __html: resumeContent }} />
               </div>

               <button
                  onClick={downloadAsPDF}
                  className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 py-2 px-4 rounded-lg font-bold text-sm"
               >
                  <Download size={16} />
                  Download as PDF
               </button>
            </div>
         )}
      </div>
   );
};

export default ResumeGenerator;
