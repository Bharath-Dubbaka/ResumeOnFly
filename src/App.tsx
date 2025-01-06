import { useEffect, useState } from "react";
import UserDetailsForm from "./UserDetailsForm";
import ProtectedContent from "./ProtectedContent";
import {
   UserData,
   UserDetails,
   AnalysisResult,
   UserQuota,
} from "./types/types";
import { LogOutIcon } from "lucide-react";
import {
   GoogleAuthProvider,
   signInWithCredential,
   onAuthStateChanged,
} from "firebase/auth";
import { auth } from "./services/firebase";
import { QuotaService } from "./services/QuotaService";
// import { Download, RefreshCcw } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";
import { UserDetailsService } from "./services/UserDetailsService";
import { QuotaDisplay } from "./components/QuotaDisplay";
import { PremiumUpgradeButton } from "./components/PremiumUpgradeButton";

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
   const [userQuota, setUserQuota] = useState<UserQuota | null>(null);
   const [isInitializing, setIsInitializing] = useState(true);

   const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
   // console.log(userDetails, "userDetailsuserDetails");
   // Add new useEffect for auth state monitoring
   useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
         if (firebaseUser) {
            try {
               // Wait a brief moment to ensure Firebase auth is fully initialized
               await new Promise((resolve) => setTimeout(resolve, 100));

               // Get user data from Firestore instead of chrome.storage
               const userData: UserData = {
                  email: firebaseUser.email || "",
                  name: firebaseUser.displayName || "",
                  picture: firebaseUser.photoURL || "",
                  uid: firebaseUser.uid,
               };

               // Get quota
               const quota = await QuotaService.getUserQuota(firebaseUser.uid);

               // Get user details from Firestore
               const details = await UserDetailsService.getUserDetails(
                  firebaseUser.uid
               );

               // Update all states
               setUser(userData);
               setUserQuota(quota);
               setUserDetails(details);

               // Still store in chrome.storage for faster initial load
               chrome.storage.local.set({
                  userData,
                  userQuota: quota,
                  userDetails: details,
                  isLoggedIn: true,
               });
            } catch (err) {
               console.error("Error restoring auth state:", err);
               // handleLogout();
               console.log(
                  "Auth state restoration failed, but user remains logged in"
               );
            }
         } else {
            // No Firebase user, ensure logged out state
            handleLogout();
         }
         setIsInitializing(false);
      });

      // Cleanup subscription
      return () => unsubscribe();
   }, []);

   useEffect(() => {
      const initialTextAnalyze = async () => {
         if (isInitializing || !user?.uid) return;

         // setIsInitializing(true);
         // console.log("isInitializing", isInitializing);
         try {
            const result = await chrome.storage.local.get([
               "userData",
               "userDetails",
               "userQuota",
               "selectedText",
               "storedAnalysis",
               "isLoggedIn",
            ]);

            // ... existing initialization code ...

            if (result.selectedText && result.isLoggedIn && user?.uid) {
               const text = result.selectedText;
               setSelectedText(text);

               // Check if we have stored analysis for this text
               if (
                  result.storedAnalysis &&
                  result.storedAnalysis.text === result.selectedText
               ) {
                  setAnalysisResult(result.storedAnalysis.analysis);
               } else {
                  setLoading(true);
                  setError(null);

                  try {
                     // Check quota before proceeding
                     const hasQuota = await QuotaService.checkQuota(
                        user.uid,
                        "parsing"
                     );
                     if (!hasQuota) {
                        throw new Error(
                           "Parsing quota exceeded. Please upgrade your plan. from UseEffect"
                        );
                     }

                     const userDetails: UserDetails | null = result.userDetails;
                     if (!userDetails || !userDetails.experience) {
                        throw new Error("User details or experience not found");
                     }

                     const workExperiences = userDetails.experience.map(
                        (exp) => ({
                           title: exp.title,
                           organization: exp.employer,
                           duration: `${exp.startDate} - ${exp.endDate}`,
                        })
                     );

                     const analysis = await analyzeWithGemini(
                        text,
                        workExperiences
                     );
                     setAnalysisResult(analysis);

                     chrome.storage.local.set({
                        storedAnalysis: {
                           text: text,
                           analysis: analysis,
                        },
                     });
                  } catch (err) {
                     setError(
                        err instanceof Error ? err.message : "An error occurred"
                     );
                  } finally {
                     setLoading(false);
                  }
               }
            }
         } catch (err) {
            console.error("Initialization error:", err);
            setError(
               err instanceof Error
                  ? err.message
                  : "An error occurred during initialization"
            );
         } finally {
            setIsInitializing(false);
         }
      };

      initialTextAnalyze();
   }, [user?.uid, isInitializing]);

   //Refreshing Quota
   const refreshUserQuota = async () => {
      if (user?.uid) {
         try {
            const quota = await QuotaService.getUserQuota(user.uid);
            setUserQuota(quota);
            chrome.storage.local.set({ userQuota: quota });
         } catch (err) {
            console.error("Failed to refresh quota:", err);
         }
      }
   };

   // Handle saving the user details
   const handleSaveUserDetails = async (details: UserDetails) => {
      if (!user?.uid) return;

      try {
         // Save to Firestore
         await UserDetailsService.saveUserDetails(user.uid, details);

         // Update local state
         setUserDetails(details);
         setIsEditingDetails(false);

         // Update chrome.storage
         chrome.storage.local.set({ userDetails: details });
      } catch (error) {
         console.error("Error saving user details:", error);
         setError("Failed to save user details. Please try again.");
      }
   };

   const handleCancelUserDetails = () => {
      setIsEditingDetails(false); // Exit edit mode
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

      if (!user?.uid) {
         throw new Error("User not authenticated");
      }

      try {
         // Check quota availability using QuotaService
         const hasQuota = await QuotaService.checkQuota(user.uid, "parsing");
         if (!hasQuota) {
            throw new Error(
               "Parsing quota exceeded. Please upgrade your plan. from analyzeWithGemini"
            );
         }

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
            throw new Error("Failed to analyze job description");
         }

         const data = await response.json();

         // If analysis is successful, increment the parsing quota
         await QuotaService.incrementUsage(user.uid, "parsing");

         // Refresh the quota display
         await refreshUserQuota();

         const content = data.candidates[0].content.parts[0].text;
         const cleanedContent = content.trim().replace(/```json|```/g, "");
         return JSON.parse(cleanedContent);
      } catch (error) {
         console.error("Analysis error:", error);
         if (error instanceof Error) {
            throw error;
         }
         throw new Error("Failed to parse analysis results");
      }
   }

   // Function to handle Google OAuth
   const handleGoogleLogin = async () => {
      setLoginLoading(true);

      // Reset of all fields just as logout, just to be sure
      handleLogout();

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

         const googleUserData = await userInfoResponse.json();

         // Create Firebase credential and sign in
         const credential = GoogleAuthProvider.credential(null, token);
         const firebaseAuth = await signInWithCredential(auth, credential);

         // Get or initialize quota from Firebase
         const quota = await QuotaService.getUserQuota(firebaseAuth.user.uid);

         // Create complete user data with Firebase UID
         const userData: UserData = {
            email: googleUserData.email,
            name: googleUserData.name,
            picture: googleUserData.picture,
            uid: firebaseAuth.user.uid,
         };

         // Set states separately
         setUser(userData);
         setUserQuota(quota);

         // Store in chrome.storage
         chrome.storage.local.set({
            userData: userData,
            userQuota: quota,
            isLoggedIn: true,
         });
      } catch (err) {
         setLoginLoading(false);
         setError(err instanceof Error ? err.message : "Login failed");
         console.error("Login error:", err);
      } finally {
         setLoginLoading(false);
      }
   };

   const handleLogout = async () => {
      try {
         await auth.signOut(); // Sign out from Firebase

         // Clear states
         setUser(null);
         setAnalysisResult(null);
         setSelectedText("");
         setError(null);
         setLoading(false);
         setUserDetails(null);
         setUserQuota(null);

         // Clear storage
         await chrome.storage.local.remove([
            "userData",
            "selectedText",
            "storedAnalysis",
            "userDetails",
            "userQuota",
            "isLoggedIn",
         ]);
      } catch (err) {
         console.error("Error during logout:", err);
      }
   };

   // Calculating User Experiences
   const calculateTotalExperience = (
      experiences: { startDate: string; endDate: string }[]
   ) => {
      let totalMonths = 0;

      experiences.forEach((exp) => {
         if (exp.startDate && exp.endDate) {
            const [startYear, startMonth] = exp.startDate
               .split("-")
               .map(Number);
            const [endYear, endMonth] = exp.endDate.split("-").map(Number);

            // Calculate the total months between start and end dates
            const months = (endYear - startYear) * 12 + (endMonth - startMonth);

            const validMonths = Math.max(0, months); // Ensure no negative months

            // Log individual experience duration
            // console.log(
            //    `Experience ${index + 1}: Start Date = ${
            //       exp.startDate
            //    }, End Date = ${exp.endDate}, Duration = ${(
            //       validMonths / 12
            //    ).toFixed(1)} years (${validMonths} months)`
            // );

            totalMonths += validMonths;
         } else {
            // Log incomplete experience data
            // console.log(
            //    `Experience ${index + 1}: Incomplete data (Start Date = ${
            //       exp.startDate
            //    }, End Date = ${exp.endDate})`
            // );
         }
      });

      // Convert total months to years and round to 1 decimal place
      const totalYears = (totalMonths / 12).toFixed(1);

      // Log combined total experience
      // console.log(
      //    `Total Experience: ${totalYears} years (${totalMonths} months)`
      // );

      return totalYears;
   };

   const totalExperience = userDetails?.experience
      ? calculateTotalExperience(userDetails.experience)
      : 0;

   return (
      <div
         className="w-[850px] max-h-[800px] overflow-y-auto bg-gradient-to-b from-[#370c3e] to-[#243465] p-6 text-white rounded-lg shadow-xl"
         style={{ fontFamily: "Arial, sans-serif" }}
      >
         {isInitializing ? (
            <LoadingSpinner />
         ) : (
            <>
               {/* Header */}
               <div className="mb-10 flex items-center justify-between">
                  <div className="w-[37%]">
                     <h1 className="text-2xl font-extrabold">ResumeOnFly🚀</h1>
                     <p className="text-sm opacity-75">
                        Designs resume based on jobDescription, works on any
                        website.{" "}
                        <span className="text-xs text-pink-500">
                           prod. by CVtoSalary.com
                        </span>
                     </p>
                  </div>

                  {/* Quota Display */}
                  {user && userQuota && (
                     <div className="flex items-center justify-end gap-2 w-[39%]">
                        <QuotaDisplay
                           userQuota={userQuota}
                           onRefresh={refreshUserQuota}
                        />
                        <PremiumUpgradeButton
                           user={user}
                           userQuota={userQuota}
                           onUpgradeSuccess={refreshUserQuota}
                        />
                     </div>
                  )}

                  {user ? (
                     <div className="flex items-center justify-end gap-2 w-[39%]">
                        <img
                           src={user.picture}
                           alt={user.name}
                           className="w-8 h-8 rounded-full"
                           title="User Avatar"
                        />
                        <div className="text-sm">
                           <div className="flex mb-1">
                              <p
                                 className="mr-1 px-2 py-1 bg-slate-900 rounded-lg"
                                 title="Your name"
                              >
                                 {user.name}
                              </p>
                              <button
                                 onClick={handleEditClick}
                                 className="text-sm text-blue-400 hover:text-blue-300 mr-1 px-2 py-1 bg-slate-900 rounded-lg"
                                 title="Edit Details"
                              >
                                 Edit Details
                              </button>
                              <button
                                 onClick={handleLogout}
                                 className="text-sm text-red-500 hover:text-red-400 bg-slate-900 px-2 py-1 rounded-lg"
                                 title="Logout"
                              >
                                 <LogOutIcon size={16} />
                              </button>
                           </div>
                           <p
                              className="text-slate-300 px-2 py-1 bg-slate-900 rounded-lg"
                              title="Your email"
                           >
                              {user.email}
                           </p>
                        </div>
                     </div>
                  ) : (
                     <button
                        onClick={handleGoogleLogin}
                        disabled={loginLoading}
                        className="bg-blue-600 px-4 py-2 text-sm font-bold rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                        title="Sign in with Google"
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
                     <UserDetailsForm
                        onSave={handleSaveUserDetails}
                        onCancel={handleCancelUserDetails}
                        initialData={userDetails}
                     />
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
                        refreshUserQuota={refreshUserQuota}
                        totalExperience={totalExperience}
                     />
                  )
               ) : null}
            </>
         )}
      </div>
   );
}

export default App;
