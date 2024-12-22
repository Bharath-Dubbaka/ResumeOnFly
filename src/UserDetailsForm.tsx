import { useState } from "react";

interface UserDetails {
   fullName: string;
   email: string;
   phone: string;
   experience: { title: string; startDate: string; endDate: string }[];
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
            {/* Add similar inputs for experience, education, certifications, etc. */}
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
