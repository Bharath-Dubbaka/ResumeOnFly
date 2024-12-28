import { useState, useEffect } from "react";

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

interface UserDetailsFormProps {
   onSave: (details: UserDetails) => void;
   onCancel: () => void; // Add the type for the onCancel prop
}

const UserDetailsForm = ({ onSave, onCancel }: UserDetailsFormProps) => {
   const [userDetails, setUserDetails] = useState<UserDetails>({
      fullName: "",
      email: "",
      phone: "",
      experience: [],
      education: [],
      certifications: [],
      projects: [],
   });

   const hasUserDetailsData = (details: UserDetails): boolean => {
      if (details.fullName || details.email || details.phone) {
         return true;
      }
      if (
         details.experience.length > 0 ||
         details.education.length > 0 ||
         details.certifications.length > 0 ||
         details.projects.length > 0
      ) {
         return true;
      }
      return false;
   };

   useEffect(() => {
      chrome.storage.local.get("userDetails", (result) => {
         if (result.userDetails) {
            setUserDetails(result.userDetails);
         }
      });
   }, []);

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
      <div className="p-4 bg-transparent rounded-lg text-slate-200 backdrop-blur-lg">
         {/* 1ST COL */}
         <div className="text-lg font-bold mb-3 px-2 py-4 border border-slate-600 rounded-lg bg-transparent custom-blur">
            <div className="flex items-center mb-1">
               Enter Your Details:{" "}
               <span className="text-sm text-red-600 ml-2">
                  *Can be changed later
               </span>
            </div>
            <div className="flex justify-between">
               <input
                  type="text"
                  placeholder="Full Name"
                  value={userDetails.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  className="w-[32%] px-3 py-2 text-sm text-gray-900 
              bg-gray-100 border border-gray-200 
              rounded-md outline-none focus:ring-blue-500 focus:border-blue-500"
               />
               <input
                  type="email"
                  placeholder="Email"
                  value={userDetails.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="w-[32%] px-3 py-2 text-sm text-gray-900 
              bg-gray-100 border border-gray-200 
              rounded-md outline-none focus:ring-blue-500 focus:border-blue-500"
               />
               <input
                  type="text"
                  placeholder="Phone"
                  value={userDetails.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="w-[32%] px-3 py-2 text-sm text-gray-900 
              bg-gray-100 border border-gray-200 
              rounded-md outline-none focus:ring-blue-500 focus:border-blue-500"
               />
            </div>
         </div>

         <div>
            {/* Experience */}
            <div className="mb-3 px-2 py-4 border border-slate-600 rounded-lg bg-transparent custom-blur">
               <div className="text-lg font-semibold">Work Experiences:</div>
               {userDetails.experience.map((exp, index) => (
                  <>
                     <div key={index} className="space-y-2 my-4">
                        <div className="mt-2 text-sm mb-2 bg-blue-600 text-white w-fit px-2 py-1 rounded-lg">
                           Experience {index + 1} :
                        </div>
                        <div className="flex gap-1">
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
                              className="w-full px-3 py-2 text-sm text-gray-900 
              bg-gray-100 border border-gray-200 
              rounded-md outline-none focus:ring-blue-500 focus:border-blue-500"
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
                              className="w-full px-3 py-2 text-sm text-gray-900 
              bg-gray-100 border border-gray-200 
              rounded-md outline-none focus:ring-blue-500 focus:border-blue-500"
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
                              className="w-full px-3 py-2 text-sm text-gray-900 
              bg-gray-100 border border-gray-200 
              rounded-md outline-none focus:ring-blue-500 focus:border-blue-500"
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
                              className="w-full px-3 py-2 text-sm text-gray-900 
              bg-gray-100 border border-gray-200 
              rounded-md outline-none focus:ring-blue-500 focus:border-blue-500"
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
                              className="w-full px-3 py-2 text-sm text-gray-900 
              bg-gray-100 border border-gray-200 
              rounded-md outline-none focus:ring-blue-500 focus:border-blue-500"
                           />
                        </div>
                        <button
                           className="text-sm px-2 py-1 bg-red-700 text-white rounded hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-400"
                           onClick={() =>
                              handleRemoveField("experience", index)
                           }
                        >
                           Remove
                        </button>
                     </div>
                     <hr className="border-slate-600" />
                  </>
               ))}
               <div className="flex justify-center">
                  <button
                     className="mt-4 bg-green-600 px-2 py-1 text-sm font-bold rounded-lg border border-gray-800"
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
            </div>

            {/* Education */}
            <div className="mb-3 px-2 py-4 border border-slate-600 rounded-lg bg-transparent custom-blur">
               <h4 className="text-lg font-semibold">Education:</h4>
               {userDetails.education.map((edu, index) => (
                  <div key={index} className="space-y-2 mb-2">
                     <div className="flex gap-1">
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
                           className="w-full px-3 py-2 text-sm text-gray-900 
              bg-gray-100 border border-gray-200 
              rounded-md outline-none focus:ring-blue-500 focus:border-blue-500"
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
                           className="w-full px-3 py-2 text-sm text-gray-900 
              bg-gray-100 border border-gray-200 
              rounded-md outline-none focus:ring-blue-500 focus:border-blue-500"
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
                           className="w-full px-3 py-2 text-sm text-gray-900 
              bg-gray-100 border border-gray-200 
              rounded-md outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                     </div>
                     <button
                        className="text-sm px-2 py-1 bg-red-700 text-white rounded hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-400"
                        onClick={() => handleRemoveField("education", index)}
                     >
                        Remove
                     </button>
                  </div>
               ))}
               <div className="flex justify-center">
                  <button
                     className="mt-2 bg-green-600 px-2 py-1 text-sm font-bold rounded-lg border border-gray-800"
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
            </div>

            {/* Certifications */}
            <div className="mb-3 px-2 py-4 border border-slate-600 rounded-lg bg-transparent custom-blur">
               <h4 className="text-lg font-semibold">Certifications:</h4>
               {userDetails.certifications.map((cert, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
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
                        className="w-full px-3 py-2 text-sm text-gray-900 
              bg-gray-100 border border-gray-200 
              rounded-md outline-none focus:ring-blue-500 focus:border-blue-500"
                     />
                     <button
                        className="px-2 py-1 bg-red-700 text-white rounded hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-400 text-sm"
                        onClick={() =>
                           handleRemoveField("certifications", index)
                        }
                     >
                        Remove
                     </button>
                  </div>
               ))}
               <div className="flex justify-center">
                  <button
                     className="mt-2 bg-green-600 px-2 py-1 text-sm font-bold rounded-lg border border-gray-800"
                     onClick={() => handleAddField("certifications", "")}
                  >
                     Add Certification
                  </button>
               </div>
            </div>

            {/* Projects */}
            <div className="mb-3 px-2 py-4 border border-slate-600 rounded-lg bg-transparent custom-blur">
               <h4 className="text-lg font-semibold">Projects:</h4>
               {userDetails.projects.map((proj, index) => (
                  <div key={index} className="space-y-2 mb-2">
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
                        className="w-full px-3 py-2 text-sm text-gray-900 
              bg-gray-100 border border-gray-200 
              rounded-md outline-none focus:ring-blue-500 focus:border-blue-500"
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
                        className="w-full px-3 py-2 text-sm text-gray-900 
              bg-gray-100 border border-gray-200 
              rounded-md outline-none focus:ring-blue-500 focus:border-blue-500"
                     />
                     <button
                        className="px-2 py-1 bg-red-700 text-white rounded hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-400 text-sm"
                        onClick={() => handleRemoveField("projects", index)}
                     >
                        Remove
                     </button>
                  </div>
               ))}
               <div className="flex justify-center">
                  <button
                     className="mt-2 bg-green-600 px-2 py-1 text-sm font-bold rounded-lg border border-gray-800"
                     onClick={() =>
                        handleAddField("projects", {
                           name: "",
                           description: "",
                        })
                     }
                  >
                     Add Project
                  </button>
               </div>
            </div>
         </div>

         {/* Save and Cancel */}
         <div className="mt-4 flex justify-center space-x-4">
            {" "}
            <button
               onClick={handleSave}
               className="mt-4 bg-blue-600 hover:bg-blue-800 px-4 py-2 text-sm font-bold rounded-lg border border-gray-800"
            >
               Save Details
            </button>
            {hasUserDetailsData(userDetails) && (
               <button
                  onClick={onCancel} // Call the onCancel prop
                  className="mt-4 bg-red-700 hover:bg-red-800 px-4 py-2 text-sm font-bold rounded-lg border border-gray-800"
               >
                  Cancel{" "}
               </button>
            )}
         </div>
      </div>
   );
};

export default UserDetailsForm;
