// src/services/UserDetailsServices.tsx

import { db } from "./firebase";
import type { UserDetails } from "../types/types";
import { doc, getDoc, setDoc } from "firebase/firestore";

export class UserDetailsService {
   static async getUserDetails(uid: string): Promise<UserDetails | null> {
      try {
         const userRef = doc(db, "userDetails", uid);
         const docSnap = await getDoc(userRef);

         if (!docSnap.exists()) {
            return null;
         }

         const data = docSnap.data();
         // Ensure the data matches our UserDetails type
         const userDetails: UserDetails = {
            fullName: data.fullName,
            email: data.email,
            phone: data.phone,
            experience: data.experience,
            education: data.education,
            certifications: data.certifications,
            projects: data.projects,
         };
         return userDetails;
      } catch (error) {
         console.error("Error fetching user details:", error);
         throw error;
      }
   }

   static async saveUserDetails(
      uid: string,
      details: UserDetails
   ): Promise<void> {
      try {
         const userRef = doc(db, "userDetails", uid);
         await setDoc(userRef, details);
      } catch (error) {
         console.error("Error saving user details:", error);
         throw error;
      }
   }
}
