import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ImagePreviews, ModeChip, PromptInputFeatureButtons } from './prompt-input-features';

vi.mock('@/hooks/use-translations', () => ({
  useTranslations: () => (key: string) => key,
}));

const { toastMock } = vi.hoisted(() => ({
  toastMock: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));
vi.mock('sonner', () => ({ toast: toastMock }));

const { promptContextMock } = vi.hoisted(() => ({
  promptContextMock: vi.fn(),
}));

vi.mock('./prompt-input', () => ({
  usePromptInput: () => promptContextMock(),
}));

describe('prompt-input-features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('triggers file input click via upload button', () => {
    const addImages = vi.fn();
    promptContextMock.mockReturnValue({
      mode: 'default',
      setMode: vi.fn(),
      uploadedImages: [],
      addImages,
      isLoading: false,
      disabled: false,
    });

    const { container } = render(<PromptInputFeatureButtons />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, 'click');

    const buttons = screen.getAllByRole('button');
    const uploadButton = buttons[0];
    if (uploadButton) fireEvent.click(uploadButton);

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('shows toast error for oversized files and calls addImages', () => {
    const addImages = vi.fn();
    promptContextMock.mockReturnValue({
      mode: 'default',
      setMode: vi.fn(),
      uploadedImages: [],
      addImages,
      isLoading: false,
      disabled: false,
    });

    const { container } = render(<PromptInputFeatureButtons />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    const file = new File(['x'], 'big.png', { type: 'image/png' });
    Object.defineProperty(file, 'size', { configurable: true, value: 11 * 1024 * 1024 });

    fireEvent.change(input, { target: { files: [file] } });

    expect(toastMock.error).toHaveBeenCalledWith('Arena.image_too_large');
    expect(addImages).toHaveBeenCalledWith([file]);
  });

  it('toggles search and image generation modes', () => {
    const setMode = vi.fn();
    promptContextMock.mockReturnValue({
      mode: 'default',
      setMode,
      uploadedImages: [],
      addImages: vi.fn(),
      isLoading: false,
      disabled: false,
    });

    render(<PromptInputFeatureButtons />);
    const buttons = screen.getAllByRole('button');

    const searchButton = buttons[1];
    if (searchButton) fireEvent.click(searchButton);
    expect(setMode).toHaveBeenCalledWith('search');

    const imageButton = buttons[2];
    if (imageButton) fireEvent.click(imageButton);
    expect(setMode).toHaveBeenCalledWith('imageGenerate');
  });

  it('ModeChip renders and clears non-default modes', () => {
    const setMode = vi.fn();
    promptContextMock.mockReturnValue({ mode: 'search', setMode });

    render(<ModeChip />);
    expect(screen.getByText('Arena.web_search')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Arena.clear_mode' }));
    expect(setMode).toHaveBeenCalledWith('default');
  });

  it('ImagePreviews renders images and removes them', () => {
    const removeImage = vi.fn();
    promptContextMock.mockReturnValue({
      uploadedImages: [
        {
          id: 'img-1',
          file: new File(['x'], 'a.png', { type: 'image/png' }),
          previewUrl: 'blob:a',
          filename: 'a.png',
          size: 1,
          isUploading: false,
        },
      ],
      removeImage,
      isRemovingImage: null,
    });

    render(<ImagePreviews />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove a.png' }));
    expect(removeImage).toHaveBeenCalledWith('img-1');
  });
});
