export interface UserData {
   email: string;
   name: string;
   picture: string;
   uid: string;
}

export interface UserQuota {
   downloads: {
      used: number;
      limit: number;
   };
   generates: {
      used: number;
      limit: number;
   };
   parsing: {
      used: number;
      limit: number;
   };
   subscription: {
      type: "free" | "premium";
      startDate: string;
      endDate: string;
   };
}

export interface ExtendedUserData extends UserData {
   quota: UserQuota;
}

export interface UserDetails {
   fullName: string;
   email: string;
   phone: string;
   experience: {
      title: string;
      employer: string;
      startDate: string;
      endDate: string;
      location: string;
      responsibilityType: "skillBased" | "titleBased";
   }[];
   education: { degree: string; institution: string; year: string }[];
   certifications: string[];
   projects: { name: string; description: string }[];
}

export interface AnalysisResult {
   technicalSkills: string[];
   yearsOfExperience: number;
   softSkills: string[];
   text: string;
   analysis: AnalysisResult;
}
