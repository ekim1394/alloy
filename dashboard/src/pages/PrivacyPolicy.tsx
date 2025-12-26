import { Link } from 'react-router-dom'
import privacyContent from '../assets/privacy.md?raw'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-base-100 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl mb-8">
        <Link to="/" className="btn btn-ghost gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Back to Home
        </Link>
      </div>
      
      <div className="w-full max-w-4xl bg-base-100 rounded-lg p-6 md:p-10 border border-base-200 shadow-sm">
        <pre 
          style={{ wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}
          className="font-mono text-sm leading-relaxed"
        >
          {privacyContent}
        </pre>
      </div>
    </div>
  )
}
