import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchBar from '@/components/common/SearchBar';

describe('SearchBar', () => {
  it('renders input with default placeholder', () => {
    render(<SearchBar value="" onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText('Rechercher...')).toBeInTheDocument();
  });

  it('renders input with custom placeholder', () => {
    render(<SearchBar value="" onChange={vi.fn()} placeholder="Search clients..." />);
    expect(screen.getByPlaceholderText('Search clients...')).toBeInTheDocument();
  });

  it('shows current value', () => {
    render(<SearchBar value="test query" onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText('Rechercher...')).toHaveValue('test query');
  });

  it('calls onChange when typing', () => {
    const handleChange = vi.fn();
    render(<SearchBar value="" onChange={handleChange} />);
    fireEvent.change(screen.getByPlaceholderText('Rechercher...'), {
      target: { value: 'hello' },
    });
    expect(handleChange).toHaveBeenCalledWith('hello');
  });
});
