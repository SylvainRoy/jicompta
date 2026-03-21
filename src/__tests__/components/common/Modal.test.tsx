import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Modal, { ConfirmModal } from '@/components/common/Modal';

describe('Modal', () => {
  it('renders nothing when isOpen=false', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={vi.fn()} title="Test Modal">
        <p>Body content</p>
      </Modal>,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders title and children when isOpen=true', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
        <p>Body content</p>
      </Modal>,
    );
    expect(screen.getByRole('heading', { level: 3, name: 'Test Modal' })).toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('close button calls onClose', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test">
        <p>Content</p>
      </Modal>,
    );
    fireEvent.click(screen.getByLabelText('Close modal'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('Escape key calls onClose', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test">
        <p>Content</p>
      </Modal>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('backdrop click calls onClose', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test">
        <p>Content</p>
      </Modal>,
    );
    const backdrop = document.querySelector('[aria-hidden="true"]') as HTMLElement;
    fireEvent.click(backdrop);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('renders footer when provided', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test" footer={<button>Save</button>}>
        <p>Content</p>
      </Modal>,
    );
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('size sm has max-w-md class', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test" size="sm">
        <p>Content</p>
      </Modal>,
    );
    const modalPanel = screen.getByRole('heading', { level: 3 }).closest('.relative');
    expect(modalPanel).toHaveClass('max-w-md');
  });

  it('size lg has max-w-2xl class', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test" size="lg">
        <p>Content</p>
      </Modal>,
    );
    const modalPanel = screen.getByRole('heading', { level: 3 }).closest('.relative');
    expect(modalPanel).toHaveClass('max-w-2xl');
  });
});

describe('ConfirmModal', () => {
  it('shows message', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Confirm"
        message="Are you sure?"
      />,
    );
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('cancel button calls onClose', () => {
    const handleClose = vi.fn();
    render(
      <ConfirmModal
        isOpen={true}
        onClose={handleClose}
        onConfirm={vi.fn()}
        title="Confirm"
        message="Are you sure?"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('confirm button calls onConfirm', () => {
    const handleConfirm = vi.fn();
    render(
      <ConfirmModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={handleConfirm}
        title="Confirm"
        message="Are you sure?"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer' }));
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it('custom button text', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Delete"
        message="Delete this item?"
        confirmText="Supprimer"
        cancelText="Non"
      />,
    );
    expect(screen.getByRole('button', { name: 'Supprimer' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Non' })).toBeInTheDocument();
  });
});
