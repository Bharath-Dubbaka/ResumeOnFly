// src/services/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
   // Replace with your Firebase config
   apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
   authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
   projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
   storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
   messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
   appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Example error handling function
async function fetchDataWithErrorHandling() {
   try {
      const docRef = doc(db, "your-collection", "document-id");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
         console.log("Document data:", docSnap.data());
      } else {
         console.log("No such document!");
      }
   } catch (error: any) {
      console.error("Error fetching document:", error);
      // Handle specific errors here
      if (error.code === "auth/user-not-signed-in") {
         console.error("User is not signed in");
         // Redirect to sign-in page or handle accordingly
      } else if (error.code === "firestore/not-found") {
         console.error("Document not found");
      } else {
         console.error("Unexpected error:", error);
      }
   }
}

// Call this function when needed
fetchDataWithErrorHandling();
