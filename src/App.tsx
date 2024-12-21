import { useEffect, useState } from "react";
// import nlp from "compromise";

interface AnalysisResult {
   technicalSkills: string[];
   yearsOfExperience: number;
   softSkills: string[];
   text: string;
   analysis: AnalysisResult;
}
// Add interface for user data
interface UserData {
   email: string;
   name: string;
   picture: string;
}
interface CustomManifest {
   name: string;
   version: string;
   manifest_version: number;
   oauth2: {
      client_id: string;
      scopes: string[];
   };
}

function App() {
   const [selectedText, setSelectedText] = useState<string>("");
   const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
      null
   );
   const [loading, setLoading] = useState<boolean>(false);
   const [error, setError] = useState<string | null>(null);
   const [user, setUser] = useState<UserData | null>(null);

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

      chrome.storage.local.get("userData", (result) => {
         if (result.userData) {
            setUser(result.userData);
         }
      });

      // Call the async function
      analyzeText();
   }, []);

   // Function to handle Google OAuth
   const handleGoogleLogin = async () => {
      try {
         // Get manifest and type assert it
         const manifest =
            chrome.runtime.getManifest() as unknown as CustomManifest;

         if (!manifest.oauth2?.client_id) {
            throw new Error("OAuth client ID not found in manifest");
         }

         const authParams = {
            client_id: manifest.oauth2.client_id,
            response_type: "token",
            scope: "openid email profile",
            redirect_uri: `https://${chrome.runtime.id}.chromiumapp.org`,
         };

         const authUrl =
            "https://accounts.google.com/o/oauth2/auth?" +
            new URLSearchParams(authParams).toString();

         const token = await new Promise<string>((resolve, reject) => {
            chrome.identity.launchWebAuthFlow(
               {
                  url: authUrl,
                  interactive: true,
               },
               (responseUrl) => {
                  if (chrome.runtime.lastError) {
                     reject(chrome.runtime.lastError);
                     return;
                  }
                  if (!responseUrl) {
                     reject(new Error("No response URL"));
                     return;
                  }
                  // Extract access token from response URL
                  const hashParams = new URLSearchParams(
                     responseUrl.split("#")[1]
                  );
                  const accessToken = hashParams.get("access_token");
                  if (!accessToken) {
                     reject(new Error("No access token found"));
                     return;
                  }
                  resolve(accessToken);
               }
            );
         });

         // Fetch user info using the access token
         const userInfoResponse = await fetch(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            {
               headers: {
                  Authorization: `Bearer ${token}`,
               },
            }
         );

         if (!userInfoResponse.ok) {
            throw new Error("Failed to get user info");
         }

         const userData = await userInfoResponse.json();
         setUser({
            email: userData.email,
            name: userData.name,
            picture: userData.picture,
         });

         // Store user data in chrome.storage
         chrome.storage.local.set({
            userData: {
               email: userData.email,
               name: userData.name,
               picture: userData.picture,
            },
         });
      } catch (err) {
         setError(err instanceof Error ? err.message : "Login failed");
         console.error("Login error:", err);
      }
   };

   const handleLogout = () => {
      setUser(null);
      chrome.storage.local.remove("userData");
   };

   return (
      <div
         className="w-[500px] max-h-[800px] overflow-y-auto bg-gradient-to-b from-[#370c3e] to-[#243465] p-6 text-white rounded-lg shadow-xl"
         style={{ fontFamily: "Arial, sans-serif" }}
      >
         {/* Header */}
         <div className="mb-6 flex items-center justify-between">
            <div>
               <h1 className="text-2xl font-extrabold">ResumeOnFly🚀</h1>
               <p className="text-sm opacity-75">Job Description Analyser</p>
            </div>
            {/* <button className="bg-red-600 px-4 py-2 text-sm font-bold rounded-lg hover:bg-red-700">
               Try the Enterprise Edition
            </button> */}
            {user ? (
               <div className="flex items-center gap-2">
                  <img
                     src={user.picture}
                     alt={user.name}
                     className="w-8 h-8 rounded-full"
                  />
                  <div className="text-sm">
                     <p className="font-semibold">{user.name}</p>
                     <button
                        onClick={handleLogout}
                        className="text-xs text-red-300 hover:text-red-400"
                     >
                        Logout
                     </button>
                  </div>
               </div>
            ) : (
               <button
                  onClick={handleGoogleLogin}
                  className="bg-blue-600 px-4 py-2 text-sm font-bold rounded-lg hover:bg-blue-700 flex items-center gap-2"
               >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                     <path
                        fill="currentColor"
                        d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                     />
                  </svg>
                  Sign in with Google
               </button>
            )}
         </div>

         {/* Selected Text - Collapsible */}
         <div className="mb-4">
            <details className="bg-blue-800 rounded-lg">
               <summary className="cursor-pointer p-2 text-sm font-semibold">
                  View Selected Job-Description
               </summary>
               <div className="p-2 text-sm text-blue-200 max-h-[100px] overflow-y-auto">
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
               <div className="flex items-center bg-green-800 p-2 rounded-lg">
                  <span className="text-sm font-semibold">
                     Experience Required:
                  </span>
                  <span className="ml-auto font-bold text-green-300">
                     {analysisResult.yearsOfExperience} years
                  </span>
               </div>

               {/* Technical Skills */}
               <div>
                  <h3 className="text-sm font-bold mb-2">Technical Skills</h3>
                  <div className="flex flex-wrap gap-1 font-semibold">
                     {analysisResult.technicalSkills.map((skill, index) => (
                        <span
                           key={index}
                           className="px-2 py-1 bg-purple-800 text-purple-200 rounded text-xs"
                        >
                           {skill}
                        </span>
                     ))}
                  </div>
               </div>

               {/* Soft Skills */}
               <div>
                  <h3 className="text-sm font-bold mb-2">Soft Skills</h3>
                  <div className="flex flex-wrap gap-1 font-semibold">
                     {analysisResult.softSkills.map((skill, index) => (
                        <span
                           key={index}
                           className="px-2 py-1 bg-blue-800 text-blue-200 rounded text-xs"
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
