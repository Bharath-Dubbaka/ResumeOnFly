import { Trash2, PlusCircle, Save, X } from "lucide-react";
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
      <div className="max-w-7xl mx-auto">
         {loading ? (
            <LoadingSpinner />
         ) : (
            <div className="p-10 bg-gradient-to-br from-slate-900/90 to-slate-800/90 rounded-3xl text-slate-100 backdrop-blur-xl shadow-2xl border border-slate-700/30">
               {/* Personal Details */}
               <div className="mb-10 p-8 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 shadow-xl border border-slate-600/20 hover:border-slate-500/30 transition-all duration-300">
                  <div className="flex items-center mb-8">
                     <h3 className="text-3xl font-bold bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                        Personal Details:
                     </h3>
                     <span className="ml-4 px-3 py-1 text-xs font-medium text-rose-300/90 bg-rose-500/10 rounded-full border border-rose-500/20">
                        Can be updated later
                     </span>
                  </div>
                  <div className="flex justify-between gap-8">
                     <div className="w-1/3 group">
                        <label className="block text-sm font-medium text-slate-400 mb-2 ml-1 group-hover:text-blue-400 transition-colors duration-200">
                           Full Name
                        </label>
                        <input
                           type="text"
                           placeholder="Enter your full name"
                           value={userDetails.fullName}
                           onChange={(e) =>
                              handleChange("fullName", e.target.value)
                           }
                           className="w-full px-4 py-3 text-sm text-slate-900 bg-white/95 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 border-2 border-transparent hover:border-blue-500/30 transition-all duration-200 shadow-sm"
                        />
                     </div>
                     <div className="w-1/3 group">
                        <label className="block text-sm font-medium text-slate-400 mb-2 ml-1 group-hover:text-blue-400 transition-colors duration-200">
                           Email Address
                        </label>
                        <input
                           type="email"
                           placeholder="Enter your email"
                           value={userDetails.email}
                           onChange={(e) =>
                              handleChange("email", e.target.value)
                           }
                           className="w-full px-4 py-3 text-sm text-slate-900 bg-white/95 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 border-2 border-transparent hover:border-blue-500/30 transition-all duration-200 shadow-sm"
                        />
                     </div>
                     <div className="w-1/3 group">
                        <label className="block text-sm font-medium text-slate-400 mb-2 ml-1 group-hover:text-blue-400 transition-colors duration-200">
                           Phone Number
                        </label>
                        <input
                           type="text"
                           placeholder="Enter your phone number"
                           value={userDetails.phone}
                           onChange={(e) =>
                              handleChange("phone", e.target.value)
                           }
                           className="w-full px-4 py-3 text-sm text-slate-900 bg-white/95 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 border-2 border-transparent hover:border-blue-500/30 transition-all duration-200 shadow-sm"
                        />
                     </div>
                  </div>
               </div>

               <div className="space-y-10">
                  {/* Experience Section */}
                  <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 shadow-xl border border-slate-600/20 hover:border-slate-500/30 transition-all duration-300">
                     <div className="flex items-center justify-between mb-8">
                        <h4 className="text-3xl font-bold bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                           Work Experience:
                        </h4>
                        <button
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
                           className="px-6 py-2.5 text-sm font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-200 shadow-lg flex items-center gap-2"
                        >
                           <PlusCircle size={18} />
                           Add Experience
                        </button>
                     </div>
                     {userDetails.experience.map((exp, index) => (
                        <div key={index} className="mb-6 last:mb-0">
                           <div className="inline-block px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg mb-6">
                              Experience {index + 1}
                           </div>
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
                                          className="px-2 py-2 text-sm font-medium bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg hover:from-rose-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-colors duration-200 flex items-center"
                                       >
                                          <Trash2 size={16} className="mr-1" />
                                          Remove
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
                                 className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-lg hover:from-purple-600 hover:to-violet-600 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-colors duration-200 flex items-center"
                              >
                                 Add Responsibility
                              </button>
                           </div>
                           {/* REMOVE EXPERIENCE BTN */}
                           <div className="flex flex-col items-center">
                              <button
                                 className="px-4 py-2 mt-4 text-sm font-medium bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg hover:from-rose-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-colors duration-200 flex items-center"
                                 onClick={() =>
                                    handleRemoveField("experience", index)
                                 }
                              >
                                 <Trash2 size={16} className="mr-1" />
                                 Remove Experience
                              </button>
                           </div>

                           <hr className="border-slate-700 my-6" />
                        </div>
                     ))}
                  </div>

                  {/* Education Section */}
                  <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 shadow-xl border border-slate-600/20 hover:border-slate-500/30 transition-all duration-300">
                     <div className="flex items-center justify-between mb-8">
                        <h4 className="text-3xl font-bold bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                           Education:
                        </h4>
                        <button
                           onClick={() =>
                              handleAddField("education", {
                                 degree: "",
                                 institution: "",
                                 year: "",
                              })
                           }
                           className="px-6 py-2.5 text-sm font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-200 shadow-lg flex items-center gap-2"
                        >
                           <PlusCircle size={18} />
                           Add Education
                        </button>
                     </div>
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
                              className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg hover:from-rose-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-colors duration-200 flex items-center"
                              onClick={() =>
                                 handleRemoveField("education", index)
                              }
                           >
                              <Trash2 size={16} className="mr-1" />
                              Remove
                           </button>
                        </div>
                     ))}
                  </div>

                  {/* Certifications Section */}
                  <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 shadow-xl border border-slate-600/20 hover:border-slate-500/30 transition-all duration-300">
                     <div className="flex items-center justify-between mb-8">
                        <h4 className="text-3xl font-bold bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                           Certifications:
                        </h4>
                        <button
                           onClick={() => handleAddField("certifications", "")}
                           className="px-6 py-2.5 text-sm font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-200 shadow-lg flex items-center gap-2"
                        >
                           <PlusCircle size={18} />
                           Add Certification
                        </button>
                     </div>
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
                              className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg hover:from-rose-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-colors duration-200 flex items-center"
                              onClick={() =>
                                 handleRemoveField("certifications", index)
                              }
                           >
                              Remove
                           </button>
                        </div>
                     ))}
                  </div>

                  {/* Projects Section */}
                  <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 shadow-xl border border-slate-600/20 hover:border-slate-500/30 transition-all duration-300">
                     <div className="flex items-center justify-between mb-8">
                        <h4 className="text-3xl font-bold bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                           Projects:
                        </h4>
                        <button
                           onClick={() =>
                              handleAddField("projects", {
                                 name: "",
                                 description: "",
                              })
                           }
                           className="px-6 py-2.5 text-sm font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-200 shadow-lg flex items-center gap-2"
                        >
                           <PlusCircle size={18} />
                           Add Project
                        </button>
                     </div>
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
                              className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg hover:from-rose-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-colors duration-200 flex items-center"
                              onClick={() =>
                                 handleRemoveField("projects", index)
                              }
                           >
                              Remove
                           </button>
                        </div>
                     ))}
                  </div>
               </div>

               {/* Save and Cancel Buttons */}
               <div className="mt-8 flex justify-center gap-4">
                  <button
                     onClick={handleSave}
                     className="flex items-center gap-2 px-8 py-3 text-sm font-medium bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 shadow-lg"
                  >
                     <Save size={18} />
                     Save Details
                  </button>
                  {hasUserDetailsData(userDetails) && (
                     <button
                        onClick={onCancel}
                        className="flex items-center gap-2 px-8 py-3 text-sm font-medium bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg hover:from-rose-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all duration-200 shadow-lg"
                     >
                        <X size={18} />
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
