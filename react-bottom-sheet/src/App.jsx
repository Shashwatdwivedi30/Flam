import { useState } from 'react'
import './App.css'
import BottomSheet from './components/BottomSheet'

function App() {
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false)

  const handleOpenBottomSheet = () => {
    setIsBottomSheetOpen(true)
  }

  const handleCloseBottomSheet = () => {
    setIsBottomSheetOpen(false)
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>React Bottom Sheet Demo</h1>
        <p>A beautiful bottom sheet with responsive design and enhanced user interactions</p>
        <button 
          className="open-button"
          onClick={handleOpenBottomSheet}
        >
          Open Bottom Sheet
        </button>
      </header>
      
      <BottomSheet 
        isOpen={isBottomSheetOpen}
        onClose={handleCloseBottomSheet}
        snapPoints={['closed', 'half-open', 'fully-open']}
        defaultSnapPoint="half-open"
      >
        <div className="custom-content">
          <h3>🎯 Responsive Design Implemented!</h3>
          <p>This bottom sheet now features comprehensive responsive design that adapts seamlessly across all devices:</p>
          
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h4>Mobile Optimized</h4>
              <p>Touch-friendly interactions, compact layout, and optimized snap points for mobile devices.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">💻</div>
              <h4>Desktop Enhanced</h4>
              <p>Full feature set with manual controls, larger touch targets, and enhanced visual feedback.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🔄</div>
              <h4>Adaptive Layout</h4>
              <p>Dynamic sizing, responsive breakpoints, and orientation-aware design patterns.</p>
            </div>
          </div>

          <div className="responsive-features">
            <h4>Responsive Design Features:</h4>
            <div className="responsive-grid">
              <div className="responsive-item">
                <div className="responsive-icon">📏</div>
                <h5>Breakpoint System</h5>
                <p>Mobile: &lt;768px, Tablet: 768-1023px, Desktop: &gt;1024px with smooth transitions between states.</p>
              </div>
              
              <div className="responsive-item">
                <div className="responsive-icon">👆</div>
                <h5>Touch Optimizations</h5>
                <p>Larger touch targets (44px minimum), touch-friendly interactions, and gesture-based controls.</p>
              </div>
              
              <div className="responsive-item">
                <div className="responsive-icon">🎨</div>
                <h5>Adaptive UI</h5>
                <p>Hidden controls on mobile, responsive snap points, and device-specific animations.</p>
              </div>
              
              <div className="responsive-item">
                <div className="responsive-icon">⚡</div>
                <h5>Performance</h5>
                <p>Optimized animations for mobile, reduced motion support, and efficient event handling.</p>
              </div>
            </div>
          </div>

          <div className="device-specifics">
            <h4>Device-Specific Adaptations:</h4>
            <div className="device-grid">
              <div className="device-card mobile-card">
                <div className="device-icon">📱</div>
                <h5>Mobile Devices</h5>
                <ul>
                  <li><strong>Snap Points:</strong> 60px (closed), 60% (half), 95% (full)</li>
                  <li><strong>Controls:</strong> Hidden manual controls for cleaner UI</li>
                  <li><strong>Touch:</strong> Optimized drag interactions and velocity thresholds</li>
                  <li><strong>Layout:</strong> Full-width design with compact spacing</li>
                </ul>
              </div>
              
              <div className="device-card tablet-card">
                <div className="device-icon">📱</div>
                <h5>Tablet Devices</h5>
                <ul>
                  <li><strong>Snap Points:</strong> 80px (closed), 55% (half), 92% (full)</li>
                  <li><strong>Controls:</strong> Visible snap point buttons</li>
                  <li><strong>Touch:</strong> Balanced touch and mouse support</li>
                  <li><strong>Layout:</strong> 90% max-width with medium spacing</li>
                </ul>
              </div>
              
              <div className="device-card desktop-card">
                <div className="device-icon">💻</div>
                <h5>Desktop Devices</h5>
                <ul>
                  <li><strong>Snap Points:</strong> 80px (closed), 50% (half), 90% (full)</li>
                  <li><strong>Controls:</strong> Full manual control buttons</li>
                  <li><strong>Mouse:</strong> Hover effects and precise interactions</li>
                  <li><strong>Layout:</strong> 600px max-width with generous spacing</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="responsive-guide">
            <h4>Try These Responsive Features:</h4>
            <ul>
              <li><strong>Resize your browser</strong> to see the bottom sheet adapt to different screen sizes</li>
              <li><strong>Rotate your device</strong> to experience landscape/portrait adaptations</li>
              <li><strong>Test on mobile</strong> to see touch-optimized interactions</li>
              <li><strong>Check accessibility</strong> with reduced motion preferences</li>
              <li><strong>Verify dark mode</strong> support across all devices</li>
            </ul>
          </div>

          <div className="technical-details">
            <h4>Technical Implementation:</h4>
            <ul>
              <li><strong>Viewport Detection:</strong> Real-time device type and screen size monitoring</li>
              <li><strong>Dynamic Configurations:</strong> Adaptive snap points and animations per device</li>
              <li><strong>Touch Optimization:</strong> Larger touch targets and gesture-friendly interactions</li>
              <li><strong>Performance Tuning:</strong> Device-specific animation timing and spring physics</li>
              <li><strong>Accessibility:</strong> Reduced motion support and proper ARIA attributes</li>
              <li><strong>Cross-Platform:</strong> Consistent experience across iOS, Android, and desktop</li>
            </ul>
          </div>

          <div className="responsive-info">
            <h4>Responsive Breakpoints:</h4>
            <div className="breakpoint-details">
              <div className="breakpoint-item">
                <span className="breakpoint-label">Mobile:</span>
                <span className="breakpoint-value">&lt; 768px</span>
                <span className="breakpoint-desc">Touch-optimized, compact UI</span>
              </div>
              <div className="breakpoint-item">
                <span className="breakpoint-label">Tablet:</span>
                <span className="breakpoint-value">768px - 1023px</span>
                <span className="breakpoint-desc">Balanced touch and mouse</span>
              </div>
              <div className="breakpoint-item">
                <span className="breakpoint-label">Desktop:</span>
                <span className="breakpoint-value">&gt; 1024px</span>
                <span className="breakpoint-desc">Full feature set, hover effects</span>
              </div>
            </div>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}

export default App
