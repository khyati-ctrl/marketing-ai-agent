import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-3xl space-y-8">
        <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight">
          Your Enterprise <span className="text-blue-600">Marketing AI Agent</span>
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed">
          Automate your content pipeline, analyze campaign insights, and scale your marketing efforts with a multi-agent AI workspace.
        </p>
        <div className="flex items-center justify-center gap-4 pt-4">
          <Link 
            href="/dashboard" 
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
<Link 
  href="/auth" 
  className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
>
  Log In
</Link>