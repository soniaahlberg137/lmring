import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './index';

describe('Select', () => {
  it('renders trigger', () => {
    render(
      <Select>
        <SelectTrigger data-testid="trigger">
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
      </Select>
    );
    expect(screen.getByTestId('trigger')).toBeInTheDocument();
  });

  it('renders with open state', () => {
    render(
      <Select open>
        <SelectTrigger>
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });
});

describe('SelectTrigger', () => {
  it('renders as combobox', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
      </Select>
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <Select>
        <SelectTrigger className="custom-class" data-testid="trigger">
          <SelectValue />
        </SelectTrigger>
      </Select>
    );
    expect(screen.getByTestId('trigger')).toHaveClass('custom-class');
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <Select>
        <SelectTrigger ref={ref}>
          <SelectValue />
        </SelectTrigger>
      </Select>
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('applies default styles', () => {
    render(
      <Select>
        <SelectTrigger data-testid="trigger">
          <SelectValue />
        </SelectTrigger>
      </Select>
    );
    expect(screen.getByTestId('trigger')).toHaveClass('flex', 'items-center', 'justify-between');
  });

  it('renders chevron icon', () => {
    const { container } = render(
      <Select>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
      </Select>
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});

describe('SelectValue', () => {
  it('renders placeholder', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
      </Select>
    );
    expect(screen.getByText('Select an option')).toBeInTheDocument();
  });
});

describe('SelectContent', () => {
  it('renders when open', () => {
    render(
      <Select open>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <Select open>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="custom-content">
          <SelectItem value="1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByRole('listbox')).toHaveClass('custom-content');
  });
});

describe('SelectItem', () => {
  it('renders option', () => {
    render(
      <Select open>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="test">Test Option</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByRole('option')).toBeInTheDocument();
    expect(screen.getByText('Test Option')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <Select open>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="test" className="custom-item">Test</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByRole('option')).toHaveClass('custom-item');
  });

  it('can be disabled', () => {
    render(
      <Select open>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="test" disabled>Disabled</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByRole('option')).toHaveAttribute('data-disabled');
  });
});

describe('SelectGroup', () => {
  it('groups items', () => {
    render(
      <Select open>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Fruits</SelectLabel>
            <SelectItem value="apple">Apple</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    );
    expect(screen.getByRole('group')).toBeInTheDocument();
  });
});

describe('SelectLabel', () => {
  it('renders label', () => {
    render(
      <Select open>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Category</SelectLabel>
            <SelectItem value="1">Item 1</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    );
    expect(screen.getByText('Category')).toBeInTheDocument();
  });
});

describe('SelectSeparator', () => {
  it('is exported', () => {
    expect(SelectSeparator).toBeDefined();
    expect(typeof SelectSeparator).toBe('object');
  });
});

describe('Select exports', () => {
  it('exports all components', () => {
    expect(Select).toBeDefined();
    expect(SelectGroup).toBeDefined();
    expect(SelectValue).toBeDefined();
    expect(SelectTrigger).toBeDefined();
    expect(SelectContent).toBeDefined();
    expect(SelectLabel).toBeDefined();
    expect(SelectItem).toBeDefined();
    expect(SelectSeparator).toBeDefined();
    expect(SelectScrollUpButton).toBeDefined();
    expect(SelectScrollDownButton).toBeDefined();
  });
});
