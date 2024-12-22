export interface UserData {
   email: string;
   name: string;
   picture: string;
}

export interface UserDetails {
   fullName: string;
   email: string;
   phone: string;
   experience: { title: string; startDate: string; endDate: string }[];
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
