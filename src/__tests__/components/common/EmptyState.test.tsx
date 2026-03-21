import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EmptyState from '@/components/common/EmptyState';

describe('EmptyState', () => {
  it('renders title as h3', () => {
    render(<EmptyState title="No items found" />);
    const heading = screen.getByRole('heading', { level: 3, name: 'No items found' });
    expect(heading).toBeInTheDocument();
  });

  it('shows description when provided', () => {
    render(<EmptyState title="No items" description="Try adding a new item" />);
    expect(screen.getByText('Try adding a new item')).toBeInTheDocument();
  });

  it('no description element when not provided', () => {
    const { container } = render(<EmptyState title="No items" />);
    // Only the h3 should exist, no <p> tag
    expect(container.querySelector('p')).toBeNull();
  });

  it('shows action button with label', () => {
    const handleClick = vi.fn();
    render(
      <EmptyState title="No items" action={{ label: 'Add item', onClick: handleClick }} />,
    );
    expect(screen.getByRole('button', { name: 'Add item' })).toBeInTheDocument();
  });

  it('action button fires onClick', () => {
    const handleClick = vi.fn();
    render(
      <EmptyState title="No items" action={{ label: 'Add item', onClick: handleClick }} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add item' }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('no button when no action', () => {
    render(<EmptyState title="No items" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(<EmptyState title="No items" icon={<span data-testid="custom-icon">Icon</span>} />);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });
});
