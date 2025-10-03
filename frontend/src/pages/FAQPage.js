import React from "react";
import FAQ from "../components/FAQ";

const FAQPage = () => {
  return (
    <div className="bg-[#517b9d] min-h-screen flex flex-col items-center p-6 font-sans">
      <h1 className="text-white font-bold text-3xl mb-6">Frequently Asked Questions</h1>
      <FAQ />
    </div>
  );
};

export default FAQPage;