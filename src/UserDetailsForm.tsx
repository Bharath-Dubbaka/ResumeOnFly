import { Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import LoadingSpinner from "./LoadingSpinner";

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
      responsibilityType: "skillBased" | "titleBased";
      customResponsibilities: string[];
   }[];
   education: { degree: string; institution: string; year: string }[];
   certifications: string[];
   projects: { name: string; description: string }[];
}

interface UserDetailsFormProps {
   onSave: (details: UserDetails) => void;
   onCancel: () => void; // Add the type for the onCancel prop
   initialData?: UserDetails | null;
}

const UserDetailsForm = ({
   onSave,
   onCancel,
   initialData,
}: UserDetailsFormProps) => {
   const [userDetails, setUserDetails] = useState<UserDetails>(() => {
      if (initialData) {
         return initialData;
      }
      return {
         fullName: "",
         email: "",
         phone: "",
         experience: [],
         education: [],
         certifications: [],
         projects: [],
      };
   });

   const [loading, setLoading] = useState<boolean>(false);

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
      if (initialData) {
         setUserDetails(initialData);
      }
   }, [initialData]);

   const handleChange = (field: string, value: any) => {
      setUserDetails({ ...userDetails, [field]: value });
   };

   const handleDateChange = (
      date: Date | null,
      field: string,
      index: number
   ) => {
      if (date) {
         const year = date.getFullYear();
         const month = date.getMonth() + 1; // Month is 0-indexed
         const formattedDate = `${year}-${month.toString().padStart(2, "0")}`; // YYYY-MM

         handleChange("experience", [
            ...userDetails.experience.slice(0, index),
            {
               ...userDetails.experience[index],
               [field]: formattedDate,
            },
            ...userDetails.experience.slice(index + 1),
         ]);
      }
   };

   const isValidDate = (dateString: string) => {
      if (!dateString) return false;
      const [year, month] = dateString.split("-").map(Number);
      return !isNaN(year) && !isNaN(month) && month >= 1 && month <= 12;
   };

   const handleAddField = <T extends keyof UserDetails>(
      field: T,
      value:
         | Omit<UserDetails[T][number], "responsibilityType">
         | UserDetails[T][number]
   ) => {
      if (field === "experience") {
         const experienceValue = {
            ...(value as Omit<
               UserDetails["experience"][number],
               "responsibilityType"
            >),
            responsibilityType: "skillBased" as const,
         };
         setUserDetails((prevDetails) => ({
            ...prevDetails,
            [field]: [...prevDetails[field], experienceValue],
         }));
      } else {
         setUserDetails((prevDetails) => ({
            ...prevDetails,
            [field]: [...(prevDetails[field] as Array<any>), value],
         }));
      }
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

   const handleSave = async () => {
      setLoading(true);
      try {
         await onSave(userDetails);
      } catch (error) {
         console.error("Error saving user details:", error);
         alert("Failed to save user details. Please try again.");
      } finally {
         setLoading(false);
      }
   };

   return (
      <div>
         {loading ? (
            <LoadingSpinner />
         ) : (
            <div className="p-6 bg-slate-900/80 rounded-xl text-slate-100 backdrop-blur-lg shadow-xl">
               {/* Personal Details */}
               <div className="mb-6 p-5 border border-slate-700/50 rounded-xl bg-slate-800/30 shadow-lg">
                  <div className="flex items-center mb-4">
                     <h3 className="text-xl font-bold text-white">
                        Enter Your Details
                     </h3>
                     <span className="text-sm text-rose-400 ml-3">
                        *Can be changed later
                     </span>
                  </div>
                  <div className="flex justify-between gap-4">
                     <input
                        type="text"
                        placeholder="Full Name"
                        value={userDetails.fullName}
                        onChange={(e) =>
                           handleChange("fullName", e.target.value)
                        }
                        className="w-1/3 px-4 py-2.5 text-sm text-slate-900 bg-white/90 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                     />
                     <input
                        type="email"
                        placeholder="Email"
                        value={userDetails.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        className="w-1/3 px-4 py-2.5 text-sm text-slate-900 bg-white/90 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                     />
                     <input
                        type="text"
                        placeholder="Phone"
                        value={userDetails.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        className="w-1/3 px-4 py-2.5 text-sm text-slate-900 bg-white/90 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                     />
                  </div>
               </div>

               <div className="space-y-6">
                  {/* Experience Section */}
                  <div className="p-5 border border-slate-700/50 rounded-xl bg-slate-800/30 shadow-lg">
                     {/* <div className="flex flex-col items-center"> */}
                     <h4 className="text-xl font-bold text-white mb-6">
                        Work Experiences
                     </h4>
                     {/* </div> */}

                     {userDetails.experience.map((exp, index) => (
                        <div key={index} className="mb-6 last:mb-0">
                           {/* <div className="flex flex-col items-center"> */}
                           <div className="inline-block px-4 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg mb-6">
                              Experience {index + 1}
                           </div>
                           {/* </div> */}
                           <div className="flex justify-between">
                              <input
                                 type="text"
                                 placeholder="Job Title"
                                 value={exp.title}
                                 onChange={(e) =>
                                    handleChange("experience", [
                                       ...userDetails.experience.slice(
                                          0,
                                          index
                                       ),
                                       { ...exp, title: e.target.value },
                                       ...userDetails.experience.slice(
                                          index + 1
                                       ),
                                    ])
                                 }
                                 className="w-[19%] px-4 py-2.5 text-sm text-slate-900 bg-white/90 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                              />
                              <input
                                 type="text"
                                 placeholder="Employer"
                                 value={exp.employer}
                                 onChange={(e) =>
                                    handleChange("experience", [
                                       ...userDetails.experience.slice(
                                          0,
                                          index
                                       ),
                                       { ...exp, employer: e.target.value },
                                       ...userDetails.experience.slice(
                                          index + 1
                                       ),
                                    ])
                                 }
                                 className="w-[19%] px-4 py-2.5 text-sm text-slate-900 bg-white/90 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                              />
                              {/* START END DATES */}
                              <div className="max-w-[19%]">
                                 <DatePicker
                                    selected={
                                       isValidDate(exp.startDate)
                                          ? new Date(
                                               Number(
                                                  exp.startDate.split("-")[0]
                                               ),
                                               Number(
                                                  exp.startDate.split("-")[1]
                                               ) - 1
                                            ) // Correct Date creation
                                          : null
                                    }
                                    onChange={(date) =>
                                       handleDateChange(
                                          date,
                                          "startDate",
                                          index
                                       )
                                    }
                                    placeholderText="Start Date"
                                    dateFormat="MM-yyyy"
                                    showMonthYearPicker
                                    className="w-full px-4 py-2.5 text-sm text-slate-900 bg-white/90 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                 />
                              </div>
                              <div className="max-w-[19%]">
                                 <DatePicker
                                    selected={
                                       isValidDate(exp.endDate)
                                          ? new Date(
                                               Number(
                                                  exp.endDate.split("-")[0]
                                               ),
                                               Number(
                                                  exp.endDate.split("-")[1]
                                               ) - 1
                                            ) // Correct Date creation
                                          : null
                                    }
                                    onChange={(date) =>
                                       handleDateChange(date, "endDate", index)
                                    }
                                    placeholderText="End Date"
                                    dateFormat="MM-yyyy"
                                    showMonthYearPicker
                                    className="w-full px-4 py-2.5 text-sm text-slate-900 bg-white/90 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                 />
                              </div>

                              <input
                                 type="text"
                                 placeholder="Location (Optional)"
                                 value={exp.location}
                                 onChange={(e) =>
                                    handleChange("experience", [
                                       ...userDetails.experience.slice(
                                          0,
                                          index
                                       ),
                                       { ...exp, location: e.target.value },
                                       ...userDetails.experience.slice(
                                          index + 1
                                       ),
                                    ])
                                 }
                                 className="w-[19%] px-4 py-2.5 text-sm text-slate-900 bg-white/90 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                              />
                           </div>

                           <div className="flex items-center gap-4 mt-6">
                              <h5 className="text-sm font-semibold">
                                 Generate other responsibilities based on:
                              </h5>
                              <select
                                 value={exp.responsibilityType}
                                 onChange={(e) =>
                                    handleChange("experience", [
                                       ...userDetails.experience.slice(
                                          0,
                                          index
                                       ),
                                       {
                                          ...exp,
                                          responsibilityType: e.target.value as
                                             | "skillBased"
                                             | "titleBased",
                                       },
                                       ...userDetails.experience.slice(
                                          index + 1
                                       ),
                                    ])
                                 }
                                 className="px-4 py-2 text-sm text-slate-900 bg-white/90 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                              >
                                 <option value="skillBased">
                                    Current Skills
                                 </option>
                                 <option value="titleBased">Role Title</option>
                              </select>
                           </div>

                           <div className="mt-4">
                              <h5 className="text-sm font-semibold mb-2">
                                 Custom Responsibilities:
                              </h5>
                              {exp.customResponsibilities?.map(
                                 (resp, respIndex) => (
                                    <div
                                       key={respIndex}
                                       className="flex items-center gap-2 mb-2"
                                    >
                                       <input
                                          type="text"
                                          value={resp}
                                          onChange={(e) =>
                                             handleChange("experience", [
                                                ...userDetails.experience.slice(
                                                   0,
                                                   index
                                                ),
                                                {
                                                   ...exp,
                                                   customResponsibilities:
                                                      exp.customResponsibilities.map(
                                                         (r, i) =>
                                                            i === respIndex
                                                               ? e.target.value
                                                               : r
                                                      ),
                                                },
                                                ...userDetails.experience.slice(
                                                   index + 1
                                                ),
                                             ])
                                          }
                                          className="flex-1 px-4 py-2 text-sm text-slate-900 bg-white/90 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                       />
                                       <button
                                          onClick={() =>
                                             handleChange("experience", [
                                                ...userDetails.experience.slice(
                                                   0,
                                                   index
                                                ),
                                                {
                                                   ...exp,
                                                   customResponsibilities:
                                                      exp.customResponsibilities.filter(
                                                         (_, i) =>
                                                            i !== respIndex
                                                      ),
                                                },
                                                ...userDetails.experience.slice(
                                                   index + 1
                                                ),
                                             ])
                                          }
                                          className="px-2 py-1 text-sm font-medium bg-rose-600 text-white rounded-lg hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-colors duration-200"
                                       >
                                          <Trash2 size={16} />
                                       </button>
                                    </div>
                                 )
                              )}
                              <button
                                 onClick={() =>
                                    handleChange("experience", [
                                       ...userDetails.experience.slice(
                                          0,
                                          index
                                       ),
                                       {
                                          ...exp,
                                          customResponsibilities: [
                                             ...(exp.customResponsibilities ||
                                                []),
                                             "",
                                          ],
                                       },
                                       ...userDetails.experience.slice(
                                          index + 1
                                       ),
                                    ])
                                 }
                                 className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 mt-2"
                              >
                                 Add Responsibility
                              </button>
                           </div>
                           {/* REMOVE EXPERIENCE BTN */}
                           <div className="flex flex-col items-center">
                              <button
                                 className="px-3 py-2.5 mt-4 text-sm font-medium bg-rose-600 text-white rounded-lg hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-colors duration-200"
                                 onClick={() =>
                                    handleRemoveField("experience", index)
                                 }
                              >
                                 Remove Experience
                              </button>
                           </div>

                           <hr className="border-slate-700 my-6" />
                        </div>
                     ))}
                     <div className="flex justify-center">
                        <button
                           className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors duration-200"
                           onClick={() =>
                              handleAddField("experience", {
                                 title: "",
                                 startDate: "",
                                 endDate: "",
                                 employer: "",
                                 location: "",
                                 responsibilityType: "skillBased",
                                 customResponsibilities: [],
                              })
                           }
                        >
                           Add Experience
                        </button>
                     </div>
                  </div>

                  {/* Education Section */}
                  <div className="p-5 border border-slate-700/50 rounded-xl bg-slate-800/30 shadow-lg">
                     <h4 className="text-xl font-bold text-white mb-4">
                        Education
                     </h4>
                     {userDetails.education.map((edu, index) => (
                        <div key={index} className="space-y-3 mb-4">
                           <div className="grid grid-cols-3 gap-3">
                              <input
                                 type="text"
                                 placeholder="Degree"
                                 value={edu.degree}
                                 onChange={(e) =>
                                    handleChange("education", [
                                       ...userDetails.education.slice(0, index),
                                       { ...edu, degree: e.target.value },
                                       ...userDetails.education.slice(
                                          index + 1
                                       ),
                                    ])
                                 }
                                 className="px-4 py-2.5 text-sm text-slate-900 bg-white/90 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                              />
                              <input
                                 type="text"
                                 placeholder="Institution"
                                 value={edu.institution}
                                 onChange={(e) =>
                                    handleChange("education", [
                                       ...userDetails.education.slice(0, index),
                                       { ...edu, institution: e.target.value },
                                       ...userDetails.education.slice(
                                          index + 1
                                       ),
                                    ])
                                 }
                                 className="px-4 py-2.5 text-sm text-slate-900 bg-white/90 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                              />
                              <input
                                 type="text"
                                 placeholder="Year"
                                 value={edu.year}
                                 onChange={(e) =>
                                    handleChange("education", [
                                       ...userDetails.education.slice(0, index),
                                       { ...edu, year: e.target.value },
                                       ...userDetails.education.slice(
                                          index + 1
                                       ),
                                    ])
                                 }
                                 className="px-4 py-2.5 text-sm text-slate-900 bg-white/90 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                              />
                           </div>
                           <button
                              className="px-3 py-1.5 text-sm font-medium bg-rose-600 text-white rounded-lg hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-colors duration-200"
                              onClick={() =>
                                 handleRemoveField("education", index)
                              }
                           >
                              Remove
                           </button>
                        </div>
                     ))}
                     <div className="flex justify-center">
                        <button
                           className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors duration-200"
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

                  {/* Certifications Section */}
                  <div className="p-5 border border-slate-700/50 rounded-xl bg-slate-800/30 shadow-lg">
                     <h4 className="text-xl font-bold text-white mb-4">
                        Certifications
                     </h4>
                     {userDetails.certifications.map((cert, index) => (
                        <div
                           key={index}
                           className="flex items-center gap-3 mb-3"
                        >
                           <input
                              type="text"
                              placeholder="Certification"
                              value={cert}
                              onChange={(e) =>
                                 handleChange("certifications", [
                                    ...userDetails.certifications.slice(
                                       0,
                                       index
                                    ),
                                    e.target.value,
                                    ...userDetails.certifications.slice(
                                       index + 1
                                    ),
                                 ])
                              }
                              className="flex-1 px-4 py-2.5 text-sm text-slate-900 bg-white/90 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                           />
                           <button
                              className="px-3 py-1.5 text-sm font-medium bg-rose-600 text-white rounded-lg hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-colors duration-200 whitespace-nowrap"
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
                           className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors duration-200"
                           onClick={() => handleAddField("certifications", "")}
                        >
                           Add Certification
                        </button>
                     </div>
                  </div>

                  {/* Projects Section */}
                  <div className="p-5 border border-slate-700/50 rounded-xl bg-slate-800/30 shadow-lg">
                     <h4 className="text-xl font-bold text-white mb-4">
                        Projects
                     </h4>
                     {userDetails.projects.map((proj, index) => (
                        <div key={index} className="space-y-3 mb-6 last:mb-0">
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
                              className="w-full px-4 py-2.5 text-sm text-slate-900 bg-white/90 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                              className="w-full px-4 py-2.5 text-sm text-slate-900 bg-white/90 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 min-h-[100px] resize-y"
                           />
                           <button
                              className="px-3 py-1.5 text-sm font-medium bg-rose-600 text-white rounded-lg hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-colors duration-200"
                              onClick={() =>
                                 handleRemoveField("projects", index)
                              }
                           >
                              Remove
                           </button>
                        </div>
                     ))}
                     <div className="flex justify-center">
                        <button
                           className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors duration-200"
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

               {/* Save and Cancel Buttons */}
               <div className="mt-6 flex justify-center gap-4">
                  <button
                     onClick={handleSave}
                     className="px-6 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                  >
                     Save Details
                  </button>
                  {hasUserDetailsData(userDetails) && (
                     <button
                        onClick={onCancel}
                        className="px-6 py-2.5 text-sm font-medium bg-rose-600 text-white rounded-lg hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-colors duration-200"
                     >
                        Cancel
                     </button>
                  )}
               </div>
            </div>
         )}
      </div>
   );
};

export default UserDetailsForm;
