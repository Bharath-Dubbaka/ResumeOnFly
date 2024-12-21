import { useEffect, useState } from "react";
// import nlp from "compromise";

interface AnalysisResult {
   technicalSkills: string[];
   yearsOfExperience: number;
   softSkills: string[];
   text: string;
   analysis: AnalysisResult;
}

function App() {
   const [selectedText, setSelectedText] = useState<string>("");
   const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
      null
   );
   const [loading, setLoading] = useState<boolean>(false);
   const [error, setError] = useState<string | null>(null);

   //below for compromise.js analysis of text
   // const [skills, setSkills] = useState<string[]>([]);
   // const [experience, setExperience] = useState<
   //    { skill: string; years: string }[]
   // >([]);

   // Function to analyze text with Gemini API
   async function analyzeWithGemini(
      jobDescription: string
   ): Promise<AnalysisResult> {
      const API_KEY = "AIzaSyBPlS5eHVy7xgWEarXqaKOkw1GHWowF2X8"; // Replace with your Gemini API key
      const API_URL =
         "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

      // Modified prompt to ensure clean JSON response
      const prompt = `Analyze this job description indetail and return only a JSON object with these exact keys:
        {
          "technicalSkills": [array of strings],
          "yearsOfExperience": number,
          "softSkills": [array of strings]
        }
    
        Job Description: ${jobDescription}
    
        Return only the JSON object, no additional text or formatting.`;

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

      if (!response.ok) {
         throw new Error("Failed to analyze job description");
      }

      const data = await response.json();

      // Add error handling for response parsing
      try {
         const content = data.candidates[0].content.parts[0].text;
         // Clean the response string before parsing
         const cleanedContent = content.trim().replace(/```json|```/g, "");
         return JSON.parse(cleanedContent);
      } catch (error) {
         console.error("Parsing error:", error);
         throw new Error("Failed to parse analysis results");
      }
   }

   useEffect(() => {
      const analyzeText = async () => {
         chrome.storage.local.get(
            ["selectedText", "storedAnalysis"],
            async (result) => {
               if (result.selectedText) {
                  const text = result.selectedText;
                  setSelectedText(text);

                  // Check if we have stored analysis for this exact text
                  if (
                     result.storedAnalysis &&
                     result.storedAnalysis.text === text
                  ) {
                     // Use stored analysis if text matches
                     setAnalysisResult(result.storedAnalysis.analysis);
                  } else {
                     // Only analyze if we don't have stored results for this text
                     setLoading(true);
                     setError(null);
                     try {
                        const analysis = await analyzeWithGemini(text);
                        setAnalysisResult(analysis);
                        // Store both text and its analysis
                        chrome.storage.local.set({
                           storedAnalysis: {
                              text: text,
                              analysis: analysis,
                           },
                        });
                     } catch (err) {
                        setError(
                           err instanceof Error
                              ? err.message
                              : "An error occurred"
                        );
                     } finally {
                        setLoading(false);
                     }
                  }
               }
            }
         );
      };

      // Call the async function
      analyzeText();
   }, []);

   // Skill extraction using Compromise.js
   // function extractSkills(text: string): string[] {
   //    const doc = nlp(text);
   //    return doc.match("#Noun").toLowerCase().unique().out("array");
   // }

   // Experience extraction using Compromise.js
   // function extractExperience(
   //    text: string
   // ): { skill: string; years: string }[] {
   //    const doc = nlp(text);
   //    const experiencePhrases = doc
   //       .match("/[0-9]+[+]? (years|yrs) of experience in [#Noun|#NounPhrase]/")
   //       .out("array");

   //    return experiencePhrases
   //       .map((phrase: string) => {
   //          const match = phrase.match(
   //             /([0-9]+[+]?) (years|yrs) of experience in ([^,.\n]+)/
   //          );
   //          return match ? { skill: match[3].trim(), years: match[1] } : null;
   //       })
   //       .filter(
   //          (result: any): result is { skill: string; years: string } =>
   //             result !== null
   //       );
   // }

   return (
      <div className="w-[500px] max-h-[800px] overflow-y-auto bg-white p-4">
         {/* Compact Header */}
         <div className="mb-4 bg-slate-300 p-4 rounded-lg">
            <h1 className="text-xl font-bold text-slate-800">ResumeOnFly🚀</h1>
            <div>Job Description Analyser</div>
         </div>

         {/* Selected Text - Collapsible */}
         <div className="mb-4">
            <details className="bg-slate-200 rounded-lg">
               <summary className="cursor-pointer p-2 text-sm font-semibold text-slate-700">
                  View Selected Job-Description
               </summary>
               <div className="p-2 text-sm text-slate-600 max-h-[100px] overflow-y-auto">
                  {selectedText || "No text selected"}
               </div>
            </details>
         </div>

         {/* Loading State */}
         {loading && (
            <div className="flex justify-center p-2">
               <div className="animate-pulse-slow flex space-x-2">
                  <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
                  <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
                  <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
               </div>
            </div>
         )}

         {/* Error State */}
         {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-2 mb-4 text-xs text-red-700">
               {error}
            </div>
         )}

         {/* Analysis Results */}
         {analysisResult && (
            <div className="space-y-4">
               {/* Experience Badge */}
               <div className="flex items-center bg-green-50 p-2 rounded-lg">
                  <span className="text-sm font-semibold text-slate-700">
                     Experience Required:
                  </span>
                  <span className="ml-auto font-bold text-green-600">
                     {analysisResult.yearsOfExperience} years
                  </span>
               </div>

               {/* Technical Skills */}
               <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-2">
                     Technical Skills
                  </h3>
                  <div className="flex flex-wrap gap-1 font-semibold">
                     {analysisResult.technicalSkills.map((skill, index) => (
                        <span
                           key={index}
                           className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs"
                        >
                           {skill}
                        </span>
                     ))}
                  </div>
               </div>

               {/* Soft Skills */}
               <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-2">
                     Soft Skills
                  </h3>
                  <div className="flex flex-wrap gap-1 font-semibold">
                     {analysisResult.softSkills.map((skill, index) => (
                        <span
                           key={index}
                           className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                        >
                           {skill}
                        </span>
                     ))}
                  </div>
               </div>
            </div>
         )}
      </div>
   );
}

export default App;
