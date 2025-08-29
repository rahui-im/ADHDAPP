import { render, screen, fireEvent } from '@testing-library/react'
import { Modal } from '../Modal'

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    title: 'Test Modal',
    children: <div>Modal content</div>,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render modal when open', () => {
    render(<Modal {...defaultProps} />)
    
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
    expect(screen.getByText('Modal content')).toBeInTheDocument()
  })

  it('should not render modal when closed', () => {
    render(<Modal {...defaultProps} isOpen={false} />)
    
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument()
  })

  it('should call onClose when close button is clicked', () => {
    const onClose = jest.fn()
    render(<Modal {...defaultProps} onClose={onClose} />)
    
    const closeButton = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeButton)
    
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should call onClose when overlay is clicked', () => {
    const onClose = jest.fn()
    render(<Modal {...defaultProps} onClose={onClose} />)
    
    const overlay = screen.getByTestId('modal-overlay')
    fireEvent.click(overlay)
    
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should not call onClose when modal content is clicked', () => {
    const onClose = jest.fn()
    render(<Modal {...defaultProps} onClose={onClose} />)
    
    const modalContent = screen.getByText('Modal content')
    fireEvent.click(modalContent)
    
    expect(onClose).not.toHaveBeenCalled()
  })

  it('should call onClose when Escape key is pressed', () => {
    const onClose = jest.fn()
    render(<Modal {...defaultProps} onClose={onClose} />)
    
    fireEvent.keyDown(document, { key: 'Escape' })
    
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should not call onClose on other key presses', () => {
    const onClose = jest.fn()
    render(<Modal {...defaultProps} onClose={onClose} />)
    
    fireEvent.keyDown(document, { key: 'Enter' })
    fireEvent.keyDown(document, { key: 'Tab' })
    
    expect(onClose).not.toHaveBeenCalled()
  })

  it('should render without title', () => {
    render(<Modal {...defaultProps} title={undefined} />)
    
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()
    expect(screen.getByText('Modal content')).toBeInTheDocument()
  })

  it('should apply custom size classes', () => {
    render(<Modal {...defaultProps} size="lg" />)
    
    const modalContent = screen.getByRole('dialog')
    expect(modalContent).toHaveClass('max-w-2xl')
  })

  it('should apply small size classes', () => {
    render(<Modal {...defaultProps} size="sm" />)
    
    const modalContent = screen.getByRole('dialog')
    expect(modalContent).toHaveClass('max-w-md')
  })

  it('should apply extra large size classes', () => {
    render(<Modal {...defaultProps} size="xl" />)
    
    const modalContent = screen.getByRole('dialog')
    expect(modalContent).toHaveClass('max-w-4xl')
  })

  it('should prevent body scroll when open', () => {
    render(<Modal {...defaultProps} />)
    
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('should restore body scroll when closed', () => {
    const { rerender } = render(<Modal {...defaultProps} />)
    
    rerender(<Modal {...defaultProps} isOpen={false} />)
    
    expect(document.body.style.overflow).toBe('')
  })

  it('should focus trap within modal', () => {
    render(
      <Modal {...defaultProps}>
        <button>First button</button>
        <button>Second button</button>
      </Modal>
    )
    
    const firstButton = screen.getByText('First button')
    const secondButton = screen.getByText('Second button')
    const closeButton = screen.getByRole('button', { name: /close/i })
    
    // Should focus first focusable element when opened
    expect(firstButton).toHaveFocus()
    
    // Tab should cycle through focusable elements
    fireEvent.keyDown(document.activeElement!, { key: 'Tab' })
    expect(secondButton).toHaveFocus()
    
    fireEvent.keyDown(document.activeElement!, { key: 'Tab' })
    expect(closeButton).toHaveFocus()
    
    // Tab from last element should go to first
    fireEvent.keyDown(document.activeElement!, { key: 'Tab' })
    expect(firstButton).toHaveFocus()
  })

  it('should handle Shift+Tab for reverse focus trap', () => {
    render(
      <Modal {...defaultProps}>
        <button>First button</button>
        <button>Second button</button>
      </Modal>
    )
    
    const firstButton = screen.getByText('First button')
    const closeButton = screen.getByRole('button', { name: /close/i })
    
    // Shift+Tab from first element should go to last
    fireEvent.keyDown(firstButton, { key: 'Tab', shiftKey: true })
    expect(closeButton).toHaveFocus()
  })

  it('should have proper ARIA attributes', () => {
    render(<Modal {...defaultProps} />)
    
    const modal = screen.getByRole('dialog')
    expect(modal).toHaveAttribute('aria-modal', 'true')
    expect(modal).toHaveAttribute('aria-labelledby')
  })

  it('should support custom className', () => {
    render(<Modal {...defaultProps} className="custom-modal" />)
    
    const modal = screen.getByRole('dialog')
    expect(modal).toHaveClass('custom-modal')
  })

  it('should render footer when provided', () => {
    const footer = (
      <div>
        <button>Cancel</button>
        <button>Save</button>
      </div>
    )
    
    render(<Modal {...defaultProps} footer={footer} />)
    
    expect(screen.getByText('Cancel')).toBeInTheDocument()
    expect(screen.getByText('Save')).toBeInTheDocument()
  })

  it('should handle animation classes', () => {
    render(<Modal {...defaultProps} />)
    
    const overlay = screen.getByTestId('modal-overlay')
    const modal = screen.getByRole('dialog')
    
    expect(overlay).toHaveClass('animate-fadeIn')
    expect(modal).toHaveClass('animate-slideIn')
  })

  it('should cleanup event listeners on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener')
    const { unmount } = render(<Modal {...defaultProps} />)
    
    unmount()
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
  })
})