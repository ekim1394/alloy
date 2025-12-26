import { Link } from 'react-router-dom'
import { useState } from 'react'

function Landing() {
  const [activeTab, setActiveTab] = useState<'curl' | 'python'>('python')

  return (
    <div className="min-h-screen bg-base-100 flex flex-col font-sans">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="nav-left">
            <Link to="/" className="nav-logo">
              <span className="logo-icon">⚡</span> Alloy CI
            </Link>
            <div className="nav-menu">
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#api">API</a>
              <a href="https://github.com/ekim1394/alloy" target="_blank" rel="noopener noreferrer">Docs</a>
            </div>
          </div>
          <div className="flex-none gap-2">
            <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
            <Link to="/signup" className="btn btn-primary btn-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 md:py-32 relative overflow-hidden bg-gradient-radial from-base-200 to-base-100">
      <div className="container mx-auto px-6 flex flex-col items-center text-center">
        <div className="max-w-4xl">
          <h1 className="hero-headline">
            Eliminate the GitHub Tax. <br />
            <span className="highlight">Reclaim Developer Time.</span>
          </h1>
          <p className="hero-tagline mx-auto">
            The self-hosted iOS CI runner for Apple Silicon. 50% faster builds, 90% lower costs, and complete privacy.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <Link to="/signup" className="btn btn-primary btn-lg">
              Get Started
            </Link>
            <a href="https://github.com/ekim1394/alloy" className="btn btn-outline btn-lg" target="_blank" rel="noopener noreferrer">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-1">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Star on GitHub
            </a>
          </div>
        </div>
      </div>
      </section>

      {/* Visual Demo Section */}
      <section className="demo-section">
        <div className="demo-container">
          <div className="demo-placeholder">
            <div className="demo-content">
              <span className="demo-icon">▶️</span>
              <p>Live Demo Loading...</p>
            </div>
          </div>
          <p className="demo-caption">
            See it in action: From CLI command to a fully running Tart VM in <strong>~1 second</strong>.
          </p>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-16 border-y border-base-content/5 bg-base-200/50">
        <div className="container mx-auto px-6 text-center">
          <p className="text-xs font-bold tracking-[0.2em] text-base-content/50 uppercase mb-8">POWERED BY MODERN INFRASTRUCTURE</p>
          <div className="flex flex-wrap justify-center gap-12 md:gap-20 opacity-70 grayscale hover:grayscale-0 transition-all duration-300">
            <div className="flex items-center gap-3 text-xl font-bold">
              <span className="text-2xl">🐢</span> Tart
            </div>
            <div className="flex items-center gap-3 text-xl font-bold">
              <span className="text-2xl">⚙️</span> GitHub Actions
            </div>
            <div className="flex items-center gap-3 text-xl font-bold">
              <span className="text-2xl">🚀</span> Fastlane
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <h2 className="section-heading">Built for Speed and Security</h2>
        <p className="section-subheading">
          Alloy CI leverages the power of Apple Silicon to deliver the fastest CI experience available today.
        </p>
        <div className="features-grid-new">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card bg-base-100 border border-base-200 hover:border-primary/50 cursor-default transition-all duration-300 hover:shadow-lg group">
              <div className="card-body p-8">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                  ⚡
                </div>
                <h3 className="text-xl font-bold mb-3">Instant Startup</h3>
                <p className="text-base-content/70 leading-relaxed">Boot macOS VMs in under 3 seconds. Utilizing Tart's copy-on-write mechanisms for near-instant VM cloning.</p>
              </div>
            </div>
            <div className="card bg-base-100 border border-base-200 hover:border-primary/50 cursor-default transition-all duration-300 hover:shadow-lg group">
              <div className="card-body p-8">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                  🔒
                </div>
                <h3 className="text-xl font-bold mb-3">Complete Isolation</h3>
                <p className="text-base-content/70 leading-relaxed">Every job runs in a fresh, ephemeral Tart VM. No state leakage between builds, guaranteed.</p>
              </div>
            </div>
            <div className="card bg-base-100 border border-base-200 hover:border-primary/50 cursor-default transition-all duration-300 hover:shadow-lg group">
              <div className="card-body p-8">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                  🖥️
                </div>
                <h3 className="text-xl font-bold mb-3">Apple Silicon Native</h3>
                <p className="text-base-content/70 leading-relaxed">Hardware virtualization for full macOS VMs on Apple Silicon. Optimized for arm64 apps.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Orchestration Section */}
      <section className="py-24 bg-base-200" id="how-it-works">
        <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
             <div className="flex items-center justify-center gap-4 md:gap-8 p-12 bg-base-100 rounded-3xl border border-base-content/5 shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-radial from-primary/5 to-transparent opacity-50"></div>
                
                <div className="flex flex-col items-center gap-3 z-10">
                    <div className="w-24 h-24 rounded-2xl bg-base-100 border border-base-200 shadow-md flex flex-col items-center justify-center gap-2">
                        <span className="text-3xl">💻</span>
                        <span className="text-[10px] font-bold tracking-wider">CLI</span>
                    </div>
                </div>
                <div className="text-2xl text-base-content/20">→</div>
                 <div className="flex flex-col items-center gap-3 z-10">
                    <div className="w-24 h-24 rounded-2xl bg-base-100 border border-base-200 shadow-md flex flex-col items-center justify-center gap-2">
                        <span className="text-3xl">🔄</span>
                        <span className="text-[10px] font-bold tracking-wider">RUNNER</span>
                    </div>
                </div>
                <div className="text-2xl text-base-content/20">→</div>
                 <div className="flex flex-col items-center gap-3 z-10">
                    <div className="w-24 h-24 rounded-2xl bg-base-100 border border-base-200 shadow-md flex flex-col items-center justify-center gap-2">
                        <span className="text-3xl">🖥️</span>
                        <span className="text-[10px] font-bold tracking-wider">VM</span>
                    </div>
                </div>
             </div>
          </div>
          <div className="orchestration-content">
            <h2>Seamless Orchestration</h2>
            <p>
              Alloy CI acts as a lightweight bridge between your CI provider (GitHub Actions, GitLab CI) and your Tart VMs. It handles the lifecycle of ephemeral environments automatically.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-lg font-medium">
                <span className="text-success">✓</span> Auto-registration of runners
              </li>
              <li className="flex items-center gap-3 text-lg font-medium">
                <span className="text-success">✓</span> Graceful shutdown and cleanup
              </li>
              <li className="flex items-center gap-3 text-lg font-medium">
                <span className="text-success">✓</span> Parallel execution support
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* AI-Ready API Section */}
      <section className="api-section" id="api">
        <div className="api-container">
          <div className="api-content">
            <div className="api-badge">Built for AI Agents</div>
            <h2>Programmatic Control</h2>
            <p>
              Full REST API access to trigger builds, manage VMs, and stream logs. Perfect for building custom workflows or integrating with AI agents.
            </p>
            <div className="api-features">
              <div className="api-feature">
                <span className="feature-dot"></span>
                RESTful Endpoints
              </div>
              <div className="api-feature">
                <span className="feature-dot"></span>
                Websocket Log Streaming
              </div>
              <div className="api-feature">
                <span className="feature-dot"></span>
                Token-based Auth
              </div>
            </div>
          </div>
          <div className="api-code-block">
            <div className="code-header">
              <div className="code-tabs">
                <button
                  className={`code-tab ${activeTab === 'python' ? 'active' : ''}`}
                  onClick={() => setActiveTab('python')}
                >
                  Python
                </button>
                <button
                  className={`code-tab ${activeTab === 'curl' ? 'active' : ''}`}
                  onClick={() => setActiveTab('curl')}
                >
                  cURL
                </button>
              </div>
              <div className="window-controls">
                <span></span><span></span><span></span>
              </div>
            </div>
            <div className="code-content">
              {activeTab === 'python' ? (
                <pre><code>
<span className="keyword">import</span> requests

<span className="comment"># Trigger a build from an AI agent</span>
response = requests.post(
    <span className="string">"https://api.alloy-ci.dev/v1/jobs"</span>,
    headers=<span className="punctuation">{'{'}</span><span className="string">"Authorization"</span>: <span className="string">f"Bearer <span className="variable">{'{api_key}'}</span>"</span><span className="punctuation">{'}'}</span>,
    json=<span className="punctuation">{'{'}</span><span className="string">"repo"</span>: <span className="string">"my-ios-app"</span>, <span className="string">"branch"</span>: <span className="string">"main"</span><span className="punctuation">{'}'}</span>
)

print(<span className="string">f"Build started: <span className="variable">{'{response.json()[\'id\']}'}</span>"</span>)
</code></pre>
              ) : (
                <pre><code>
<span className="comment"># Trigger a build via cURL</span>
curl -X POST https://api.alloy-ci.dev/v1/jobs \
  -H <span className="string">"Authorization: Bearer $ALLOY_API_KEY"</span> \
  -d <span className="string">'{"{\"repo\": \"my-ios-app\", \"branch\": \"main\"}"}'</span>
</code></pre>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="comparison-section" id="pricing">
        <h2 className="section-heading">Why switch to Alloy CI?</h2>
        <p className="section-subheading">Stop paying the "GitHub Tax" for slow cloud runners.</p>
        <div className="comparison-table-wrapper">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th className="highlight-col">Alloy CI (Self-Hosted)</th>
                <th>GitHub Actions</th>
                <th>CircleCI</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Boot Time</td>
                <td className="highlight-col"><span className="value-good">~1s (Instant)</span></td>
                <td><span className="value-neutral">60s+</span></td>
                <td><span className="value-neutral">60s+</span></td>
              </tr>
              <tr>
                <td>Cost</td>
                <td className="highlight-col"><span className="value-good">$0 / min</span></td>
                <td><span className="value-warning">$0.08+ / min</span></td>
                <td><span className="value-warning">Expensive Tiers</span></td>
              </tr>
              <tr>
                <td>Privacy</td>
                <td className="highlight-col"><span className="value-good">Local / VPN</span></td>
                <td><span className="value-neutral">Third-party Cloud</span></td>
                <td><span className="value-neutral">Third-party Cloud</span></td>
              </tr>
              <tr>
                <td>Data Control</td>
                <td className="highlight-col"><span className="badge-success">100% Yours</span></td>
                <td><span className="value-neutral">Shared Infra</span></td>
                <td><span className="value-neutral">Shared Infra</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section-new">
        <h2>Ready to reclaim your build time?</h2>
        <p>Join hundreds of mobile teams shipping faster with Alloy CI and Tart.</p>
        <div className="cta-buttons">
          <Link to="/signup" className="btn btn-primary btn-lg">
            Get Started
          </Link>
          <a href="https://github.com/ekim1394/alloy" className="btn btn-outline btn-lg" target="_blank" rel="noopener noreferrer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            Star on GitHub
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer-new">
        <div className="footer-container">
          <div className="footer-left">
            <span className="footer-logo">⚡ Alloy CI</span>
            <span className="footer-copyright">© 2024 Alloy CI. Open Source.</span>
          </div>
          <div className="footer-right">
            <a href="https://github.com/ekim1394/alloy/tree/main/docs" target="_blank" rel="noopener noreferrer">Documentation</a>
            <a href="https://github.com/ekim1394/alloy" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="#">License</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
