import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './index';

describe('Collapsible', () => {
  it('renders with children', () => {
    render(
      <Collapsible>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    );
    expect(screen.getByRole('button')).toHaveTextContent('Toggle');
  });

  it('toggles content visibility when clicked', () => {
    render(
      <Collapsible>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Hidden content</CollapsibleContent>
      </Collapsible>
    );

    expect(screen.queryByText('Hidden content')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Hidden content')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button'));
    expect(screen.queryByText('Hidden content')).not.toBeInTheDocument();
  });

  it('starts open when defaultOpen is true', () => {
    render(
      <Collapsible defaultOpen>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Visible content</CollapsibleContent>
      </Collapsible>
    );

    expect(screen.getByText('Visible content')).toBeInTheDocument();
  });

  it('can be controlled with open prop', () => {
    const { rerender } = render(
      <Collapsible open={false}>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Controlled content</CollapsibleContent>
      </Collapsible>
    );

    expect(screen.queryByText('Controlled content')).not.toBeInTheDocument();

    rerender(
      <Collapsible open>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Controlled content</CollapsibleContent>
      </Collapsible>
    );

    expect(screen.getByText('Controlled content')).toBeInTheDocument();
  });

  it('calls onOpenChange when toggled', () => {
    const handleOpenChange = vi.fn();
    render(
      <Collapsible onOpenChange={handleOpenChange}>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    );

    fireEvent.click(screen.getByRole('button'));
    expect(handleOpenChange).toHaveBeenCalledWith(true);
  });

  it('can be disabled', () => {
    render(
      <Collapsible disabled>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    );

    expect(screen.getByRole('button')).toBeDisabled();
  });
});

describe('CollapsibleTrigger', () => {
  it('renders as a button', () => {
    render(
      <Collapsible>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
      </Collapsible>
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});

describe('CollapsibleContent', () => {
  it('renders content when open', () => {
    render(
      <Collapsible defaultOpen>
        <CollapsibleContent>Content here</CollapsibleContent>
      </Collapsible>
    );
    expect(screen.getByText('Content here')).toBeInTheDocument();
  });
});
