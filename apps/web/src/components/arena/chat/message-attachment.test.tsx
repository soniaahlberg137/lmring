import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { FileAttachment } from '@/types/workflow';
import { MessageAttachment, MessageAttachments } from './message-attachment';

vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    className,
  }: {
    src: string;
    alt: string;
    className?: string;
    width?: number;
    height?: number;
    unoptimized?: boolean;
    // biome-ignore lint/performance/noImgElement: Mock for next/image in tests
  }) => <img src={src} alt={alt} className={className} data-testid="next-image" />,
}));

describe('MessageAttachment', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render image attachment', () => {
    const attachment: FileAttachment = {
      type: 'file',
      url: 'https://example.com/image.png',
      filename: 'image.png',
      mediaType: 'image/png',
    };

    render(<MessageAttachment data={attachment} />);

    expect(screen.getByTestId('next-image')).toHaveAttribute('src', attachment.url);
    expect(screen.getByText('image.png')).toBeInTheDocument();
  });

  it('should render non-image attachment with file icon', () => {
    const attachment: FileAttachment = {
      type: 'file',
      url: 'https://example.com/doc.pdf',
      filename: 'document.pdf',
      mediaType: 'application/pdf',
    };

    render(<MessageAttachment data={attachment} />);

    expect(screen.getByText('document.pdf')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
  });

  it('should show remove button when onRemove is provided', () => {
    const attachment: FileAttachment = {
      type: 'file',
      url: 'https://example.com/image.png',
      filename: 'image.png',
      mediaType: 'image/png',
    };

    render(<MessageAttachment data={attachment} onRemove={vi.fn()} />);

    expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
  });

  it('should call onRemove when remove button is clicked', () => {
    const onRemove = vi.fn();
    const attachment: FileAttachment = {
      type: 'file',
      url: 'https://example.com/image.png',
      filename: 'image.png',
      mediaType: 'image/png',
    };

    render(<MessageAttachment data={attachment} onRemove={onRemove} />);

    fireEvent.click(screen.getByRole('button', { name: /remove/i }));

    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('should not show remove button when onRemove is not provided', () => {
    const attachment: FileAttachment = {
      type: 'file',
      url: 'https://example.com/image.png',
      filename: 'image.png',
      mediaType: 'image/png',
    };

    render(<MessageAttachment data={attachment} />);

    expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument();
  });

  it('should render document type label', () => {
    const attachment: FileAttachment = {
      type: 'file',
      url: 'https://example.com/doc.docx',
      filename: 'doc.docx',
      mediaType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };

    render(<MessageAttachment data={attachment} />);

    expect(screen.getByText('Document')).toBeInTheDocument();
  });

  it('should render spreadsheet type label', () => {
    const attachment: FileAttachment = {
      type: 'file',
      url: 'https://example.com/data.xlsx',
      filename: 'data.xlsx',
      mediaType: 'application/vnd.ms-excel',
    };

    render(<MessageAttachment data={attachment} />);

    expect(screen.getByText('Spreadsheet')).toBeInTheDocument();
  });

  it('should render text type label', () => {
    const attachment: FileAttachment = {
      type: 'file',
      url: 'https://example.com/notes.txt',
      filename: 'notes.txt',
      mediaType: 'text/plain',
    };

    render(<MessageAttachment data={attachment} />);

    expect(screen.getByText('Text')).toBeInTheDocument();
  });

  it('should render json type label', () => {
    const attachment: FileAttachment = {
      type: 'file',
      url: 'https://example.com/data.json',
      filename: 'data.json',
      mediaType: 'application/json',
    };

    render(<MessageAttachment data={attachment} />);

    expect(screen.getByText('JSON')).toBeInTheDocument();
  });

  it('should render archive type label', () => {
    const attachment: FileAttachment = {
      type: 'file',
      url: 'https://example.com/archive.zip',
      filename: 'archive.zip',
      mediaType: 'application/zip',
    };

    render(<MessageAttachment data={attachment} />);

    expect(screen.getByText('Archive')).toBeInTheDocument();
  });

  it('should handle unknown media type', () => {
    const attachment: FileAttachment = {
      type: 'file',
      url: 'https://example.com/file.xyz',
      filename: 'file.xyz',
      mediaType: 'application/octet-stream',
    };

    render(<MessageAttachment data={attachment} />);

    expect(screen.getByText('OCTET-STREAM')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const attachment: FileAttachment = {
      type: 'file',
      url: 'https://example.com/image.png',
      filename: 'image.png',
      mediaType: 'image/png',
    };

    const { container } = render(<MessageAttachment data={attachment} className="custom-class" />);

    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('MessageAttachments', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render multiple attachments', () => {
    const attachments: FileAttachment[] = [
      {
        type: 'file',
        url: 'https://example.com/img1.png',
        filename: 'img1.png',
        mediaType: 'image/png',
      },
      {
        type: 'file',
        url: 'https://example.com/img2.jpg',
        filename: 'img2.jpg',
        mediaType: 'image/jpeg',
      },
    ];

    render(<MessageAttachments attachments={attachments} />);

    expect(screen.getByText('img1.png')).toBeInTheDocument();
    expect(screen.getByText('img2.jpg')).toBeInTheDocument();
  });

  it('should return null for empty attachments', () => {
    const { container } = render(<MessageAttachments attachments={[]} />);

    expect(container.firstChild).toBeNull();
  });

  it('should return null for null attachments', () => {
    const { container } = render(
      <MessageAttachments attachments={null as unknown as FileAttachment[]} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('should call onRemove with correct index', () => {
    const onRemove = vi.fn();
    const attachments: FileAttachment[] = [
      {
        type: 'file',
        url: 'https://example.com/img1.png',
        filename: 'img1.png',
        mediaType: 'image/png',
      },
      {
        type: 'file',
        url: 'https://example.com/img2.jpg',
        filename: 'img2.jpg',
        mediaType: 'image/jpeg',
      },
    ];

    render(<MessageAttachments attachments={attachments} onRemove={onRemove} />);

    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    const secondRemoveButton = removeButtons[1];
    expect(secondRemoveButton).toBeDefined();
    if (secondRemoveButton) {
      fireEvent.click(secondRemoveButton);
    }

    expect(onRemove).toHaveBeenCalledWith(1);
  });

  it('should apply custom className', () => {
    const attachments: FileAttachment[] = [
      {
        type: 'file',
        url: 'https://example.com/img1.png',
        filename: 'img1.png',
        mediaType: 'image/png',
      },
    ];

    const { container } = render(
      <MessageAttachments attachments={attachments} className="custom-class" />,
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
