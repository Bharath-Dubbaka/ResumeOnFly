import { useState } from "react";

interface UserDetails {
   fullName: string;
   email: string;
   phone: string;
   experience: {
      title: string;
      employer: string;
      startDate: string;
      endDate: string;
      location: string;
   }[];
   education: { degree: string; institution: string; year: string }[];
   certifications: string[];
   projects: { name: string; description: string }[];
}

const UserDetailsForm = ({
   onSave,
}: {
   onSave: (details: UserDetails) => void;
}) => {
   const [userDetails, setUserDetails] = useState<UserDetails>({
      fullName: "",
      email: "",
      phone: "",
      experience: [],
      education: [],
      certifications: [],
      projects: [],
   });

   const handleChange = (field: string, value: any) => {
      setUserDetails({ ...userDetails, [field]: value });
   };

   const handleAddField = <T extends keyof UserDetails>(
      field: T,
      value: UserDetails[T][number]
   ) => {
      setUserDetails((prevDetails) => ({
         ...prevDetails,
         [field]: [...(prevDetails[field] as Array<any>), value],
      }));
   };

   const handleRemoveField = <T extends keyof UserDetails>(
      field: T,
      index: number
   ) => {
      setUserDetails((prevDetails) => ({
         ...prevDetails,
         [field]: (prevDetails[field] as Array<any>).filter(
            (_, i) => i !== index
         ),
      }));
   };

   const handleSave = () => {
      chrome.storage.local.set({ userDetails }, () => {
         onSave(userDetails);
      });
   };

   return (
      <div className="p-4 bg-blue-900/30 rounded-lg">
         <h3 className="text-lg font-bold">Enter Your Details</h3>
         <div className="space-y-4">
            <input
               type="text"
               placeholder="Full Name"
               value={userDetails.fullName}
               onChange={(e) => handleChange("fullName", e.target.value)}
               className="w-full px-3 py-2 text-sm text-gray-900 rounded-lg"
            />
            <input
               type="email"
               placeholder="Email"
               value={userDetails.email}
               onChange={(e) => handleChange("email", e.target.value)}
               className="w-full px-3 py-2 text-sm text-gray-900 rounded-lg"
            />
            <input
               type="text"
               placeholder="Phone"
               value={userDetails.phone}
               onChange={(e) => handleChange("phone", e.target.value)}
               className="w-full px-3 py-2 text-sm text-gray-900 rounded-lg"
            />

            {/* Experience */}
            <div>
               <h4 className="text-md font-semibold">Experience</h4>
               {userDetails.experience.map((exp, index) => (
                  <div key={index} className="space-y-2">
                     <input
                        type="text"
                        placeholder="Job Title"
                        value={exp.title}
                        onChange={(e) =>
                           handleChange("experience", [
                              ...userDetails.experience.slice(0, index),
                              { ...exp, title: e.target.value },
                              ...userDetails.experience.slice(index + 1),
                           ])
                        }
                        className="w-full px-3 py-2 text-sm text-gray-900 rounded-lg"
                     />
                     <input
                        type="text"
                        placeholder="Employer"
                        value={exp.employer}
                        onChange={(e) =>
                           handleChange("experience", [
                              ...userDetails.experience.slice(0, index),
                              { ...exp, employer: e.target.value },
                              ...userDetails.experience.slice(index + 1),
                           ])
                        }
                        className="w-full px-3 py-2 text-sm text-gray-900 rounded-lg"
                     />
                     <input
                        type="text"
                        placeholder="Start Date"
                        value={exp.startDate}
                        onChange={(e) =>
                           handleChange("experience", [
                              ...userDetails.experience.slice(0, index),
                              { ...exp, startDate: e.target.value },
                              ...userDetails.experience.slice(index + 1),
                           ])
                        }
                        className="w-full px-3 py-2 text-sm text-gray-900 rounded-lg"
                     />
                     <input
                        type="text"
                        placeholder="End Date"
                        value={exp.endDate}
                        onChange={(e) =>
                           handleChange("experience", [
                              ...userDetails.experience.slice(0, index),
                              { ...exp, endDate: e.target.value },
                              ...userDetails.experience.slice(index + 1),
                           ])
                        }
                        className="w-full px-3 py-2 text-sm text-gray-900 rounded-lg"
                     />
                     <input
                        type="text"
                        placeholder="Location (Optional)"
                        value={exp.location}
                        onChange={(e) =>
                           handleChange("experience", [
                              ...userDetails.experience.slice(0, index),
                              { ...exp, location: e.target.value },
                              ...userDetails.experience.slice(index + 1),
                           ])
                        }
                        className="w-full px-3 py-2 text-sm text-gray-900 rounded-lg"
                     />
                     <button
                        className="text-red-500 text-sm"
                        onClick={() => handleRemoveField("experience", index)}
                     >
                        Remove
                     </button>
                  </div>
               ))}
               <button
                  className="mt-2 bg-green-600 px-2 py-1 text-sm font-bold rounded-lg"
                  onClick={() =>
                     handleAddField("experience", {
                        title: "",
                        startDate: "",
                        endDate: "",
                        employer: "",
                        location: "",
                     })
                  }
               >
                  Add Experience
               </button>
            </div>

            {/* Education */}
            <div>
               <h4 className="text-md font-semibold">Education</h4>
               {userDetails.education.map((edu, index) => (
                  <div key={index} className="space-y-2">
                     <input
                        type="text"
                        placeholder="Degree"
                        value={edu.degree}
                        onChange={(e) =>
                           handleChange("education", [
                              ...userDetails.education.slice(0, index),
                              { ...edu, degree: e.target.value },
                              ...userDetails.education.slice(index + 1),
                           ])
                        }
                        className="w-full px-3 py-2 text-sm text-gray-900 rounded-lg"
                     />
                     <input
                        type="text"
                        placeholder="Institution"
                        value={edu.institution}
                        onChange={(e) =>
                           handleChange("education", [
                              ...userDetails.education.slice(0, index),
                              { ...edu, institution: e.target.value },
                              ...userDetails.education.slice(index + 1),
                           ])
                        }
                        className="w-full px-3 py-2 text-sm text-gray-900 rounded-lg"
                     />
                     <input
                        type="text"
                        placeholder="Year"
                        value={edu.year}
                        onChange={(e) =>
                           handleChange("education", [
                              ...userDetails.education.slice(0, index),
                              { ...edu, year: e.target.value },
                              ...userDetails.education.slice(index + 1),
                           ])
                        }
                        className="w-full px-3 py-2 text-sm text-gray-900 rounded-lg"
                     />
                     <button
                        className="text-red-500 text-sm"
                        onClick={() => handleRemoveField("education", index)}
                     >
                        Remove
                     </button>
                  </div>
               ))}
               <button
                  className="mt-2 bg-green-600 px-2 py-1 text-sm font-bold rounded-lg"
                  onClick={() =>
                     handleAddField("education", {
                        degree: "",
                        institution: "",
                        year: "",
                     })
                  }
               >
                  Add Education
               </button>
            </div>

            {/* Certifications */}
            <div>
               <h4 className="text-md font-semibold">Certifications</h4>
               {userDetails.certifications.map((cert, index) => (
                  <div key={index} className="flex items-center space-x-2">
                     <input
                        type="text"
                        placeholder="Certification"
                        value={cert}
                        onChange={(e) =>
                           handleChange("certifications", [
                              ...userDetails.certifications.slice(0, index),
                              e.target.value,
                              ...userDetails.certifications.slice(index + 1),
                           ])
                        }
                        className="w-full px-3 py-2 text-sm text-gray-900 rounded-lg"
                     />
                     <button
                        className="text-red-500 text-sm"
                        onClick={() =>
                           handleRemoveField("certifications", index)
                        }
                     >
                        Remove
                     </button>
                  </div>
               ))}
               <button
                  className="mt-2 bg-green-600 px-2 py-1 text-sm font-bold rounded-lg"
                  onClick={() => handleAddField("certifications", "")}
               >
                  Add Certification
               </button>
            </div>

            {/* Projects */}
            <div>
               <h4 className="text-md font-semibold">Projects</h4>
               {userDetails.projects.map((proj, index) => (
                  <div key={index} className="space-y-2">
                     <input
                        type="text"
                        placeholder="Project Name"
                        value={proj.name}
                        onChange={(e) =>
                           handleChange("projects", [
                              ...userDetails.projects.slice(0, index),
                              { ...proj, name: e.target.value },
                              ...userDetails.projects.slice(index + 1),
                           ])
                        }
                        className="w-full px-3 py-2 text-sm text-gray-900 rounded-lg"
                     />
                     <textarea
                        placeholder="Description"
                        value={proj.description}
                        onChange={(e) =>
                           handleChange("projects", [
                              ...userDetails.projects.slice(0, index),
                              { ...proj, description: e.target.value },
                              ...userDetails.projects.slice(index + 1),
                           ])
                        }
                        className="w-full px-3 py-2 text-sm text-gray-900 rounded-lg"
                     />
                     <button
                        className="text-red-500 text-sm"
                        onClick={() => handleRemoveField("projects", index)}
                     >
                        Remove
                     </button>
                  </div>
               ))}
               <button
                  className="mt-2 bg-green-600 px-2 py-1 text-sm font-bold rounded-lg"
                  onClick={() =>
                     handleAddField("projects", { name: "", description: "" })
                  }
               >
                  Add Project
               </button>
            </div>
         </div>
         <button
            onClick={handleSave}
            className="mt-4 bg-blue-600 px-4 py-2 text-sm font-bold rounded-lg"
         >
            Save Details
         </button>
      </div>
   );
};

export default UserDetailsForm;