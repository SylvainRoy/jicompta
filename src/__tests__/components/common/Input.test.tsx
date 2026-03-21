import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Input from '@/components/common/Input';

describe('Input', () => {
  it('renders input element', () => {
    render(<Input placeholder="test" />);
    expect(screen.getByPlaceholderText('test')).toBeInTheDocument();
  });

  it('shows label text when provided', () => {
    render(<Input label="Email" placeholder="test" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('shows required asterisk when label and required', () => {
    render(<Input label="Name" required placeholder="test" />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('shows error message', () => {
    render(<Input error="This field is required" placeholder="test" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('input has error border class (border-red-500) when error', () => {
    render(<Input error="Error" placeholder="test" />);
    const input = screen.getByPlaceholderText('test');
    expect(input.className).toContain('border-red-500');
  });

  it('shows helper text', () => {
    render(<Input helperText="Enter your email" placeholder="test" />);
    expect(screen.getByText('Enter your email')).toBeInTheDocument();
  });

  it('helper text hidden when error is shown', () => {
    render(<Input helperText="Helper" error="Error" placeholder="test" />);
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.queryByText('Helper')).not.toBeInTheDocument();
  });

  it('passes through props (placeholder, type, value)', () => {
    render(<Input placeholder="Enter email" type="email" value="test@example.com" readOnly />);
    const input = screen.getByPlaceholderText('Enter email');
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveValue('test@example.com');
  });

  it('fires onChange', () => {
    const handleChange = vi.fn();
    render(<Input placeholder="test" onChange={handleChange} />);
    fireEvent.change(screen.getByPlaceholderText('test'), { target: { value: 'hello' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });
});
