import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Toast, { ToastContainer } from '@/components/common/Toast';
import type { Notification } from '@/types';

function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: '1',
    type: 'success',
    message: 'Operation successful',
    ...overrides,
  };
}

describe('Toast', () => {
  it('renders message text', () => {
    render(<Toast notification={makeNotification()} onClose={vi.fn()} />);
    expect(screen.getByText('Operation successful')).toBeInTheDocument();
  });

  it('has role="alert"', () => {
    render(<Toast notification={makeNotification()} onClose={vi.fn()} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('success type has bg-green-500', () => {
    render(<Toast notification={makeNotification({ type: 'success' })} onClose={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveClass('bg-green-500');
  });

  it('error type has bg-red-500', () => {
    render(<Toast notification={makeNotification({ type: 'error' })} onClose={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveClass('bg-red-500');
  });

  it('warning type has bg-orange-500', () => {
    render(<Toast notification={makeNotification({ type: 'warning' })} onClose={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveClass('bg-orange-500');
  });

  it('info type has bg-blue-500', () => {
    render(<Toast notification={makeNotification({ type: 'info' })} onClose={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveClass('bg-blue-500');
  });

  it('close button calls onClose', () => {
    const handleClose = vi.fn();
    render(<Toast notification={makeNotification()} onClose={handleClose} />);
    fireEvent.click(screen.getByLabelText('Fermer'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('action button renders when provided', () => {
    const notification = makeNotification({
      action: { label: 'Undo', onClick: vi.fn() },
    });
    render(<Toast notification={notification} onClose={vi.fn()} />);
    expect(screen.getByText('Undo')).toBeInTheDocument();
  });

  it('action button fires onClick', () => {
    const handleAction = vi.fn();
    const notification = makeNotification({
      action: { label: 'Undo', onClick: handleAction },
    });
    render(<Toast notification={notification} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('Undo'));
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  it('no action button when not provided', () => {
    render(<Toast notification={makeNotification()} onClose={vi.fn()} />);
    // Only the close button should exist (the one with aria-label="Fermer")
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveAttribute('aria-label', 'Fermer');
  });
});

describe('ToastContainer', () => {
  it('renders multiple toasts', () => {
    const notifications: Notification[] = [
      makeNotification({ id: '1', message: 'First' }),
      makeNotification({ id: '2', message: 'Second' }),
      makeNotification({ id: '3', message: 'Third' }),
    ];
    render(<ToastContainer notifications={notifications} onClose={vi.fn()} />);
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.getByText('Third')).toBeInTheDocument();
  });

  it('calls onClose with correct id', () => {
    const handleClose = vi.fn();
    const notifications: Notification[] = [
      makeNotification({ id: 'abc', message: 'Closable' }),
    ];
    render(<ToastContainer notifications={notifications} onClose={handleClose} />);
    fireEvent.click(screen.getByLabelText('Fermer'));
    expect(handleClose).toHaveBeenCalledWith('abc');
  });
});
