import { Link } from 'react-router-dom'

function Landing() {
  return (
    <div className="landing">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="nav-left">
            <Link to="/" className="nav-logo">
              <span className="logo-icon">⚡</span> Alloy
            </Link>
            <div className="nav-menu">
              <a href="#features">Features</a>
              <a href="#how-it-works">How It Works</a>
              <a href="https://github.com/your-repo/alloy" target="_blank" rel="noopener noreferrer">Documentation</a>
              <a href="https://github.com/your-repo/alloy" target="_blank" rel="noopener noreferrer">Docs</a>
            </div>
          </div>
          <div className="nav-right">
            <Link to="/login" className="nav-link-signin">Sign In</Link>
            <Link to="/signup" className="btn btn-primary">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-left">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              Now supporting macOS 15 Sequoia
            </div>
            <h1 className="hero-headline">
              Supercharge your <span className="highlight">Xcode CI</span> with Alloy
            </h1>
            <p className="hero-tagline">
              The self-hosted runner for Apple Silicon-backed Tart VMs. 
              Instant startups, and zero maintenance overhead.
            </p>
            <div className="hero-buttons">
              <Link to="/signup" className="btn btn-primary btn-lg">
                Get Started
              </Link>
              <a href="https://github.com/your-repo/alloy" className="btn btn-outline btn-lg" target="_blank" rel="noopener noreferrer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                View on GitHub
              </a>
            </div>
            <div className="hero-trust">
              <span className="trust-avatars">
                <span className="trust-avatar">👤</span>
                <span className="trust-avatar">👤</span>
                <span className="trust-avatar">👤</span>
              </span>
              <span className="trust-text">Trusted by 500+ iOS Engineers</span>
            </div>
          </div>
          <div className="hero-right">
            <div className="terminal-window">
              <div className="terminal-header">
                <div className="terminal-buttons">
                  <span className="terminal-btn red"></span>
                  <span className="terminal-btn yellow"></span>
                  <span className="terminal-btn green"></span>
                </div>
                <span className="terminal-title">Terminal</span>
              </div>
              <div className="terminal-body">
                <div className="terminal-line">
                  <span className="terminal-prompt">$</span> alloy run --vm macos-14
                </div>
                <div className="terminal-line output">
                  <span className="terminal-success">✓</span> Cloning alloy-runner v1.0.0...
                </div>
                <div className="terminal-line output">
                  <span className="terminal-success">✓</span> Connected to GitHub Actions
                </div>
                <div className="terminal-line output">
                  <span className="terminal-success">✓</span> Tart VM macos-14 ready (0.3s)
                </div>
                <div className="terminal-line output">
                  <span className="terminal-success">✓</span> Running: xcodebuild test -scheme MyApp
                </div>
                <div className="terminal-line output">
                  <span className="terminal-info">→</span> Build Succeeded | 47 tests passed
                </div>
                <div className="terminal-line output">
                  <span className="terminal-success">✓</span> Uploading artifacts... done
                </div>
                <div className="terminal-line output blank"></div>
                <div className="terminal-line output">
                  <span className="terminal-muted">✨ Job completed in 2m 34s</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="tech-stack">
        <p className="tech-label">POWERED BY MODERN INFRASTRUCTURE</p>
        <div className="tech-logos">
          <div className="tech-item">
            <span className="tech-icon">🍎</span>
            Apple Silicon
          </div>
          <div className="tech-item">
            <span className="tech-icon">🐢</span>
            Tart
          </div>
          <div className="tech-item">
            <span className="tech-icon">⚙️</span>
            GitHub Actions
          </div>
          <div className="tech-item">
            <span className="tech-icon">🚀</span>
            Fastlane
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <h2 className="section-heading">Built for Speed and Security</h2>
        <p className="section-subheading">
          Alloy leverages the power of Apple Silicon to deliver the fastest CI experience available today.
        </p>
        <div className="features-grid-new">
          <div className="feature-card-new">
            <div className="feature-icon-new">
              <span>⚡</span>
            </div>
            <h3>Instant Startup</h3>
            <p>Boot macOS VMs in under 3 seconds. Utilizing Tart's copy-on-write mechanisms for near-instant VM cloning.</p>
          </div>
          <div className="feature-card-new">
            <div className="feature-icon-new">
              <span>🔒</span>
            </div>
            <h3>Complete Isolation</h3>
            <p>Every job runs in a fresh, ephemeral Tart VM. No state leakage between builds, guaranteed.</p>
          </div>
          <div className="feature-card-new">
            <div className="feature-icon-new">
              <span>🖥️</span>
            </div>
            <h3>Apple Silicon Native</h3>
            <p>Hardware virtualization for full macOS VMs on Apple Silicon. Optimized for arm64 apps.</p>
          </div>
        </div>
      </section>

      {/* Orchestration Section */}
      <section className="orchestration-section" id="how-it-works">
        <div className="orchestration-container">
          <div className="orchestration-visual">
            <div className="orchestration-diagram">
              <div className="diagram-box cli-box">
                <span className="diagram-icon">💻</span>
                <span>CLI</span>
              </div>
              <div className="diagram-arrow">→</div>
              <div className="diagram-box runner-box">
                <span className="diagram-icon">🔄</span>
                <span>RUNNER</span>
              </div>
              <div className="diagram-arrow">→</div>
              <div className="diagram-box vm-box">
                <span className="diagram-icon">🖥️</span>
                <span>VM</span>
              </div>
            </div>
          </div>
          <div className="orchestration-content">
            <h2>Seamless Orchestration</h2>
            <p>
              Alloy acts as a lightweight bridge between your CI provider (GitHub Actions, GitLab CI) and your Tart VMs. It handles the lifecycle of ephemeral environments automatically.
            </p>
            <ul className="orchestration-features">
              <li>
                <span className="check-icon">✓</span>
                Auto-registration of runners
              </li>
              <li>
                <span className="check-icon">✓</span>
                Graceful shutdown and cleanup
              </li>
              <li>
                <span className="check-icon">✓</span>
                Parallel execution support
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Real-time Visibility */}
      <section className="visibility-section">
        <div className="visibility-container">
          <div className="visibility-content">
            <h2>Real-time Visibility</h2>
            <p>
              Debug faster with streaming logs. Alloy pipes every line directly from the VM to your CI dashboard in real-time. No more "unknown error" failures.
            </p>
            <a href="#" className="read-docs-link">Read the docs →</a>
          </div>
          <div className="visibility-preview">
            <div className="log-preview">
              <div className="log-header">
                <span className="log-dot green"></span>
                <span>Build Output • Live</span>
              </div>
              <div className="log-content">
                <div className="log-line"><span className="log-time">12:34:01</span> Compiling SwiftUI views...</div>
                <div className="log-line"><span className="log-time">12:34:02</span> Building target 'MyApp'...</div>
                <div className="log-line highlight"><span className="log-time">12:34:03</span> ✓ Build succeeded</div>
                <div className="log-line"><span className="log-time">12:34:04</span> Running 47 tests...</div>
                <div className="log-line highlight"><span className="log-time">12:34:15</span> ✓ All tests passed</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="comparison-section">
        <h2 className="section-heading">Why switch to Alloy?</h2>
        <p className="section-subheading">Price comparison for self-hosted runners</p>
        <div className="comparison-table-wrapper">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th className="highlight-col">Alloy (Self-Hosted)</th>
                <th>Standard Cloud Runner</th>
                <th>Bare Metal Mac mini</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Startup Time</td>
                <td className="highlight-col"><span className="value-good">~3 seconds</span></td>
                <td><span className="value-neutral">2-5+ mins</span></td>
                <td><span className="value-good">Instant (Shared)</span></td>
              </tr>
              <tr>
                <td>Environment Isolation</td>
                <td className="highlight-col">
                  <span className="badge-success">100% Ephemeral</span>
                </td>
                <td><span className="value-neutral">Yes</span></td>
                <td><span className="badge-warning">Dirty State</span></td>
              </tr>
              <tr>
                <td>Hardware Cost</td>
                <td className="highlight-col"><span className="value-good">One-time</span></td>
                <td><span className="value-neutral">High Recurring</span></td>
                <td><span className="value-good">One-time</span></td>
              </tr>
              <tr>
                <td>Maintenance</td>
                <td className="highlight-col"><span className="value-link">Low (Automated)</span></td>
                <td><span className="value-good">Zero</span></td>
                <td><span className="value-warning">High (Manual)</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section-new">
        <h2>Ready to reclaim your build time?</h2>
        <p>Join hundreds of mobile teams shipping faster with Alloy and Tart.</p>
        <div className="cta-buttons">
          <Link to="/signup" className="btn btn-primary btn-lg">
            Install Now
          </Link>
          <a href="https://github.com/your-repo/alloy" className="btn btn-outline btn-lg" target="_blank" rel="noopener noreferrer">
            View Documentation
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer-new">
        <div className="footer-container">
          <div className="footer-left">
            <span className="footer-logo">⚡ Alloy</span>
            <span className="footer-copyright">© 2024 Alloy Runner. Open Source.</span>
          </div>
          <div className="footer-right">
            <a href="#">Documentation</a>
            <a href="#">GitHub</a>
            <a href="#">Blog</a>
            <a href="#">License</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
