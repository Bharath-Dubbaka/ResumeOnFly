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
      <div className="p-4 min-w-[300px] min-h-[300px]">
         <h1 className="text-xl font-bold mb-4">Job Description Analyzer</h1>
         <div className="p-2 border rounded bg-gray-50 mb-4">
            <h2 className="text-lg font-semibold">Selected Text</h2>
            <p>{selectedText || "No text selected"}</p>
         </div>

         {/* Add loading state */}
         {loading && (
            <div className="p-2 text-center text-blue-600">
               Analyzing job description...
            </div>
         )}

         {/* Add error state */}
         {error && (
            <div className="p-2 text-center text-red-600">Error: {error}</div>
         )}

         {/* Add analysis results */}
         {analysisResult && (
            <>
               <div className="p-2 border rounded bg-gray-50 mb-4">
                  <h2 className="text-lg font-semibold">Required Experience</h2>
                  <p>{analysisResult.yearsOfExperience} years</p>
               </div>

               <div className="p-2 border rounded bg-gray-50 mb-4">
                  <h2 className="text-lg font-semibold">Technical Skills</h2>
                  <ul className="list-disc pl-4">
                     {analysisResult.technicalSkills.map((skill, index) => (
                        <li key={index}>{skill}</li>
                     ))}
                  </ul>
               </div>

               <div className="p-2 border rounded bg-gray-50">
                  <h2 className="text-lg font-semibold">Soft Skills</h2>
                  <ul className="list-disc pl-4">
                     {analysisResult.softSkills.map((skill, index) => (
                        <li key={index}>{skill}</li>
                     ))}
                  </ul>
               </div>
            </>
         )}
         {/* <div className="p-2 border rounded bg-gray-50 mb-4">
            <h2 className="text-lg font-semibold">Skills</h2>
            <ul>
               {skills.length ? (
                  skills.map((skill, index) => <li key={index}>{skill}</li>)
               ) : (
                  <li>No skills detected</li>
               )}
            </ul>
         </div> */}
         {/* <div className="p-2 border rounded bg-gray-50">
            <h2 className="text-lg font-semibold">Experience</h2>
            <ul>
               {experience.length ? (
                  experience.map((exp, index) => (
                     <li key={index}>
                        {exp.years} years in {exp.skill}
                     </li>
                  ))
               ) : (
                  <li>No experience phrases detected</li>
               )}
            </ul>
         </div> */}
      </div>
   );
}

export default App;
