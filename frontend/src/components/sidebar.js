export default function Sidebar({ campaigns, activeCampaign, onSelect, onNew }) {
  return (
    <div className="w-64 bg-gray-900 text-white h-screen flex flex-col flex-shrink-0">
      
      {/* Sidebar Header */}
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-xl font-bold tracking-wider">MARKETING AI</h2>
      </div>

      {/* New Campaign Button */}
      <div className="p-4">
        <button 
          onClick={onNew}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <span>+</span> New Campaign
        </button>
      </div>

      {/* Campaign List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-1">
        <p className="text-xs font-semibold text-gray-500 mb-2 mt-4 uppercase tracking-wider">
          Your Campaigns
        </p>
        
        {campaigns.map((camp) => (
          <button
            key={camp.id}
            onClick={() => onSelect(camp.id)}
            className={`text-left px-3 py-2 rounded-md transition-colors ${
              activeCampaign === camp.id 
                ? 'bg-gray-800 text-blue-400 font-medium border-l-2 border-blue-500' 
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200 border-l-2 border-transparent'
            }`}
          >
            {camp.name}
          </button>
        ))}
      </div>

    </div>
  );
}