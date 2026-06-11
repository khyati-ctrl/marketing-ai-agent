export default function Sidebar({ 
  campaigns, 
  activeId, 
  onNewCampaign, 
  onSelectCampaign, 
  onDelete, 
  onLogout 
}) {
  return (
    <div className="w-64 bg-[#111827] text-white flex flex-col">
      <div className="p-6">
        <h1 className="text-xl font-bold tracking-wider mb-6">MARKETING AI</h1>
        <button 
          onClick={onNewCampaign}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center transition-colors"
        >
          <span className="mr-2">+</span> New Campaign
        </button>
      </div>
      
      <div className="px-6 flex-1 overflow-y-auto">
        <p className="text-xs font-semibold text-gray-400 mb-4 tracking-widest uppercase">
          Your Campaigns
        </p>
        <div className="space-y-2">
          {campaigns.length === 0 ? (
            <p className="text-sm text-gray-500">No campaigns yet.</p>
          ) : (
            campaigns.map((camp) => (
              <div 
                key={camp.id} 
                onClick={() => onSelectCampaign(camp)}
                className={`group flex justify-between items-center text-sm cursor-pointer p-2 rounded transition-colors ${
                  activeId === camp.id 
                    ? "bg-blue-600 text-white font-medium" 
                    : "text-gray-300 hover:text-white hover:bg-gray-800"
                }`}
              >
                <span className="truncate pr-2">{camp.name}</span>
                
                <button 
                  onClick={(e) => onDelete(e, camp.id)}
                  className="hidden group-hover:block text-gray-400 hover:text-red-400 font-bold px-1"
                  title="Delete Campaign"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="p-6 border-t border-gray-800 mt-auto">
        <button 
          onClick={onLogout}
          className="w-full text-sm text-gray-400 hover:text-white hover:bg-gray-800 py-2 px-4 rounded transition-colors flex items-center justify-center font-medium"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}