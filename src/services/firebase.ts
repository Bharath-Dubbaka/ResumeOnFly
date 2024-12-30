import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
   apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
   authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
   projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
   storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
   messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
   appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Modified error handling function that checks auth state first
async function fetchDataWithErrorHandling() {
   // Only proceed if user is authenticated
   if (!auth.currentUser) {
      console.log("No authenticated user, skipping data fetch");
      return;
   }

   try {
      const docRef = doc(db, "your-collection", "document-id");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
         console.log("Document data:", docSnap.data());
      } else {
         console.log("No such document!");
      }
   } catch (error: any) {
      if (error.code === "permission-denied") {
         console.log(
            "Permission denied. User may not be properly authenticated."
         );
         return;
      }
      console.error("Error fetching document:", error);
   }
}

// Don't call fetchDataWithErrorHandling immediately
// Instead, export it to be called after authentication
export { fetchDataWithErrorHandling };
