import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './index';

describe('DropdownMenu', () => {
  it('renders trigger', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
      </DropdownMenu>
    );
    expect(screen.getByText('Menu')).toBeInTheDocument();
  });

  it('renders content when open', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });
});

describe('DropdownMenuTrigger', () => {
  it('renders as button by default', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Click me</DropdownMenuTrigger>
      </DropdownMenu>
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders asChild', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <span data-testid="custom">Custom trigger</span>
        </DropdownMenuTrigger>
      </DropdownMenu>
    );
    expect(screen.getByTestId('custom')).toBeInTheDocument();
  });
});

describe('DropdownMenuContent', () => {
  it('renders when open', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent className="custom-menu">
          <DropdownMenuItem>Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expect(screen.getByRole('menu')).toHaveClass('custom-menu');
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent ref={ref}>
          <DropdownMenuItem>Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('DropdownMenuItem', () => {
  it('renders menu item', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Action</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expect(screen.getByRole('menuitem')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem className="custom-item">Action</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expect(screen.getByRole('menuitem')).toHaveClass('custom-item');
  });

  it('supports inset prop', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem inset>Inset Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expect(screen.getByRole('menuitem')).toHaveClass('pl-8');
  });

  it('can be disabled', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem disabled>Disabled</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expect(screen.getByRole('menuitem')).toHaveAttribute('data-disabled');
  });
});

describe('DropdownMenuCheckboxItem', () => {
  it('renders checkbox item', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem>Check me</DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expect(screen.getByRole('menuitemcheckbox')).toBeInTheDocument();
  });

  it('can be checked', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem checked>Checked</DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expect(screen.getByRole('menuitemcheckbox')).toHaveAttribute('data-state', 'checked');
  });
});

describe('DropdownMenuRadioGroup', () => {
  it('renders radio group', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup value="1">
            <DropdownMenuRadioItem value="1">Option 1</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="2">Option 2</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expect(screen.getByRole('group')).toBeInTheDocument();
    expect(screen.getAllByRole('menuitemradio')).toHaveLength(2);
  });
});

describe('DropdownMenuLabel', () => {
  it('renders label', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuItem>Profile</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expect(screen.getByText('My Account')).toBeInTheDocument();
  });

  it('supports inset prop', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel inset data-testid="label">Label</DropdownMenuLabel>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expect(screen.getByTestId('label')).toHaveClass('pl-8');
  });
});

describe('DropdownMenuSeparator', () => {
  it('renders separator', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
          <DropdownMenuSeparator data-testid="separator" />
          <DropdownMenuItem>Item 2</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expect(screen.getByTestId('separator')).toBeInTheDocument();
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });
});

describe('DropdownMenuShortcut', () => {
  it('renders shortcut text', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            Copy
            <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expect(screen.getByText('⌘C')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            Copy
            <DropdownMenuShortcut className="custom-shortcut" data-testid="shortcut">
              ⌘C
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expect(screen.getByTestId('shortcut')).toHaveClass('custom-shortcut');
  });
});

describe('DropdownMenu exports', () => {
  it('exports all components', () => {
    expect(DropdownMenu).toBeDefined();
    expect(DropdownMenuTrigger).toBeDefined();
    expect(DropdownMenuContent).toBeDefined();
    expect(DropdownMenuItem).toBeDefined();
    expect(DropdownMenuCheckboxItem).toBeDefined();
    expect(DropdownMenuRadioItem).toBeDefined();
    expect(DropdownMenuLabel).toBeDefined();
    expect(DropdownMenuSeparator).toBeDefined();
    expect(DropdownMenuShortcut).toBeDefined();
    expect(DropdownMenuGroup).toBeDefined();
    expect(DropdownMenuPortal).toBeDefined();
    expect(DropdownMenuSub).toBeDefined();
    expect(DropdownMenuSubContent).toBeDefined();
    expect(DropdownMenuSubTrigger).toBeDefined();
    expect(DropdownMenuRadioGroup).toBeDefined();
  });
});
