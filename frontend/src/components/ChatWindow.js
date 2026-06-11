import ReactMarkdown from "react-markdown";

export default function ChatWindow({ 
  activeId, 
  messages, 
  message, 
  setMessage, 
  isLoading, 
  onSend 
}) {
  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      
      {/* Top Header */}
      <div className="border-b px-8 py-4 flex justify-between items-center bg-white shadow-sm z-10">
        <h2 className="text-lg font-bold text-gray-800">Marketing AI Supervisor</h2>
        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-md text-sm font-medium">
          {activeId ? `Campaign #${activeId}` : "New Campaign"}
        </span>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-20">
            Start by describing your marketing goals below.
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-3xl rounded-2xl px-6 py-4 text-sm ${
                msg.role === "user" 
                  ? "bg-blue-600 text-white rounded-br-none" 
                  : "bg-gray-50 text-gray-800 border border-gray-200 rounded-bl-none shadow-sm"
              }`}>
                {msg.role === "ai" ? (
                  <ReactMarkdown 
                    components={{
                      a: ({node, ...props}) => <a {...props} className="text-blue-600 underline font-semibold hover:text-blue-800" target="_blank" rel="noopener noreferrer" />,
                      strong: ({node, ...props}) => <strong {...props} className="font-bold text-gray-900" />,
                      ul: ({node, ...props}) => <ul {...props} className="list-disc ml-5 mb-2 space-y-1" />,
                      ol: ({node, ...props}) => <ol {...props} className="list-decimal ml-5 mb-2 space-y-1" />,
                      p: ({node, ...props}) => <p {...props} className="mb-3 last:mb-0 leading-relaxed" />
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))
        )}
        
        {/* Loading Animation */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-50 text-gray-500 border border-gray-200 rounded-2xl rounded-bl-none px-6 py-4 text-sm flex items-center space-x-2 shadow-sm">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="p-6 bg-white border-t">
        <form 
          onSubmit={onSend} 
          className="flex items-center space-x-4 max-w-4xl mx-auto bg-white"
        >
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe your new campaign..."
            disabled={isLoading}
            className="flex-1 text-gray-900 placeholder-gray-500 border border-blue-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
          />
          <button
            type="submit"
            disabled={!message.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-8 rounded-xl transition-colors shadow-sm"
          >
            {isLoading ? "Sending..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}