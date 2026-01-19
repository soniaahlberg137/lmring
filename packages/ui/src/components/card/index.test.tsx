import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './index';

describe('Card', () => {
  it('renders with children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Card ref={ref}>Card content</Card>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('applies custom className', () => {
    render(<Card className="custom-class">Card content</Card>);
    expect(screen.getByText('Card content')).toHaveClass('custom-class');
  });

  it('applies default styles', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toHaveClass('rounded-xl', 'border', 'shadow');
  });
});

describe('CardHeader', () => {
  it('renders with children', () => {
    render(<CardHeader>Header content</CardHeader>);
    expect(screen.getByText('Header content')).toBeInTheDocument();
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(<CardHeader ref={ref}>Header content</CardHeader>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('applies custom className', () => {
    render(<CardHeader className="custom-class">Header content</CardHeader>);
    expect(screen.getByText('Header content')).toHaveClass('custom-class');
  });
});

describe('CardTitle', () => {
  it('renders with children', () => {
    render(<CardTitle>Title</CardTitle>);
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Title');
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLHeadingElement>();
    render(<CardTitle ref={ref}>Title</CardTitle>);
    expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
  });

  it('applies custom className', () => {
    render(<CardTitle className="custom-class">Title</CardTitle>);
    expect(screen.getByText('Title')).toHaveClass('custom-class');
  });

  it('applies default styles', () => {
    render(<CardTitle>Title</CardTitle>);
    expect(screen.getByText('Title')).toHaveClass('font-semibold');
  });
});

describe('CardDescription', () => {
  it('renders with children', () => {
    render(<CardDescription>Description text</CardDescription>);
    expect(screen.getByText('Description text')).toBeInTheDocument();
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLParagraphElement>();
    render(<CardDescription ref={ref}>Description text</CardDescription>);
    expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
  });

  it('applies custom className', () => {
    render(<CardDescription className="custom-class">Description text</CardDescription>);
    expect(screen.getByText('Description text')).toHaveClass('custom-class');
  });

  it('applies default styles', () => {
    render(<CardDescription>Description text</CardDescription>);
    expect(screen.getByText('Description text')).toHaveClass('text-sm', 'text-muted-foreground');
  });
});

describe('CardContent', () => {
  it('renders with children', () => {
    render(<CardContent>Content area</CardContent>);
    expect(screen.getByText('Content area')).toBeInTheDocument();
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(<CardContent ref={ref}>Content area</CardContent>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('applies custom className', () => {
    render(<CardContent className="custom-class">Content area</CardContent>);
    expect(screen.getByText('Content area')).toHaveClass('custom-class');
  });
});

describe('CardFooter', () => {
  it('renders with children', () => {
    render(<CardFooter>Footer content</CardFooter>);
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(<CardFooter ref={ref}>Footer content</CardFooter>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('applies custom className', () => {
    render(<CardFooter className="custom-class">Footer content</CardFooter>);
    expect(screen.getByText('Footer content')).toHaveClass('custom-class');
  });

  it('applies default styles', () => {
    render(<CardFooter>Footer content</CardFooter>);
    expect(screen.getByText('Footer content')).toHaveClass('flex', 'items-center');
  });
});

describe('Card composition', () => {
  it('renders complete card structure', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card description goes here</CardDescription>
        </CardHeader>
        <CardContent>Main content</CardContent>
        <CardFooter>Footer actions</CardFooter>
      </Card>
    );

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Card Title');
    expect(screen.getByText('Card description goes here')).toBeInTheDocument();
    expect(screen.getByText('Main content')).toBeInTheDocument();
    expect(screen.getByText('Footer actions')).toBeInTheDocument();
  });
});
