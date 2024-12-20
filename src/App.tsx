import { useEffect, useState } from "react";
// import nlp from "compromise";

function App() {
   const [selectedText, setSelectedText] = useState<string>("");
   // const [skills, setSkills] = useState<string[]>([]);
   // const [experience, setExperience] = useState<
   //    { skill: string; years: string }[]
   // >([]);

   useEffect(() => {
      chrome.storage.local.get(["selectedText"], (result) => {
         if (result.selectedText) {
            const text = result.selectedText;
            setSelectedText(text);

            // Analyze text
            // const extractedSkills = extractSkills(text);
            // const extractedExperience = extractExperience(text);

            // setSkills(extractedSkills);
            // setExperience(extractedExperience);

            // Clear the storage after retrieving
            // chrome.storage.local.remove("selectedText");
         }
      });
   }, []);

   // Skill extraction using Compromise.js
   // function extractSkills(text: string): string[] {
   //    const doc = nlp(text);
   //    return doc.match("#Noun").toLowerCase().unique().out("array");
   // }

   // Experience extraction using Compromise.js
   // function extractExperience(
   //    text: string
   // ): { skill: string; years: string }[] {
   //    const doc = nlp(text);
   //    const experiencePhrases = doc
   //       .match("/[0-9]+[+]? (years|yrs) of experience in [#Noun|#NounPhrase]/")
   //       .out("array");

   //    return experiencePhrases
   //       .map((phrase: string) => {
   //          const match = phrase.match(
   //             /([0-9]+[+]?) (years|yrs) of experience in ([^,.\n]+)/
   //          );
   //          return match ? { skill: match[3].trim(), years: match[1] } : null;
   //       })
   //       .filter(
   //          (result: any): result is { skill: string; years: string } =>
   //             result !== null
   //       );
   // }

   return (
      <div className="p-4 min-w-[300px] min-h-[300px]">
         <h1 className="text-xl font-bold mb-4">Job Description Analyzer</h1>
         <div className="p-2 border rounded bg-gray-50 mb-4">
            <h2 className="text-lg font-semibold">Selected Text</h2>
            <p>{selectedText || "No text selected"}</p>
         </div>
         {/* <div className="p-2 border rounded bg-gray-50 mb-4">
            <h2 className="text-lg font-semibold">Skills</h2>
            <ul>
               {skills.length ? (
                  skills.map((skill, index) => <li key={index}>{skill}</li>)
               ) : (
                  <li>No skills detected</li>
               )}
            </ul>
         </div> */}
         {/* <div className="p-2 border rounded bg-gray-50">
            <h2 className="text-lg font-semibold">Experience</h2>
            <ul>
               {experience.length ? (
                  experience.map((exp, index) => (
                     <li key={index}>
                        {exp.years} years in {exp.skill}
                     </li>
                  ))
               ) : (
                  <li>No experience phrases detected</li>
               )}
            </ul>
         </div> */}
      </div>
   );
}

export default App;
