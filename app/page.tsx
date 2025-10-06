export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">VoiceCare</h1>
        <p className="text-xl text-gray-600 mb-8">Simplified Voice Translation</p>
        <a 
          href="/simple-chat" 
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Start Voice Chat
        </a>
      </div>
    </div>
  )
}
