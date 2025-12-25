import { Link } from 'react-router-dom'

function Landing() {
  return (
    <div className="landing">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="hero-icon">⚡</span> Alloy
          </h1>
          <p className="hero-subtitle">
            Run macOS CI/CD jobs remotely on your own hardware
          </p>
          <p className="hero-description">
            Build, test, and deploy iOS and macOS apps using workers you control. 
            No vendor lock-in. No per-minute billing. Just pure, unadulterated compute.
          </p>
          <div className="hero-cta">
            <Link to="/signup" className="btn btn-primary btn-lg">
              Get Started Free
            </Link>
            <Link to="/login" className="btn btn-lg">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2 className="section-title">Why Alloy?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🖥️</div>
            <h3>Your Hardware</h3>
            <p>Run CI jobs on Mac minis, Mac Studios, or any macOS hardware you own. Full control over your build environment.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💰</div>
            <h3>Fixed Costs</h3>
            <p>No surprise bills. Pay for your hardware once and run unlimited builds. Perfect for teams and indie developers.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Secure by Default</h3>
            <p>Your code never leaves your network. End-to-end encryption ensures your proprietary code stays protected.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚙️</div>
            <h3>Easy Setup</h3>
            <p>Install the worker on any Mac in minutes. Connect to the cloud orchestrator and start running jobs immediately.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Real-time Logs</h3>
            <p>Watch your builds in real-time with streaming logs. Debug issues as they happen, not after.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔗</div>
            <h3>CLI First</h3>
            <p>Powerful CLI for scripting and automation. Integrate with any existing workflow or CI system.</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <h2 className="section-title">How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Install Worker</h3>
            <p>Download and run the Alloy worker on your Mac. It connects securely to our cloud orchestrator.</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Submit Jobs</h3>
            <p>Use the CLI or API to submit CI jobs. Run xcodebuild, fastlane, or any shell command.</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Watch & Deploy</h3>
            <p>Monitor progress in real-time. Get instant notifications when builds complete.</p>
          </div>
        </div>
      </section>

      {/* Code Example */}
      <section className="code-example">
        <h2 className="section-title">Get Started in Seconds</h2>
        <div className="code-block">
          <div className="code-header">
            <span className="code-lang">bash</span>
          </div>
          <pre><code>{`# Install the CLI
brew install alloy

# Run your first job
alloy run -c "xcodebuild test -scheme MyApp"

# Watch the logs stream in real-time
alloy logs --follow`}</code></pre>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2>Ready to take control of your CI/CD?</h2>
        <p>Join developers who have ditched per-minute billing for unlimited builds.</p>
        <div className="hero-cta">
          <Link to="/signup" className="btn btn-primary btn-lg">
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>© 2024 Alloy. Built for developers, by developers.</p>
      </footer>
    </div>
  )
}

export default Landing
