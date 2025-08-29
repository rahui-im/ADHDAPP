import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../Button'

describe('Button', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>)
    
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeInTheDocument()
  })

  it('should handle click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled button</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('should not call onClick when disabled', () => {
    const handleClick = jest.fn()
    render(<Button disabled onClick={handleClick}>Disabled button</Button>)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('should apply primary variant styles', () => {
    render(<Button variant="primary">Primary button</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-blue-600')
  })

  it('should apply secondary variant styles', () => {
    render(<Button variant="secondary">Secondary button</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-gray-200')
  })

  it('should apply danger variant styles', () => {
    render(<Button variant="danger">Danger button</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-red-600')
  })

  it('should apply small size styles', () => {
    render(<Button size="sm">Small button</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm')
  })

  it('should apply large size styles', () => {
    render(<Button size="lg">Large button</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('px-6', 'py-3', 'text-lg')
  })

  it('should show loading state', () => {
    render(<Button loading>Loading button</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveTextContent('Loading button')
    
    // Should have loading spinner
    const spinner = button.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('should render with icon', () => {
    const TestIcon = () => <span data-testid="test-icon">Icon</span>
    render(<Button icon={<TestIcon />}>Button with icon</Button>)
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
    expect(screen.getByText('Button with icon')).toBeInTheDocument()
  })

  it('should render icon only button', () => {
    const TestIcon = () => <span data-testid="test-icon">Icon</span>
    render(<Button icon={<TestIcon />} />)
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    render(<Button className="custom-class">Custom button</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  it('should forward ref correctly', () => {
    const ref = jest.fn()
    render(<Button ref={ref}>Button with ref</Button>)
    
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLButtonElement))
  })

  it('should support different button types', () => {
    render(<Button type="submit">Submit button</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('type', 'submit')
  })

  it('should have proper accessibility attributes', () => {
    render(<Button aria-label="Accessible button">Button</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Accessible button')
  })

  it('should handle keyboard navigation', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Keyboard button</Button>)
    
    const button = screen.getByRole('button')
    button.focus()
    
    fireEvent.keyDown(button, { key: 'Enter' })
    expect(handleClick).toHaveBeenCalledTimes(1)
    
    fireEvent.keyDown(button, { key: ' ' })
    expect(handleClick).toHaveBeenCalledTimes(2)
  })

  it('should not trigger click on other keys', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Keyboard button</Button>)
    
    const button = screen.getByRole('button')
    fireEvent.keyDown(button, { key: 'Escape' })
    
    expect(handleClick).not.toHaveBeenCalled()
  })
})