import { Link } from 'react-router-dom'
import { useState } from 'react'

// Helper to get correct URL for app links
function getAppUrl(path: string) {
  const hostname = window.location.hostname
  if (hostname === 'alloy-ci.dev' || hostname === 'www.alloy-ci.dev') {
    return `https://app.alloy-ci.dev${path}`
  }
  return path
}

function Landing() {
  const [activeTab, setActiveTab] = useState<'curl' | 'python'>('python')

  return (
    <div className="min-h-screen bg-base-100 flex flex-col font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#0d1117]/80 backdrop-blur-md border-b border-white/10 py-4">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-12">
            <Link to="/" className="text-xl font-bold text-white no-underline flex items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="text-xl">⚡</span> Alloy CI
            </Link>
            <div className="flex gap-8">
              <a href="#api" className="text-gray-400 hover:text-white transition-colors text-sm font-medium no-underline">API</a>
              <a href="#pricing" className="text-gray-400 hover:text-white transition-colors text-sm font-medium no-underline">Pricing</a>
              <a href="https://github.com/ekim1394/alloy" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors text-sm font-medium no-underline">Docs</a>
            </div>
          </div>
          <div className="flex-none gap-4">
            <a href={getAppUrl('/login')} className="btn btn-ghost btn-sm text-white hover:bg-white/10">Sign In</a>
            <a href={getAppUrl('/signup')} className="btn btn-primary btn-sm">Get Started</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="hero min-h-[70vh] bg-base-100">
        <div className="hero-content text-center">
          <div className="max-w-4xl">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
              <span className="text-success">Reclaim Developer Time</span>
            </h1>
            <p className="text-xl md:text-2xl text-base-content/80 mb-12 max-w-3xl mx-auto">
              The self-hosted iOS CI runner for Apple Silicon. 50% faster builds, 90% lower costs, and complete privacy.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href={getAppUrl('/signup')} className="btn btn-primary btn-lg">
                Get Started
              </a>
              <a href="https://github.com/ekim1394/alloy" className="btn btn-outline btn-lg" target="_blank" rel="noopener noreferrer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-1">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                Star on GitHub
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* AI-Ready API Section */}
      <section className="py-32 bg-gradient-to-b from-[#161b22] to-[#0d1117] border-y border-white/10" id="api">
        <div className="max-w-7xl mx-auto px-8 flex flex-col lg:flex-row items-center gap-24">
          <div className="flex-1 min-w-0">
            <div className="inline-block text-xs font-bold uppercase tracking-widest text-[#a371f7] bg-[#a371f7]/10 px-3 py-1 rounded-full border border-[#a371f7]/20 mb-6">Built for AI Agents</div>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-br from-white to-[#a371f7] bg-clip-text text-transparent">Programmatic Control</h2>
            <p className="text-lg text-gray-400 leading-relaxed mb-10">
              Full REST API access to trigger builds, manage VMs, and stream logs. Perfect for building custom workflows or integrating with AI agents.
            </p>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 font-medium text-gray-200">
                <span className="w-1.5 h-1.5 rounded-full bg-[#a371f7] shadow-[0_0_8px_#a371f7]"></span>
                RESTful Endpoints
              </div>
              <div className="flex items-center gap-3 font-medium text-gray-200">
                <span className="w-1.5 h-1.5 rounded-full bg-[#a371f7] shadow-[0_0_8px_#a371f7]"></span>
                Websocket Log Streaming
              </div>
              <div className="flex items-center gap-3 font-medium text-gray-200">
                <span className="w-1.5 h-1.5 rounded-full bg-[#a371f7] shadow-[0_0_8px_#a371f7]"></span>
                Token-based Auth
              </div>
            </div>
          </div>
          <div className="flex-1 bg-[#0d1117] border border-white/10 rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden min-w-[450px]">
            <div className="flex items-center justify-between px-4 h-12 bg-[#161b22] border-b border-white/10">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-white/20"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-white/20"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-white/20"></span>
              </div>
              <div className="flex h-full">
                <button
                  className={`px-5 text-sm font-medium cursor-pointer h-full border-b-2 transition-colors ${activeTab === 'python' ? 'text-[#a371f7] border-[#a371f7]' : 'text-gray-400 border-transparent hover:text-white'}`}
                  onClick={() => setActiveTab('python')}
                >
                  Python
                </button>
                <button
                  className={`px-5 text-sm font-medium cursor-pointer h-full border-b-2 transition-colors ${activeTab === 'curl' ? 'text-[#a371f7] border-[#a371f7]' : 'text-gray-400 border-transparent hover:text-white'}`}
                  onClick={() => setActiveTab('curl')}
                >
                  cURL
                </button>
              </div>
              <div className="w-12"></div> {/* Spacer for alignment */}
            </div>
            <div className="p-6 font-mono text-sm leading-relaxed overflow-x-auto bg-[#0d1117]">
              {activeTab === 'python' ? (
                <pre className="m-0"><code>
<span className="text-[#ff7b72]">import</span> requests

<span className="text-[#8b949e] italic"># Trigger a build from an AI agent</span>
response = requests.post(
    <span className="text-[#a5d6ff]">"https://api.alloy-ci.dev/v1/jobs"</span>,
    headers=<span className="text-[#79c0ff]">{'{'}</span><span className="text-[#a5d6ff]">"Authorization"</span>: <span className="text-[#a5d6ff]">f"Bearer <span className="text-[#d2a8ff]">{'{api_key}'}</span>"</span><span className="text-[#79c0ff]">{'}'}</span>,
    json=<span className="text-[#79c0ff]">{'{'}</span><span className="text-[#a5d6ff]">"repo"</span>: <span className="text-[#a5d6ff]">"my-ios-app"</span>, <span className="text-[#a5d6ff]">"branch"</span>: <span className="text-[#a5d6ff]">"main"</span><span className="text-[#79c0ff]">{'}'}</span>
)

print(<span className="text-[#a5d6ff]">f"Build started: <span className="text-[#d2a8ff]">{'{response.json()[\'id\']}'}</span>"</span>)
</code></pre>
              ) : (
                <pre className="m-0"><code>
<span className="text-[#8b949e] italic"># Trigger a build via cURL</span>
curl -X POST https://api.alloy-ci.dev/v1/jobs \
  -H <span className="text-[#a5d6ff]">"Authorization: Bearer $ALLOY_API_KEY"</span> \
  -d <span className="text-[#a5d6ff]">'{"{\"repo\": \"my-ios-app\", \"branch\": \"main\"}"}'</span>
</code></pre>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-24 px-8 max-w-5xl mx-auto text-center" id="pricing">
        <h2 className="text-4xl lg:text-5xl font-extrabold mb-4 tracking-tight">Why switch to Alloy CI?</h2>
        <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">Stop paying the "GitHub Tax" for slow cloud runners.</p>
        <div className="mt-12 bg-[#161b22] border border-white/10 rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-6 bg-[#0d1117] font-bold text-gray-400 text-left border-b border-white/10">Feature</th>
                <th className="p-6 bg-[#58a6ff]/5 font-bold text-left border-b border-white/10">Alloy CI (Self-Hosted)</th>
                <th className="p-6 bg-[#0d1117] font-bold text-gray-400 text-left border-b border-white/10">GitHub Actions</th>
                <th className="p-6 bg-[#0d1117] font-bold text-gray-400 text-left border-b border-white/10">CircleCI</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/10 last:border-0 hover:bg-[#1c2229] transition-colors">
                <td className="p-6 text-left text-gray-300">Boot Time</td>
                <td className="p-6 bg-[#58a6ff]/5 font-bold text-[#3fb950] text-left">~1s (Instant)</td>
                <td className="p-6 text-gray-400 text-left">60s+</td>
                <td className="p-6 text-gray-400 text-left">60s+</td>
              </tr>
              <tr className="border-b border-white/10 last:border-0 hover:bg-[#1c2229] transition-colors">
                <td className="p-6 text-left text-gray-300">Cost</td>
                <td className="p-6 bg-[#58a6ff]/5 font-bold text-[#3fb950] text-left">$0 / min</td>
                <td className="p-6 text-[#d29922] font-semibold text-left">$0.08+ / min</td>
                <td className="p-6 text-[#d29922] font-semibold text-left">Expensive Tiers</td>
              </tr>
              <tr className="border-b border-white/10 last:border-0 hover:bg-[#1c2229] transition-colors">
                <td className="p-6 text-left text-gray-300">Privacy</td>
                <td className="p-6 bg-[#58a6ff]/5 font-bold text-[#3fb950] text-left">Local / VPN</td>
                <td className="p-6 text-gray-400 text-left">Third-party Cloud</td>
                <td className="p-6 text-gray-400 text-left">Third-party Cloud</td>
              </tr>
              <tr className="last:border-0 hover:bg-[#1c2229] transition-colors">
                <td className="p-6 text-left text-gray-300">Data Control</td>
                <td className="p-6 bg-[#58a6ff]/5 text-left">
                  <span className="inline-block bg-[#3fb950]/15 text-[#3fb950] px-3 py-1 rounded-full text-sm font-semibold">100% Yours</span>
                </td>
                <td className="p-6 text-gray-400 text-left">Shared Infra</td>
                <td className="p-6 text-gray-400 text-left">Shared Infra</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-8 text-center bg-gradient-to-b from-[#0d1117] to-[#388bfd]/10">
        <h2 className="text-4xl lg:text-5xl font-extrabold mb-4 tracking-tight">Ready to reclaim your build time?</h2>
        <p className="text-xl text-gray-400 mb-12">Join hundreds of mobile teams shipping faster with Alloy CI and Tart.</p>
        <div className="flex flex-wrap justify-center gap-4">
          <a href={getAppUrl('/signup')} className="btn btn-primary btn-lg px-8 text-lg font-bold">
            Get Started
          </a>
          <a href="https://github.com/ekim1394/alloy" className="btn btn-outline btn-lg px-8 text-lg font-bold hover:bg-white hover:text-black gap-2" target="_blank" rel="noopener noreferrer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            Star on GitHub
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10 bg-[#0d1117]">
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
          <div className="flex flex-col gap-2">
            <span className="font-bold text-lg text-white">⚡ Alloy CI</span>
            <span className="text-sm text-gray-400">© 2024 Alloy CI. Open Source.</span>
          </div>
          <div className="flex gap-8">
            <a href="https://github.com/ekim1394/alloy/tree/main/docs" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#58a6ff] transition-colors text-sm">Docs</a>
            <a href="https://github.com/ekim1394/alloy" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#58a6ff] transition-colors text-sm">GitHub</a>
            <Link to="/terms" className="text-gray-400 hover:text-[#58a6ff] transition-colors text-sm">Terms</Link>
            <Link to="/privacy" className="text-gray-400 hover:text-[#58a6ff] transition-colors text-sm">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
