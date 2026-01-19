import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from './index';

// Mock framer-motion for CommandDialog (uses Dialog which uses framer-motion)
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, className, ...props }: { children?: React.ReactNode; className?: string; [key: string]: unknown }) => (
      <div className={className} {...props}>{children}</div>
    ),
  },
}));

describe('Command', () => {
  it('renders with children', () => {
    render(
      <Command data-testid="command">
        <CommandInput placeholder="Search..." />
        <CommandList>
          <CommandItem>Item 1</CommandItem>
        </CommandList>
      </Command>
    );
    expect(screen.getByTestId('command')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <Command className="custom-command" data-testid="command">
        <CommandList>
          <CommandItem>Item</CommandItem>
        </CommandList>
      </Command>
    );
    expect(screen.getByTestId('command')).toHaveClass('custom-command');
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Command ref={ref}>
        <CommandList>
          <CommandItem>Item</CommandItem>
        </CommandList>
      </Command>
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('applies default styles', () => {
    render(
      <Command data-testid="command">
        <CommandList>
          <CommandItem>Item</CommandItem>
        </CommandList>
      </Command>
    );
    expect(screen.getByTestId('command')).toHaveClass('flex', 'flex-col', 'overflow-hidden');
  });
});

describe('CommandInput', () => {
  it('renders input', () => {
    render(
      <Command>
        <CommandInput placeholder="Type to search..." />
      </Command>
    );
    expect(screen.getByPlaceholderText('Type to search...')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <Command>
        <CommandInput className="custom-input" placeholder="Search" />
      </Command>
    );
    expect(screen.getByPlaceholderText('Search')).toHaveClass('custom-input');
  });

  it('renders search icon', () => {
    const { container } = render(
      <Command>
        <CommandInput placeholder="Search" />
      </Command>
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});

describe('CommandList', () => {
  it('renders list', () => {
    render(
      <Command>
        <CommandList data-testid="list">
          <CommandItem>Item</CommandItem>
        </CommandList>
      </Command>
    );
    expect(screen.getByTestId('list')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <Command>
        <CommandList className="custom-list" data-testid="list">
          <CommandItem>Item</CommandItem>
        </CommandList>
      </Command>
    );
    expect(screen.getByTestId('list')).toHaveClass('custom-list');
  });
});

describe('CommandEmpty', () => {
  it('renders empty state', () => {
    render(
      <Command>
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
        </CommandList>
      </Command>
    );
    expect(screen.getByText('No results found.')).toBeInTheDocument();
  });
});

describe('CommandGroup', () => {
  it('renders group with heading', () => {
    render(
      <Command>
        <CommandList>
          <CommandGroup heading="Suggestions">
            <CommandItem>Calendar</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    );
    expect(screen.getByText('Suggestions')).toBeInTheDocument();
    expect(screen.getByText('Calendar')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <Command>
        <CommandList>
          <CommandGroup className="custom-group" data-testid="group" heading="Group">
            <CommandItem>Item</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    );
    expect(screen.getByTestId('group')).toHaveClass('custom-group');
  });
});

describe('CommandItem', () => {
  it('renders item', () => {
    render(
      <Command>
        <CommandList>
          <CommandItem>Action</CommandItem>
        </CommandList>
      </Command>
    );
    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <Command>
        <CommandList>
          <CommandItem className="custom-item" data-testid="item">Item</CommandItem>
        </CommandList>
      </Command>
    );
    expect(screen.getByTestId('item')).toHaveClass('custom-item');
  });

  it('can be disabled', () => {
    render(
      <Command>
        <CommandList>
          <CommandItem disabled data-testid="item">Disabled</CommandItem>
        </CommandList>
      </Command>
    );
    expect(screen.getByTestId('item')).toHaveAttribute('data-disabled', 'true');
  });
});

describe('CommandSeparator', () => {
  it('renders separator', () => {
    render(
      <Command>
        <CommandList>
          <CommandItem>Item 1</CommandItem>
          <CommandSeparator data-testid="separator" />
          <CommandItem>Item 2</CommandItem>
        </CommandList>
      </Command>
    );
    expect(screen.getByTestId('separator')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <Command>
        <CommandList>
          <CommandSeparator className="custom-sep" data-testid="separator" />
        </CommandList>
      </Command>
    );
    expect(screen.getByTestId('separator')).toHaveClass('custom-sep');
  });
});

describe('CommandShortcut', () => {
  it('renders shortcut', () => {
    render(
      <Command>
        <CommandList>
          <CommandItem>
            Settings
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandList>
      </Command>
    );
    expect(screen.getByText('⌘S')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <Command>
        <CommandList>
          <CommandItem>
            Settings
            <CommandShortcut className="custom-shortcut" data-testid="shortcut">⌘S</CommandShortcut>
          </CommandItem>
        </CommandList>
      </Command>
    );
    expect(screen.getByTestId('shortcut')).toHaveClass('custom-shortcut');
  });
});

describe('Command exports', () => {
  it('exports all components', () => {
    expect(Command).toBeDefined();
    expect(CommandDialog).toBeDefined();
    expect(CommandInput).toBeDefined();
    expect(CommandList).toBeDefined();
    expect(CommandEmpty).toBeDefined();
    expect(CommandGroup).toBeDefined();
    expect(CommandItem).toBeDefined();
    expect(CommandShortcut).toBeDefined();
    expect(CommandSeparator).toBeDefined();
  });
});
