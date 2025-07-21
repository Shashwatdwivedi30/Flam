import React, { useState, useEffect, useRef } from 'react';
import './BottomSheet.css';

const BottomSheet = ({ 
  isOpen = false, 
  onClose, 
  children,
  snapPoints = ['closed', 'half-open', 'fully-open'],
  defaultSnapPoint = 'half-open',
  // Accessibility props
  title = 'Bottom Sheet',
  description = 'A bottom sheet component with multiple snap points',
  closeOnEscape = true,
  trapFocus = true
}) => {
  const [currentSnapPoint, setCurrentSnapPoint] = useState(defaultSnapPoint);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [targetHeight, setTargetHeight] = useState('50%');
  const [startHeight, setStartHeight] = useState('50%');
  const [dragVelocity, setDragVelocity] = useState(0);
  const [lastDragTime, setLastDragTime] = useState(0);
  const [lastDragY, setLastDragY] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);
  const [focusedElement, setFocusedElement] = useState(null);
  const [announcement, setAnnouncement] = useState('');
  const animationRef = useRef(null);
  const velocityRef = useRef([]);
  const overlayRef = useRef(null);
  const handleRef = useRef(null);
  const contentRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Responsive breakpoints
  const BREAKPOINTS = {
    mobile: 768,
    tablet: 1024,
    desktop: 1200
  };

  // Detect device type and viewport
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setViewportWidth(width);
      setViewportHeight(height);
      setIsMobile(width < BREAKPOINTS.mobile);
      setIsTablet(width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet);
    };

    handleResize(); // Initial call
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Responsive snap point configurations
  const getSnapPointConfig = () => {
    const baseConfig = {
      'closed': {
        height: isMobile ? '60px' : '80px',
        contentVisible: false,
        showHandle: true,
        showSnapButtons: false,
        threshold: 0.2,
        maxWidth: isMobile ? '100%' : '600px'
      },
      'half-open': {
        height: isMobile ? '60%' : '50%',
        contentVisible: true,
        showHandle: true,
        showSnapButtons: !isMobile,
        threshold: 0.5,
        maxWidth: isMobile ? '100%' : '600px'
      },
      'fully-open': {
        height: isMobile ? '95%' : '90%',
        contentVisible: true,
        showHandle: true,
        showSnapButtons: !isMobile,
        threshold: 0.8,
        maxWidth: isMobile ? '100%' : '600px'
      }
    };

    // Adjust for tablet
    if (isTablet) {
      baseConfig['half-open'].height = '55%';
      baseConfig['fully-open'].height = '92%';
    }

    return baseConfig;
  };

  const snapPointConfig = getSnapPointConfig();
  const currentConfig = snapPointConfig[currentSnapPoint];

  // Spring animation configuration - responsive
  const getSpringConfig = () => {
    if (isMobile) {
      return {
        tension: 0.4, // Faster on mobile
        friction: 0.7,
        mass: 0.8
      };
    }
    return {
      tension: 0.3,
      friction: 0.8,
      mass: 1.0
    };
  };

  const springConfig = getSpringConfig();

  // Spring animation function using easing
  const springEase = (t) => {
    const { tension, friction, mass } = springConfig;
    const omega = Math.sqrt(tension / mass);
    const zeta = friction / (2 * Math.sqrt(tension * mass));
    
    if (zeta < 1) {
      const omegaD = omega * Math.sqrt(1 - zeta * zeta);
      return 1 - Math.exp(-zeta * omega * t) * 
        (Math.cos(omegaD * t) + (zeta * omega / omegaD) * Math.sin(omegaD * t));
    } else {
      const omegaN = omega * Math.sqrt(zeta * zeta - 1);
      return 1 - Math.exp(-zeta * omega * t) * 
        (Math.cosh(omegaN * t) + (zeta * omega / omegaN) * Math.sinh(omegaN * t));
    }
  };

  // Calculate velocity from recent drag positions
  const calculateVelocity = (currentY, currentTime) => {
    velocityRef.current.push({ y: currentY, time: currentTime });
    
    // Keep only last 5 measurements for velocity calculation
    if (velocityRef.current.length > 5) {
      velocityRef.current.shift();
    }
    
    if (velocityRef.current.length >= 2) {
      const first = velocityRef.current[0];
      const last = velocityRef.current[velocityRef.current.length - 1];
      const timeDiff = last.time - first.time;
      const distance = last.y - first.y;
      
      if (timeDiff > 0) {
        return distance / timeDiff; // pixels per millisecond
      }
    }
    
    return 0;
  };

  // Determine target snap point based on position and velocity
  const determineTargetSnapPoint = (currentHeight, velocity) => {
    const snapPointOrder = ['closed', 'half-open', 'fully-open'];
    const currentIndex = snapPointOrder.indexOf(currentSnapPoint);
    
    // Convert height to percentage for comparison
    let heightPercent = 0;
    if (currentHeight.includes('%')) {
      heightPercent = parseFloat(currentHeight) / 100;
    } else if (currentHeight.includes('px')) {
      // Approximate percentage based on viewport height
      const pixelHeight = parseFloat(currentHeight);
      heightPercent = pixelHeight / viewportHeight;
    }
    
    // Velocity threshold for automatic snapping - responsive
    const velocityThreshold = isMobile ? 0.3 : 0.5; // Lower threshold on mobile
    
    // If velocity is high enough, snap in that direction
    if (Math.abs(velocity) > velocityThreshold) {
      if (velocity < 0) { // Moving up
        return currentIndex < snapPointOrder.length - 1 ? snapPointOrder[currentIndex + 1] : currentSnapPoint;
      } else { // Moving down
        return currentIndex > 0 ? snapPointOrder[currentIndex - 1] : 'closed';
      }
    }
    
    // Otherwise, snap to nearest based on position - responsive thresholds
    const snapThresholds = isMobile ? [0.1, 0.3, 0.7] : [0.1, 0.35, 0.75];
    
    for (let i = 0; i < snapThresholds.length; i++) {
      if (heightPercent <= snapThresholds[i]) {
        return snapPointOrder[i];
      }
    }
    
    return snapPointOrder[snapPointOrder.length - 1];
  };

  // Animate to snap point with spring motion
  const animateToSnapPoint = (targetSnapPoint) => {
    if (isAnimating) return;
    
    const targetConfig = snapPointConfig[targetSnapPoint];
    const currentConfig = snapPointConfig[currentSnapPoint];
    
    setStartHeight(currentConfig.height);
    setTargetHeight(targetConfig.height);
    setIsAnimating(true);
    setAnimationProgress(0);
    
    const startTime = performance.now();
    const duration = isMobile ? 500 : 600; // Faster on mobile
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const springProgress = springEase(progress);
      setAnimationProgress(springProgress);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        setCurrentSnapPoint(targetSnapPoint);
        setAnimationProgress(0);
        setDragVelocity(0);
        velocityRef.current = [];
        
        // Announce snap point change to screen readers
        announceSnapPointChange(targetSnapPoint);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
  };

  // Calculate current height during animation
  const getCurrentHeight = () => {
    if (!isAnimating) {
      return currentConfig.height;
    }
    
    const startValue = parseFloat(startHeight);
    const targetValue = parseFloat(targetHeight);
    const startUnit = startHeight.replace(/[\d.]/g, '');
    const targetUnit = targetHeight.replace(/[\d.]/g, '');
    
    if (startUnit === '%' && targetUnit === '%') {
      const interpolatedValue = startValue + (targetValue - startValue) * animationProgress;
      return `${interpolatedValue}%`;
    } else if (startUnit === 'px' && targetUnit === 'px') {
      const interpolatedValue = startValue + (targetValue - startValue) * animationProgress;
      return `${interpolatedValue}px`;
    } else {
      return targetHeight;
    }
  };

  // Accessibility functions
  const announceSnapPointChange = (snapPoint) => {
    const snapPointLabels = {
      'closed': 'Bottom sheet minimized',
      'half-open': 'Bottom sheet half open',
      'fully-open': 'Bottom sheet fully open'
    };
    setAnnouncement(snapPointLabels[snapPoint] || `Bottom sheet ${snapPoint}`);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'Escape':
        if (closeOnEscape) {
          e.preventDefault();
          if (currentSnapPoint === 'closed') {
            onClose();
          } else {
            animateToSnapPoint('closed');
          }
        }
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        const snapPointOrder = ['closed', 'half-open', 'fully-open'];
        const currentIndex = snapPointOrder.indexOf(currentSnapPoint);
        if (currentIndex < snapPointOrder.length - 1) {
          animateToSnapPoint(snapPointOrder[currentIndex + 1]);
        }
        break;
      
      case 'ArrowDown':
        e.preventDefault();
        const snapPointOrderDown = ['closed', 'half-open', 'fully-open'];
        const currentIndexDown = snapPointOrderDown.indexOf(currentSnapPoint);
        if (currentIndexDown > 0) {
          animateToSnapPoint(snapPointOrderDown[currentIndexDown - 1]);
        } else if (currentIndexDown === 0) {
          onClose();
        }
        break;
      
      case 'Home':
        e.preventDefault();
        animateToSnapPoint('fully-open');
        break;
      
      case 'End':
        e.preventDefault();
        animateToSnapPoint('closed');
        break;
      
      case 'Tab':
        // Handle focus trapping
        if (trapFocus) {
          const focusableElements = contentRef.current?.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          
          if (focusableElements && focusableElements.length > 0) {
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            
            if (e.shiftKey && document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        }
        break;
    }
  };

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      previousFocusRef.current = document.activeElement;
      
      // Focus the handle or first focusable element
      setTimeout(() => {
        if (handleRef.current) {
          handleRef.current.focus();
        } else if (contentRef.current) {
          const firstFocusable = contentRef.current.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (firstFocusable) {
            firstFocusable.focus();
          }
        }
      }, 100);
    } else {
      // Restore focus when closing
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }
  }, [isOpen]);

  // Handle opening/closing animation
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('bottom-sheet-open');
      setShowControls(!isMobile); // Hide controls on mobile for cleaner UI
      
      // Announce opening
      setAnnouncement(`${title} opened. ${description}`);
    } else {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('bottom-sheet-open');
      setShowControls(false);
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('bottom-sheet-open');
    };
  }, [isOpen, isMobile, title, description]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Touch/Mouse event handlers with responsive improvements
  const handleTouchStart = (e) => {
    if (isAnimating) return;
    
    setIsDragging(true);
    const touch = e.touches ? e.touches[0] : e;
    const currentTime = performance.now();
    
    setStartY(touch.clientY);
    setCurrentY(touch.clientY);
    setLastDragY(touch.clientY);
    setLastDragTime(currentTime);
    setDragVelocity(0);
    velocityRef.current = [];
    
    // Add dragging class to body
    document.body.classList.add('bottom-sheet-dragging');
    
    // Prevent text selection on mobile
    if (isMobile) {
      e.preventDefault();
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || isAnimating) return;
    
    const touch = e.touches ? e.touches[0] : e;
    const currentTime = performance.now();
    
    setCurrentY(touch.clientY);
    
    // Calculate velocity
    const velocity = calculateVelocity(touch.clientY, currentTime);
    setDragVelocity(velocity);
    
    setLastDragY(touch.clientY);
    setLastDragTime(currentTime);
    
    // Prevent scrolling on mobile during drag
    if (isMobile) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging || isAnimating) return;
    
    setIsDragging(false);
    document.body.classList.remove('bottom-sheet-dragging');
    
    // Determine target snap point based on current position and velocity
    const currentHeight = getCurrentHeight();
    const targetSnapPoint = determineTargetSnapPoint(currentHeight, dragVelocity);
    
    if (targetSnapPoint === 'closed' && currentSnapPoint === 'closed') {
      onClose();
    } else if (targetSnapPoint !== currentSnapPoint) {
      animateToSnapPoint(targetSnapPoint);
    }
  };

  // Snap point click handlers
  const handleSnapPointClick = (snapPoint) => {
    if (snapPoint !== currentSnapPoint && !isAnimating) {
      animateToSnapPoint(snapPoint);
    }
  };

  // Handle overlay click to close
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      if (currentSnapPoint === 'closed') {
        onClose();
      } else {
        animateToSnapPoint('closed');
      }
    }
  };

  // Manual control handlers
  const handleMinimize = () => {
    if (!isAnimating) {
      animateToSnapPoint('closed');
    }
  };

  const handleMaximize = () => {
    if (!isAnimating) {
      animateToSnapPoint('fully-open');
    }
  };

  const handleToggle = () => {
    if (!isAnimating) {
      const nextSnapPoint = currentSnapPoint === 'half-open' ? 'fully-open' : 'half-open';
      animateToSnapPoint(nextSnapPoint);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Screen reader announcements */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
        role="status"
      >
        {announcement}
      </div>

      <div 
        className="bottom-sheet-overlay" 
        onClick={handleOverlayClick}
        ref={overlayRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bottom-sheet-title"
        aria-describedby="bottom-sheet-description"
        onKeyDown={handleKeyDown}
      >
        <div 
          className={`bottom-sheet ${isDragging ? 'dragging' : ''} ${currentSnapPoint} ${isAnimating ? 'animating' : ''} ${isMobile ? 'mobile' : ''} ${isTablet ? 'tablet' : ''}`}
          style={{ 
            height: getCurrentHeight(),
            maxWidth: currentConfig.maxWidth,
            transform: isDragging ? `translateY(${currentY - startY}px)` : 'translateY(0)'
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={handleTouchStart}
          onMouseMove={handleTouchMove}
          onMouseUp={handleTouchEnd}
          onMouseLeave={handleTouchEnd}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          role="document"
          aria-label={title}
        >
          {/* Drag Handle - Always visible */}
          <div 
            className="bottom-sheet-handle"
            ref={handleRef}
            tabIndex={0}
            role="button"
            aria-label="Drag handle. Use arrow keys to resize, Escape to close"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                // Toggle between half-open and fully-open
                const nextSnapPoint = currentSnapPoint === 'half-open' ? 'fully-open' : 'half-open';
                animateToSnapPoint(nextSnapPoint);
              }
            }}
          >
            <div className="handle-bar"></div>
            {currentSnapPoint === 'closed' && (
              <div className="closed-indicator">
                <span>{isMobile ? 'Pull up' : 'Pull up to open'}</span>
              </div>
            )}
            
            {/* Manual Control Buttons - Hidden on mobile */}
            {showControls && currentSnapPoint !== 'closed' && (
              <div className="manual-controls">
                <button 
                  className="control-btn minimize-btn"
                  onClick={handleMinimize}
                  disabled={isAnimating}
                  title="Minimize"
                  aria-label="Minimize bottom sheet"
                >
                  <span>−</span>
                </button>
                <button 
                  className="control-btn toggle-btn"
                  onClick={handleToggle}
                  disabled={isAnimating}
                  title={currentSnapPoint === 'half-open' ? 'Expand' : 'Collapse'}
                  aria-label={currentSnapPoint === 'half-open' ? 'Expand to full size' : 'Collapse to half size'}
                >
                  <span>{currentSnapPoint === 'half-open' ? '□' : '○'}</span>
                </button>
                <button 
                  className="control-btn maximize-btn"
                  onClick={handleMaximize}
                  disabled={isAnimating}
                  title="Maximize"
                  aria-label="Maximize bottom sheet"
                >
                  <span>□</span>
                </button>
              </div>
            )}
          </div>

          {/* Snap Point Indicators - Only visible when not closed and not on mobile */}
          {currentConfig.showSnapButtons && (
            <div className="snap-points-indicator" role="toolbar" aria-label="Snap point controls">
              <button
                className={`snap-point-btn ${currentSnapPoint === 'closed' ? 'active' : ''}`}
                onClick={() => handleSnapPointClick('closed')}
                disabled={isAnimating}
                aria-label="Minimize to smallest size"
                aria-pressed={currentSnapPoint === 'closed'}
              >
                <span className="snap-icon">−</span>
                <span className="snap-label">Minimal</span>
              </button>
              <button
                className={`snap-point-btn ${currentSnapPoint === 'half-open' ? 'active' : ''}`}
                onClick={() => handleSnapPointClick('half-open')}
                disabled={isAnimating}
                aria-label="Open to half size"
                aria-pressed={currentSnapPoint === 'half-open'}
              >
                <span className="snap-icon">○</span>
                <span className="snap-label">Half</span>
              </button>
              <button
                className={`snap-point-btn ${currentSnapPoint === 'fully-open' ? 'active' : ''}`}
                onClick={() => handleSnapPointClick('fully-open')}
                disabled={isAnimating}
                aria-label="Open to full size"
                aria-pressed={currentSnapPoint === 'fully-open'}
              >
                <span className="snap-icon">□</span>
                <span className="snap-label">Full</span>
              </button>
            </div>
          )}

          {/* Content Area - Only visible when not closed */}
          {currentConfig.contentVisible && (
            <div 
              className="bottom-sheet-content"
              ref={contentRef}
              id="bottom-sheet-content"
              role="region"
              aria-label="Bottom sheet content"
            >
              <div id="bottom-sheet-title" className="sr-only">{title}</div>
              <div id="bottom-sheet-description" className="sr-only">{description}</div>
              
              {children || (
                <div className="default-content">
                  <h3>Bottom Sheet Content</h3>
                  <p>This is the content area that's visible in half-open and fully-open states.</p>
                  <p>Current snap point: <strong>{currentSnapPoint}</strong></p>
                  <p>Device: <strong>{isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'}</strong></p>
                  <p>Viewport: <strong>{viewportWidth}px × {viewportHeight}px</strong></p>
                  <div className="content-demo">
                    <p>This content demonstrates the responsive design and accessibility features:</p>
                    <ul>
                      <li><strong>Keyboard Navigation:</strong> Use arrow keys, Home, End, and Escape</li>
                      <li><strong>Screen Reader:</strong> Full ARIA support and announcements</li>
                      <li><strong>Focus Management:</strong> Proper focus trapping and restoration</li>
                      <li><strong>Touch Support:</strong> Optimized for mobile and tablet devices</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BottomSheet; 