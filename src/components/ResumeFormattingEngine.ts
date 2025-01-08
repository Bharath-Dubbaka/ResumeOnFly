import { UserDetails } from "../types/types";

export class ResumeFormattingEngine {
   private static validateField(field: any): string {
      return field || ""; // Return empty string if field is null/undefined
   }

   public static formatPrompt(
      userDetails: UserDetails,
      technicalSkills: string[],
      totalExperience: string | number
   ): string {
      const prompt = `
            Generate a JSON resume with this EXACT structure:
            {
            "fullName": "${this.validateField(userDetails.fullName)}",
            "contactInformation": "${this.validateField(userDetails.email)}${
         userDetails.phone ? ` | ${userDetails.phone}` : ""
      }",
            "professionalSummary": "A detailed summary highlighting ${totalExperience} years of experience in ${technicalSkills.join(
         ", "
      )}, exactly 6 sentences",
            "technicalSkills": "${technicalSkills.join(", ")}",
            "professionalExperience": [
                ${userDetails.experience
                   .map(
                      (exp) => `{
                    "title": "${this.validateField(exp.title)}",
                    "employer": "${this.validateField(exp.employer)}",
                    "startDate": "${this.validateField(exp.startDate)}",
                    "endDate": "${this.validateField(exp.endDate)}",
                    "location": "${this.validateField(exp.location)}",
                    "responsibilities": [
                        ${
                           exp.responsibilityType === "skillBased"
                              ? `"GENERATE_8_RESPONSIBILITIES_USING_ONLY_SKILLS: ${technicalSkills.join(
                                   ", "
                                )}"`
                              : `"GENERATE_8_RESPONSIBILITIES_BASED_ONLY_ON_ROLE: ${exp.title}"`
                        }
                    ]
                }`
                   )
                   .join(",\n")}
            ],
            "education": ${JSON.stringify(userDetails.education || [])},
            "certifications": ${JSON.stringify(
               userDetails.certifications || []
            )},
            "projects": ${JSON.stringify(userDetails.projects || [])}
            }

            STRICT RULES:
            1. Keep ALL provided values exactly as shown
            2. Generate EXACTLY 8 unique responsibilities per experience
            3. DO NOT modify or remove any fields
            4. Return ONLY the JSON object`;

      return prompt;
   }

   public static validateResponse(response: any): boolean {
      try {
         // Basic structure validation
         if (!response || typeof response !== "object") {
            console.error("Response is not an object");
            return false;
         }

         // Check for required sections with detailed logging
         const requiredSections = [
            "professionalExperience",
            "fullName",
            "contactInformation",
            "technicalSkills",
            "professionalSummary",
         ];

         for (const section of requiredSections) {
            if (!response[section]) {
               console.error(`Missing required section: ${section}`);
               return false;
            }
         }

         // Validate professional experience
         if (!Array.isArray(response.professionalExperience)) {
            console.error("professionalExperience is not an array");
            return false;
         }

         for (const [index, exp] of response.professionalExperience.entries()) {
            if (!exp.title || !exp.employer || !exp.responsibilities) {
               console.error(`Experience ${index} missing required fields`);
               return false;
            }

            if (!Array.isArray(exp.responsibilities)) {
               console.error(
                  `Experience ${index} responsibilities is not an array`
               );
               return false;
            }

            // Allow minimum 6 responsibilities instead of strict 8
            if (exp.responsibilities.length < 6) {
               console.error(
                  `Experience ${index} has fewer than 6 responsibilities`
               );
               return false;
            }
         }

         return true;
      } catch (error) {
         console.error("Validation error:", error);
         return false;
      }
   }
}


  