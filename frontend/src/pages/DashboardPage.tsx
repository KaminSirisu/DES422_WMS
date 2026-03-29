import React from 'react';

const DashboardPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Welcome to Your Dashboard!</h1>
      <p className="text-gray-600">This is your main application area. You can add widgets, data summaries, and navigation here.</p>
      {/* You can add more content here later, like a summary of inventory, recent activities, etc. */}
    </div>
  );
};

export default DashboardPage;