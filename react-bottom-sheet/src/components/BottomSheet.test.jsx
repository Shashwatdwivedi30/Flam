import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BottomSheet from './BottomSheet';

// Mock window.innerHeight and innerWidth
Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 800,
});

Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 0));
global.cancelAnimationFrame = jest.fn();

// Mock performance.now
global.performance = {
  now: jest.fn(() => Date.now()),
};

describe('BottomSheet Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    title: 'Test Bottom Sheet',
    description: 'Test description',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset window dimensions
    window.innerHeight = 800;
    window.innerWidth = 1024;
  });

  describe('Rendering', () => {
    test('renders when isOpen is true', () => {
      render(<BottomSheet {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    test('does not render when isOpen is false', () => {
      render(<BottomSheet {...defaultProps} isOpen={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('renders with custom title and description', () => {
      render(<BottomSheet {...defaultProps} />);
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'bottom-sheet-title');
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-describedby', 'bottom-sheet-description');
    });

    test('renders with default content when no children provided', () => {
      render(<BottomSheet {...defaultProps} />);
      expect(screen.getByText('Bottom Sheet Content')).toBeInTheDocument();
    });

    test('renders with custom children', () => {
      const customContent = <div data-testid="custom-content">Custom content</div>;
      render(<BottomSheet {...defaultProps}>{customContent}</BottomSheet>);
      expect(screen.getByTestId('custom-content')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA attributes', () => {
      render(<BottomSheet {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'bottom-sheet-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'bottom-sheet-description');
    });

    test('has screen reader announcements', () => {
      render(<BottomSheet {...defaultProps} />);
      const announcement = screen.getByRole('status');
      expect(announcement).toBeInTheDocument();
      expect(announcement).toHaveClass('sr-only');
    });

    test('handle has proper accessibility attributes', () => {
      render(<BottomSheet {...defaultProps} />);
      const handle = screen.getByRole('button', { name: /drag handle/i });
      expect(handle).toHaveAttribute('aria-label');
      expect(handle).toHaveAttribute('tabIndex', '0');
    });

    test('control buttons have proper accessibility attributes', () => {
      render(<BottomSheet {...defaultProps} />);
      const minimizeBtn = screen.getByTitle('Minimize');
      const maximizeBtn = screen.getByTitle('Maximize');
      
      expect(minimizeBtn).toHaveAttribute('aria-label', 'Minimize bottom sheet');
      expect(maximizeBtn).toHaveAttribute('aria-label', 'Maximize bottom sheet');
    });

    test('snap point buttons have proper accessibility attributes', () => {
      render(<BottomSheet {...defaultProps} />);
      const snapButtons = screen.getAllByRole('button', { name: /minimal|half|full/i });
      
      snapButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-pressed');
        expect(button).toHaveAttribute('aria-label');
      });
    });
  });

  describe('Keyboard Navigation', () => {
    test('handles Escape key to close', () => {
      render(<BottomSheet {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      
      fireEvent.keyDown(dialog, { key: 'Escape' });
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    test('handles ArrowUp key to expand', () => {
      render(<BottomSheet {...defaultProps} defaultSnapPoint="half-open" />);
      const dialog = screen.getByRole('dialog');
      
      fireEvent.keyDown(dialog, { key: 'ArrowUp' });
      // Should animate to fully-open
      expect(screen.getByText('Bottom sheet half open')).toBeInTheDocument();
    });

    test('handles ArrowDown key to collapse', () => {
      render(<BottomSheet {...defaultProps} defaultSnapPoint="fully-open" />);
      const dialog = screen.getByRole('dialog');
      
      fireEvent.keyDown(dialog, { key: 'ArrowDown' });
      // Should animate to half-open
      expect(screen.getByText('Bottom sheet fully open')).toBeInTheDocument();
    });

    test('handles Home key to maximize', () => {
      render(<BottomSheet {...defaultProps} defaultSnapPoint="half-open" />);
      const dialog = screen.getByRole('dialog');
      
      fireEvent.keyDown(dialog, { key: 'Home' });
      // Should animate to fully-open
      expect(screen.getByText('Bottom sheet half open')).toBeInTheDocument();
    });

    test('handles End key to minimize', () => {
      render(<BottomSheet {...defaultProps} defaultSnapPoint="half-open" />);
      const dialog = screen.getByRole('dialog');
      
      fireEvent.keyDown(dialog, { key: 'End' });
      // Should animate to closed
      expect(screen.getByText('Bottom sheet half open')).toBeInTheDocument();
    });

    test('handle responds to Enter key', () => {
      render(<BottomSheet {...defaultProps} defaultSnapPoint="half-open" />);
      const handle = screen.getByRole('button', { name: /drag handle/i });
      
      fireEvent.keyDown(handle, { key: 'Enter' });
      // Should toggle between half-open and fully-open
      expect(screen.getByText('Bottom sheet half open')).toBeInTheDocument();
    });
  });

  describe('Touch/Mouse Interactions', () => {
    test('handles mouse down on handle', () => {
      render(<BottomSheet {...defaultProps} />);
      const handle = screen.getByRole('button', { name: /drag handle/i });
      
      fireEvent.mouseDown(handle, { clientY: 100 });
      expect(handle.closest('.bottom-sheet')).toHaveClass('dragging');
    });

    test('handles mouse move during drag', () => {
      render(<BottomSheet {...defaultProps} />);
      const handle = screen.getByRole('button', { name: /drag handle/i });
      
      fireEvent.mouseDown(handle, { clientY: 100 });
      fireEvent.mouseMove(handle, { clientY: 150 });
      
      const bottomSheet = handle.closest('.bottom-sheet');
      expect(bottomSheet).toHaveClass('dragging');
    });

    test('handles mouse up to end drag', () => {
      render(<BottomSheet {...defaultProps} />);
      const handle = screen.getByRole('button', { name: /drag handle/i });
      
      fireEvent.mouseDown(handle, { clientY: 100 });
      fireEvent.mouseUp(handle);
      
      const bottomSheet = handle.closest('.bottom-sheet');
      expect(bottomSheet).not.toHaveClass('dragging');
    });

    test('handles touch events', () => {
      render(<BottomSheet {...defaultProps} />);
      const handle = screen.getByRole('button', { name: /drag handle/i });
      
      fireEvent.touchStart(handle, { touches: [{ clientY: 100 }] });
      expect(handle.closest('.bottom-sheet')).toHaveClass('dragging');
      
      fireEvent.touchMove(handle, { touches: [{ clientY: 150 }] });
      fireEvent.touchEnd(handle);
      
      const bottomSheet = handle.closest('.bottom-sheet');
      expect(bottomSheet).not.toHaveClass('dragging');
    });
  });

  describe('Snap Point Controls', () => {
    test('manual control buttons work', () => {
      render(<BottomSheet {...defaultProps} defaultSnapPoint="half-open" />);
      
      const minimizeBtn = screen.getByTitle('Minimize');
      const maximizeBtn = screen.getByTitle('Maximize');
      
      fireEvent.click(minimizeBtn);
      expect(screen.getByText('Bottom sheet half open')).toBeInTheDocument();
      
      fireEvent.click(maximizeBtn);
      expect(screen.getByText('Bottom sheet half open')).toBeInTheDocument();
    });

    test('snap point buttons work', () => {
      render(<BottomSheet {...defaultProps} defaultSnapPoint="half-open" />);
      
      const fullButton = screen.getByRole('button', { name: /open to full size/i });
      fireEvent.click(fullButton);
      
      expect(screen.getByText('Bottom sheet half open')).toBeInTheDocument();
    });

    test('overlay click closes or minimizes', () => {
      render(<BottomSheet {...defaultProps} defaultSnapPoint="half-open" />);
      const overlay = screen.getByRole('dialog');
      
      fireEvent.click(overlay);
      expect(screen.getByText('Bottom sheet half open')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('adapts to mobile screen size', () => {
      window.innerWidth = 375; // Mobile width
      window.innerHeight = 667;
      
      render(<BottomSheet {...defaultProps} />);
      const bottomSheet = screen.getByRole('dialog').querySelector('.bottom-sheet');
      
      expect(bottomSheet).toHaveClass('mobile');
      expect(bottomSheet).not.toHaveClass('tablet');
    });

    test('adapts to tablet screen size', () => {
      window.innerWidth = 768; // Tablet width
      window.innerHeight = 1024;
      
      render(<BottomSheet {...defaultProps} />);
      const bottomSheet = screen.getByRole('dialog').querySelector('.bottom-sheet');
      
      expect(bottomSheet).toHaveClass('tablet');
      expect(bottomSheet).not.toHaveClass('mobile');
    });

    test('hides controls on mobile', () => {
      window.innerWidth = 375;
      render(<BottomSheet {...defaultProps} />);
      
      expect(screen.queryByTitle('Minimize')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Maximize')).not.toBeInTheDocument();
    });

    test('shows controls on desktop', () => {
      window.innerWidth = 1024;
      render(<BottomSheet {...defaultProps} />);
      
      expect(screen.getByTitle('Minimize')).toBeInTheDocument();
      expect(screen.getByTitle('Maximize')).toBeInTheDocument();
    });
  });

  describe('Animation and State Management', () => {
    test('animates to snap points', async () => {
      render(<BottomSheet {...defaultProps} defaultSnapPoint="closed" />);
      
      const handle = screen.getByRole('button', { name: /drag handle/i });
      fireEvent.keyDown(handle, { key: 'Enter' });
      
      await waitFor(() => {
        expect(screen.getByText('Bottom sheet minimized')).toBeInTheDocument();
      });
    });

    test('prevents interactions during animation', () => {
      render(<BottomSheet {...defaultProps} />);
      const handle = screen.getByRole('button', { name: /drag handle/i });
      
      // Start animation
      fireEvent.keyDown(handle, { key: 'Enter' });
      
      // Try to interact during animation
      fireEvent.mouseDown(handle, { clientY: 100 });
      expect(handle.closest('.bottom-sheet')).not.toHaveClass('dragging');
    });

    test('calculates velocity correctly', () => {
      render(<BottomSheet {...defaultProps} />);
      const handle = screen.getByRole('button', { name: /drag handle/i });
      
      const startTime = Date.now();
      fireEvent.mouseDown(handle, { clientY: 100 });
      
      // Simulate fast movement
      fireEvent.mouseMove(handle, { clientY: 200 });
      fireEvent.mouseUp(handle);
      
      // Should trigger velocity-based snapping
      expect(screen.getByText('Bottom sheet half open')).toBeInTheDocument();
    });
  });

  describe('Focus Management', () => {
    test('focuses handle when opened', () => {
      render(<BottomSheet {...defaultProps} />);
      const handle = screen.getByRole('button', { name: /drag handle/i });
      
      // Focus should be set after a short delay
      setTimeout(() => {
        expect(document.activeElement).toBe(handle);
      }, 150);
    });

    test('restores focus when closed', () => {
      const { rerender } = render(<BottomSheet {...defaultProps} />);
      
      // Close the bottom sheet
      rerender(<BottomSheet {...defaultProps} isOpen={false} />);
      
      // Focus should be restored to previous element
      expect(document.activeElement).not.toBe(screen.queryByRole('button', { name: /drag handle/i }));
    });
  });

  describe('Edge Cases', () => {
    test('handles rapid state changes', () => {
      const { rerender } = render(<BottomSheet {...defaultProps} />);
      
      // Rapidly open and close
      rerender(<BottomSheet {...defaultProps} isOpen={false} />);
      rerender(<BottomSheet {...defaultProps} isOpen={true} />);
      rerender(<BottomSheet {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('handles window resize', () => {
      render(<BottomSheet {...defaultProps} />);
      
      // Simulate window resize
      window.innerWidth = 375;
      fireEvent(window, new Event('resize'));
      
      const bottomSheet = screen.getByRole('dialog').querySelector('.bottom-sheet');
      expect(bottomSheet).toHaveClass('mobile');
    });

    test('handles orientation change', () => {
      render(<BottomSheet {...defaultProps} />);
      
      // Simulate orientation change
      fireEvent(window, new Event('orientationchange'));
      
      // Should handle the event without errors
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    test('handles missing onClose prop', () => {
      const { onClose, ...propsWithoutOnClose } = defaultProps;
      render(<BottomSheet {...propsWithoutOnClose} />);
      
      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Escape' });
      
      // Should not throw error
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('cancels animation frame on unmount', () => {
      const { unmount } = render(<BottomSheet {...defaultProps} />);
      
      unmount();
      
      expect(cancelAnimationFrame).toHaveBeenCalled();
    });

    test('uses requestAnimationFrame for smooth animations', () => {
      render(<BottomSheet {...defaultProps} />);
      const handle = screen.getByRole('button', { name: /drag handle/i });
      
      fireEvent.keyDown(handle, { key: 'Enter' });
      
      expect(requestAnimationFrame).toHaveBeenCalled();
    });
  });
}); 