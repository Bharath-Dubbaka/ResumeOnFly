import { useEffect, useState } from "react";
// import nlp from "compromise";
import UserDetailsForm from "./UserDetailsForm";
import ProtectedContent from "./ProtectedContent";
import { UserData, UserDetails, AnalysisResult } from "./types/types";
import { LogOutIcon } from "lucide-react";

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
   const [loginLoading, setLoginLoading] = useState<boolean>(false);
   const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
   const [isEditingDetails, setIsEditingDetails] = useState<boolean>(false);

   const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

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
                        const workExperiences = [
                           {
                              title: "Frontend Developer",
                              organization: "XYZ Corp",
                              duration: "12/12/2023 - Present",
                           },
                           {
                              title: "Junior Web Developer",
                              organization: "ABC Ltd",
                              duration: "12/12/2020 - 12/12/2023",
                           },
                        ];
                        const analysis = await analyzeWithGemini(
                           text,
                           workExperiences
                        );
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

      //Check if user details are already stored... if not then show the UserDetailsForm.
      chrome.storage.local.get("userDetails", (result) => {
         if (result.userDetails) {
            setUserDetails(result.userDetails);
         }
      });

      // Call the async function
      analyzeText();

      // Check login status
      chrome.storage.local.get("isLoggedIn", (result) => {
         if (result.isLoggedIn) {
            chrome.storage.local.get("userData", (userResult) => {
               if (userResult.userData) {
                  setUser(userResult.userData);
               }
            });
         }
      });

      // Check if user details are already stored
      chrome.storage.local.get("userDetails", (result) => {
         if (result.userDetails) {
            setUserDetails(result.userDetails);
         }
      });
   }, []);

   // Handle saving the user details
   // const handleSaveUserDetails = (details: UserDetails) => {
   //    setUserDetails(details); // Save the user details to state
   //    chrome.storage.local.set({ userDetails: details });
   // };

   const handleSaveUserDetails = (details: UserDetails) => {
      setUserDetails(details); // Update state
      setIsEditingDetails(false); // Exit edit mode
      chrome.storage.local.set({ userDetails: details }); // Save to storage
   };

   const handleEditClick = () => {
      setIsEditingDetails(true); // Enable edit mode
   };

   // Function to analyze text with Gemini API
   async function analyzeWithGemini(
      jobDescription: string,
      workExperiences: {
         title: string;
         organization: string;
         duration: string;
      }[]
   ): Promise<AnalysisResult> {
      const API_KEY = apiKey; // Replace with your Gemini API key
      const API_URL =
         "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

      // Modified prompt to ensure clean JSON response
      const prompt = `Analyze the following job description and work experiences in detail. Return only a JSON object with these exact keys:
      {
         "technicalSkills": [array of strings],
         "yearsOfExperience": number,
         "softSkills": [array of strings],
         "roleDescriptions": [
            {
               "title": string,
               "organization": string,
               "description": string
            }
         ]
      }
      Job Description: ${jobDescription}
      Work Experiences: ${JSON.stringify(workExperiences)}
   
      For each role in work experiences, generate a "description" field explaining key responsibilities and achievements based on the job description's context and the skills listed.
   
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
         throw new Error("Please try again..Failed to analyze job description");
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
         throw new Error("Try Again, Failed to parse analysis results");
      }
   }

   // Function to handle Google OAuth
   const handleGoogleLogin = async () => {
      setLoginLoading(true);

      //Reset of all fields
      // handleLogout();

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

         // // Save login status in chrome storage
         // chrome.storage.local.set({ isLoggedIn: true }, () => {
         //    console.log("User logged in");
         // });

         // // Save user data if needed
         // chrome.storage.local.set(
         //    { userData: JSON.stringify(userData) },
         //    () => {
         //       console.log("User data saved");
         //    }
         // );

         // // Notify other parts of your extension if necessary (e.g., popup)
         // chrome.runtime.sendMessage({ type: "userLoggedIn" });
      } catch (err) {
         setLoginLoading(false);
         setError(err instanceof Error ? err.message : "Login failed");
         console.error("Login error:", err);
      } finally {
         setLoginLoading(false);
      }
   };

   const handleLogout = () => {
      // Clear user data, analysis results, selected text, any errors,
      setUser(null);
      setAnalysisResult(null);
      setSelectedText("");
      setError(null);
      setLoading(false);
      setUserDetails(null);
      // Clear all relevant data from chrome storage
      chrome.storage.local.remove(
         [
            "userData",
            "selectedText",
            "storedAnalysis",
            "userDetails",
            // "isLoggedIn",
         ],
         () => {
            if (chrome.runtime.lastError) {
               console.error(
                  "Error clearing storage:",
                  chrome.runtime.lastError
               );
            } else {
               console.log("Logged out and storage cleared.");
            }
         }
      );
   };

   return (
      <div
         className="w-[800px] max-h-[800px] overflow-y-auto bg-gradient-to-b from-[#370c3e] to-[#243465] p-6 text-white rounded-lg shadow-xl"
         style={{ fontFamily: "Arial, sans-serif" }}
      >
         {/* Header */}
         <div className="mb-6 flex items-center justify-between">
            <div>
               <h1 className="text-2xl font-extrabold">ResumeOnFly🚀</h1>
               <p className="text-sm opacity-75">
                  Job Description Analyser, works on any website
               </p>
            </div>
            {user ? (
               <div className="flex items-center gap-2">
                  <img
                     src={user.picture}
                     alt={user.name}
                     className="w-8 h-8 rounded-full"
                  />
                  <div className="text-sm">
                     <div className="flex mb-1">
                        <p className="mr-1 px-2 py-1 bg-slate-900 rounded-lg">
                           {user.name}
                        </p>

                        <button
                           onClick={handleEditClick}
                           className="text-sm text-blue-400 hover:text-blue-300 mr-1 px-2 py-1 bg-slate-900 rounded-lg"
                        >
                           Edit Details
                        </button>

                        <button
                           onClick={handleLogout}
                           className="text-sm text-red-500 hover:text-red-400 bg-slate-900 px-2 py-1 rounded-lg"
                        >
                           <LogOutIcon size={16} />
                        </button>
                     </div>
                     <p className="text-slate-300 px-2 py-1 bg-slate-900 rounded-lg">
                        {user.email}
                     </p>
                  </div>
               </div>
            ) : (
               <button
                  onClick={handleGoogleLogin}
                  disabled={loginLoading}
                  className="bg-blue-600 px-4 py-2 text-sm font-bold rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
               >
                  {loginLoading ? (
                     <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Signing in...
                     </div>
                  ) : (
                     <>
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                           <path
                              fill="currentColor"
                              d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                           />
                        </svg>
                        Sign in with Google
                     </>
                  )}
               </button>
            )}
         </div>

         {/* Error State */}
         {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-2 mb-4 text-xs text-red-700">
               {error}
            </div>
         )}

         {/* Protected Content */}
         {user ? (
            isEditingDetails || !userDetails ? (
               // Show UserDetailsForm if user exists but userDetails are not set
               <UserDetailsForm onSave={handleSaveUserDetails} />
            ) : (
               // Show ProtectedContent if both user and userDetails exist
               <ProtectedContent
                  user={user}
                  userDetails={userDetails}
                  selectedText={selectedText}
                  setSelectedText={setSelectedText}
                  analysisResult={analysisResult}
                  setAnalysisResult={setAnalysisResult}
                  loading={loading}
                  setLoading={setLoading}
                  loginLoading={loginLoading}
                  setLoginLoading={setLoginLoading}
               />
            )
         ) : // Show nothing if user does not exist
         null}
      </div>
   );
}

export default App;
