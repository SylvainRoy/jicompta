import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Loading from '@/components/common/Loading';

describe('Loading', () => {
  it('renders spinner with role="status"', () => {
    render(<Loading />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('default size is md (has w-10 h-10)', () => {
    render(<Loading />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('w-10');
    expect(spinner).toHaveClass('h-10');
  });

  it('small size has w-6 h-6', () => {
    render(<Loading size="sm" />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('w-6');
    expect(spinner).toHaveClass('h-6');
  });

  it('large size has w-16 h-16', () => {
    render(<Loading size="lg" />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('w-16');
    expect(spinner).toHaveClass('h-16');
  });

  it('shows message when provided', () => {
    render(<Loading message="Loading data..." />);
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('no message element when not provided', () => {
    const { container } = render(<Loading />);
    expect(container.querySelector('p')).toBeNull();
  });

  it('full screen mode wraps in fixed overlay (has fixed inset-0)', () => {
    const { container } = render(<Loading fullScreen />);
    const overlay = container.firstElementChild as HTMLElement;
    expect(overlay).toHaveClass('fixed');
    expect(overlay).toHaveClass('inset-0');
  });
});
