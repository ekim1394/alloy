import { Link } from 'react-router-dom';
import { useState } from 'react';
import GithubIcon from '../components/GithubIcon';

// Helper to get correct URL for app links
function getAppUrl(path: string) {
  const hostname = window.location.hostname;
  if (hostname === 'alloy-ci.dev' || hostname === 'www.alloy-ci.dev') {
    return `https://app.alloy-ci.dev${path}`;
  }
  return path;
}

function Landing() {
  const [activeTab, setActiveTab] = useState<'git' | 'local'>('git');

  return (
    <div className="min-h-screen bg-base-100 flex flex-col font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#0d1117]/80 backdrop-blur-md border-b border-white/10 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link
              to="/"
              className="text-lg sm:text-xl font-bold text-white no-underline flex items-center gap-2 hover:opacity-80 transition-opacity"
            ></Link>
            <a
              href="https://github.com/ekim1394/alloy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <GithubIcon />
            </a>
          </div>
          <div className="flex gap-2 sm:gap-4">
            <a href={getAppUrl('/signup')} className="btn btn-primary btn-sm">
              Sign up
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="hero min-h-[70vh] bg-base-100">
        <div className="hero-content text-center">
          <div className="max-w-4xl">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
              <span className="text-success">Agentic CI</span>
            </h1>
            <p className="text-xl md:text-2xl text-base-content/80 mb-12 max-w-3xl mx-auto">
              The self-hosted iOS CI runner built for autonomous agentic workflows
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href={getAppUrl('/signup')} className="btn btn-primary btn-lg">
                Get Started
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* AI-Ready API Section */}
      <section
        className="py-32 bg-gradient-to-b from-[#161b22] to-[#0d1117] border-y border-white/10"
        id="api"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
          <div className="flex-1 min-w-0 text-center lg:text-left">
            <div className="inline-block text-xs font-bold uppercase tracking-widest text-[#a371f7] bg-[#a371f7]/10 px-3 py-1 rounded-full border border-[#a371f7]/20 mb-6">
              Built for AI Agents
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 pb-2 bg-gradient-to-br from-white to-[#a371f7] bg-clip-text text-transparent">
              Programmatic Control
            </h2>
            <p className="text-lg text-gray-400 leading-relaxed mb-10">
              Full REST API access to trigger builds, manage VMs, and stream logs. Perfect for
              building custom workflows or integrating with AI agents.
            </p>
            <div className="flex flex-col gap-4 items-center lg:items-start">
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
          <div className="flex-1 w-full bg-[#0d1117] border border-white/10 rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="flex items-center justify-between px-4 h-12 bg-[#161b22] border-b border-white/10">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-white/20"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-white/20"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-white/20"></span>
              </div>
              <div className="flex h-full">
                <button
                  className={`px-5 text-sm font-medium cursor-pointer h-full border-b-2 transition-colors ${activeTab === 'git' ? 'text-[#a371f7] border-[#a371f7]' : 'text-gray-400 border-transparent hover:text-white'}`}
                  onClick={() => setActiveTab('git')}
                >
                  Git Repo
                </button>
                <button
                  className={`px-5 text-sm font-medium cursor-pointer h-full border-b-2 transition-colors ${activeTab === 'local' ? 'text-[#a371f7] border-[#a371f7]' : 'text-gray-400 border-transparent hover:text-white'}`}
                  onClick={() => setActiveTab('local')}
                >
                  Local
                </button>
              </div>
              <div className="w-12"></div> {/* Spacer for alignment */}
            </div>
            <div className="p-6 font-mono text-sm leading-relaxed overflow-x-auto bg-[#0d1117]">
              {activeTab === 'git' ? (
                <pre className="m-0">
                  <code>
                    <span className="text-[#8b949e] italic"># Build from a GitHub repo</span>
                    {`
`}
                    <span className="text-[#79c0ff]">$</span> alloy run{' '}
                    <span className="text-[#a5d6ff]">"xcodebuild -scheme MyApp build"</span> \
                    --repo https://github.com/my-org/my-ios-app
                    {`
`}
                    <span className="text-[#a5d6ff]">→ Cloning repository...</span>
                    <span className="text-[#a5d6ff]">→ Running on macOS Tahoe</span>
                    <span className="text-[#a5d6ff]">→ Job started: </span>
                    <span className="text-[#d2a8ff]">abc123</span>
                  </code>
                </pre>
              ) : (
                <pre className="m-0">
                  <code>
                    <span className="text-[#8b949e] italic">
                      # Run tests from current directory
                    </span>
                    {`
`}
                    <span className="text-[#79c0ff]">$</span> alloy run{' '}
                    <span className="text-[#a5d6ff]">"xcodebuild test -scheme MyApp"</span>
                    {`
`}
                    <span className="text-[#a5d6ff]">→ Archiving project...</span>
                    <span className="text-[#a5d6ff]">→ Uploading to server</span>
                    <span className="text-[#a5d6ff]">→ Running on macOS Tahoe</span>
                    <span className="text-[#a5d6ff]">→ Streaming logs...</span>
                  </code>
                </pre>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32 px-4 sm:px-8 text-center bg-gradient-to-b from-[#0d1117] to-[#388bfd]/10">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 tracking-tight">
          Ready to reclaim your build time?
        </h2>
        <div className="flex flex-wrap justify-center gap-4">
          <a href={getAppUrl('/signup')} className="btn btn-primary btn-lg px-8 text-lg font-bold">
            Sign up now!
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-4 border-t border-white/10 bg-[#0d1117]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex flex-col gap-2 text-center sm:text-left">
            <span className="text-sm text-gray-400">© 2025 Alloy CI. All rights reserved.</span>
          </div>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
            <a
              href="https://github.com/ekim1394/alloy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-[#58a6ff] transition-colors text-sm"
            >
              GitHub
            </a>
            <Link
              to="/terms"
              className="text-gray-400 hover:text-[#58a6ff] transition-colors text-sm"
            >
              Terms
            </Link>
            <Link
              to="/privacy"
              className="text-gray-400 hover:text-[#58a6ff] transition-colors text-sm"
            >
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
