import { Link } from 'react-router-dom'

function Landing() {
  return (
    <div className="min-h-screen bg-base-100 flex flex-col font-sans">
      {/* Navigation */}
      <nav className="navbar bg-base-100/80 backdrop-blur-md border-b border-base-content/10 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex-1">
            <Link to="/" className="btn btn-ghost text-xl font-bold gap-2">
              <span className="text-2xl">⚡</span> Alloy
            </Link>
            <div className="hidden md:flex gap-6 ml-8 text-sm font-medium text-base-content/70">
              <a href="#features" className="hover:text-primary transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-primary transition-colors">How It Works</a>
              <a href="https://github.com/your-repo/alloy" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Documentation</a>
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
        <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-8 border border-primary/20">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              Now supporting macOS 15 Sequoia
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
              Supercharge your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Xcode CI</span> with Alloy
            </h1>
            <p className="text-xl text-base-content/70 mb-10 leading-relaxed max-w-lg">
              The self-hosted runner for Apple Silicon-backed Tart VMs. 
              Instant startups, and zero maintenance overhead.
            </p>
            <div className="flex flex-wrap gap-4 mb-12">
              <Link to="/signup" className="btn btn-primary btn-lg">
                Get Started
              </Link>
              <a href="https://github.com/your-repo/alloy" className="btn btn-outline btn-lg" target="_blank" rel="noopener noreferrer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-1">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                View on GitHub
              </a>
            </div>
            <div className="flex items-center gap-4 py-6 border-t border-base-content/10">
              <div className="avatar-group -space-x-4 rtl:space-x-reverse">
                <div className="avatar border-base-100">
                  <div className="w-8 h-8 flex items-center justify-center bg-base-300 text-xs">👤</div>
                </div>
                <div className="avatar border-base-100">
                  <div className="w-8 h-8 flex items-center justify-center bg-base-300 text-xs">👤</div>
                </div>
                <div className="avatar border-base-100">
                  <div className="w-8 h-8 flex items-center justify-center bg-base-300 text-xs">👤</div>
                </div>
              </div>
              <span className="text-sm font-medium text-base-content/60">Trusted by 500+ iOS Engineers</span>
            </div>
          </div>
          
          <div className="relative">
            <div className="mockup-window border border-base-300 bg-base-300 shadow-2xl">
              <div className="flex justify-center px-4 py-2 border-b border-base-200 bg-base-200 absolute top-0 left-0 right-0 h-10">
                  <div className="text-xs text-base-content/50 font-mono mt-1">Terminal</div>
              </div>
              <div className="bg-neutral px-6 py-8 pt-12 min-h-[400px] font-mono text-sm leading-relaxed text-neutral-content">
                <div className="mb-2">
                  <span className="text-primary mr-2">$</span>alloy run --vm macos-14
                </div>
                <div className="text-success/90 mb-1">
                  ✓ Cloning alloy-runner v1.0.0...
                </div>
                 <div className="text-success/90 mb-1">
                  ✓ Connected to GitHub Actions
                </div>
                 <div className="text-success/90 mb-1">
                  ✓ Tart VM macos-14 ready (0.3s)
                </div>
                 <div className="text-success/90 mb-1">
                  ✓ Running: xcodebuild test -scheme MyApp
                </div>
                 <div className="text-info/90 mb-1">
                  → Build Succeeded | 47 tests passed
                </div>
                 <div className="text-success/90 mb-1">
                  ✓ Uploading artifacts... done
                </div>
                <div className="mt-4 text-base-content/50 italic">
                  ✨ Job completed in 2m 34s
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-16 border-y border-base-content/5 bg-base-200/50">
        <div className="container mx-auto px-6 text-center">
          <p className="text-xs font-bold tracking-[0.2em] text-base-content/50 uppercase mb-8">POWERED BY MODERN INFRASTRUCTURE</p>
          <div className="flex flex-wrap justify-center gap-12 md:gap-20 opacity-70 grayscale hover:grayscale-0 transition-all duration-300">
            <div className="flex items-center gap-3 text-xl font-bold">
              <span className="text-2xl">🍎</span> Apple Silicon
            </div>
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
      <section className="py-24" id="features">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mb-16">
            <h2 className="text-4xl font-extrabold mb-6">Built for Speed and Security</h2>
            <p className="text-xl text-base-content/70">
                Alloy leverages the power of Apple Silicon to deliver the fastest CI experience available today.
            </p>
          </div>
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
          <div className="order-1 lg:order-2">
            <h2 className="text-4xl font-extrabold mb-6">Seamless Orchestration</h2>
            <p className="text-lg text-base-content/70 mb-8 leading-relaxed">
              Alloy acts as a lightweight bridge between your CI provider (GitHub Actions, GitLab CI) and your Tart VMs. It handles the lifecycle of ephemeral environments automatically.
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

      {/* Real-time Visibility */}
      <section className="py-24">
        <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
            <div>
                 <h2 className="text-4xl font-extrabold mb-6">Real-time Visibility</h2>
                <p className="text-lg text-base-content/70 mb-8 leading-relaxed">
                Debug faster with streaming logs. Alloy pipes every line directly from the VM to your CI dashboard in real-time. No more "unknown error" failures.
                </p>
                <a href="#" className="link link-primary font-bold text-lg no-underline hover:underline">Read the docs →</a>
            </div>
             <div>
                <div className="mockup-code bg-neutral text-neutral-content shadow-2xl">
                    <div className="px-6 py-2 border-b border-neutral-content/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px] shadow-success"></span>
                            <span className="text-xs font-medium opacity-70">Build Output • Live</span>
                        </div>
                    </div>
                     <div className="px-6 py-6 font-mono text-sm space-y-2">
                        <div className="flex gap-4"><span className="opacity-40 select-none">12:34:01</span> Compiling SwiftUI views...</div>
                         <div className="flex gap-4"><span className="opacity-40 select-none">12:34:02</span> Building target 'MyApp'...</div>
                          <div className="flex gap-4 text-success"><span className="opacity-40 select-none text-neutral-content">12:34:03</span> ✓ Build succeeded</div>
                           <div className="flex gap-4"><span className="opacity-40 select-none">12:34:04</span> Running 47 tests...</div>
                            <div className="flex gap-4 text-success"><span className="opacity-40 select-none text-neutral-content">12:34:15</span> ✓ All tests passed</div>
                     </div>
                </div>
            </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-24 bg-base-200/50">
        <div className="container mx-auto px-6 max-w-5xl">
            <div className="text-center mb-16">
                <h2 className="text-4xl font-extrabold mb-4">Why switch to Alloy?</h2>
                <p className="text-lg text-base-content/60">Price comparison for self-hosted runners</p>
            </div>
            
            <div className="overflow-x-auto bg-base-100 rounded-3xl shadow-xl border border-base-200">
                <table className="table table-lg">
                    <thead>
                        <tr className="bg-base-200/50 border-b-base-200">
                            <th className="px-6 py-6 text-base">Feature</th>
                            <th className="px-6 py-6 text-base bg-primary/5 text-primary text-center border-x border-primary/10">Alloy (Self-Hosted)</th>
                            <th className="px-6 py-6 text-base text-center text-base-content/60">Standard Cloud Runner</th>
                            <th className="px-6 py-6 text-base text-center text-base-content/60">Bare Metal Mac mini</th>
                        </tr>
                    </thead>
                    <tbody>
                         <tr className="border-b-base-200">
                            <td className="px-6 font-bold">Startup Time</td>
                            <td className="px-6 text-center bg-primary/5 border-x border-primary/10 text-success font-bold">~3 seconds</td>
                            <td className="px-6 text-center">2-5+ mins</td>
                            <td className="px-6 text-center text-success font-bold">Instant (Shared)</td>
                        </tr>
                         <tr className="border-b-base-200">
                            <td className="px-6 font-bold">Environment Isolation</td>
                            <td className="px-6 text-center bg-primary/5 border-x border-primary/10">
                                <span className="badge badge-success text-white">100% Ephemeral</span>
                            </td>
                            <td className="px-6 text-center">Yes</td>
                            <td className="px-6 text-center"><span className="badge badge-warning text-white">Dirty State</span></td>
                        </tr>
                        <tr className="border-b-base-200">
                            <td className="px-6 font-bold">Hardware Cost</td>
                            <td className="px-6 text-center bg-primary/5 border-x border-primary/10 text-success font-bold">One-time</td>
                            <td className="px-6 text-center">High Recurring</td>
                            <td className="px-6 text-center text-success font-bold">One-time</td>
                        </tr>
                         <tr>
                            <td className="px-6 font-bold">Maintenance</td>
                            <td className="px-6 text-center bg-primary/5 border-x border-primary/10 font-medium">Low (Automated)</td>
                            <td className="px-6 text-center text-success">Zero</td>
                            <td className="px-6 text-center text-warning">High (Manual)</td>
                        </tr>
                    </tbody>
                </table>
            </div>

        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 text-center">
        <div className="container mx-auto px-6 max-w-4xl">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6">Ready to reclaim your build time?</h2>
            <p className="text-xl text-base-content/60 mb-10">Join hundreds of mobile teams shipping faster with Alloy and Tart.</p>
            <div className="flex justify-center gap-4">
               <Link to="/signup" className="btn btn-primary btn-lg min-w-[160px]">
                Install Now
              </Link>
              <a href="https://github.com/your-repo/alloy" className="btn btn-outline btn-lg min-w-[160px]" target="_blank" rel="noopener noreferrer">
                View Documentation
              </a>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer footer-center p-10 bg-base-200 text-base-content rounded">
        <div className="grid grid-flow-col gap-4">
             <a className="link link-hover">Documentation</a>
            <a className="link link-hover">GitHub</a>
            <a className="link link-hover">Blog</a>
            <a className="link link-hover">License</a>
        </div>
        <div>
             <div className="flex justify-center items-center gap-2 font-bold text-xl mb-2">
                <span>⚡</span> Alloy
            </div>
            <p>© 2024 Alloy Runner. Open Source.</p>
        </div>
      </footer>
    </div>
  )
}

export default Landing
