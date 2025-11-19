import React from "react";

export default function FAQ() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-8 font-sans">
      {/* Title */}
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Frequently Asked Questions</h1>
      <p className="text-gray-600 mb-8 text-center max-w-xl">
        Find answers to common questions about our global disaster tracking platform
      </p>

      <div className="max-w-3xl w-full space-y-6">
        {/* FAQ Item */}
        <div>
          <h2 className="font-semibold text-lg text-gray-800">
            How does the platform work?
          </h2>
          <p className="text-gray-600 mt-1">
            Our advanced algorithms analyze social media tweets in real-time to identify
            and map potential disasters. We use machine learning to filter and
            prioritize critical emergency information.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-lg text-gray-800">
            Is the information accurate?
          </h2>
          <p className="text-gray-600 mt-1">
            We continuously refine our algorithms and cross-reference multiple sources to
            ensure the highest possible accuracy in disaster tracking and reporting.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-lg text-gray-800">
            What types of disasters are tracked?
          </h2>
          <p className="text-gray-600 mt-1">
            We track a wide range of emergencies including natural disasters,
            severe weather events, and other critical global
            incidents.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-lg text-gray-800">
            How often is the data updated?
          </h2>
          <p className="text-gray-600 mt-1">
            Our platform provides real-time updates, with new information processed and
            mapped continuously as tweets are received.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-lg text-gray-800">
            Can I customize the heat map?
          </h2>
          <p className="text-gray-600 mt-1">
            Users can filter the heat map by disaster type to get
            personalized emergency tracking insights.
          </p>
        </div>
      </div>

      {/* Contact */}
      <div className="mt-12 text-center">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Need more insight?</h3>
        <p className="text-gray-600 mb-4">
          Explore BlueSky's Documentation for more information
        </p>
        <button className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700">
          Click Here
        </button>
      </div>
    </div>
  );
}
