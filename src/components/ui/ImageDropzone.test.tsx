// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImageDropzone } from './ImageDropzone';

// jsdom does not implement URL.createObjectURL / revokeObjectURL.
beforeEach(() => {
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: vi.fn(() => 'blob:mock-url'),
    revokeObjectURL: vi.fn(),
  });
});

function setup(props: Partial<Parameters<typeof ImageDropzone>[0]> = {}) {
  const onChange = vi.fn();
  render(
    <ImageDropzone
      mode="multiple"
      value={[]}
      onChange={onChange}
      testId="dropzone"
      {...props}
    />,
  );
  return { onChange };
}

function makeFile(name: string, type: string): File {
  return new File(['data'], name, { type });
}

describe('ImageDropzone', () => {
  it('adds dropped files as data URLs in multiple mode', async () => {
    const { onChange } = setup();
    const dropzone = screen.getByText('اسحب الصور أو اضغط للاختيار');
    const file = makeFile('a.png', 'image/png');
    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file] },
    });
    await new Promise((r) => setTimeout(r, 50));
    expect(onChange).toHaveBeenCalledTimes(1);
    const next = onChange.mock.calls[0][0] as string[];
    expect(next).toHaveLength(1);
    expect(next[0]).toMatch(/^data:/);
  });

  it('ignores a drop with no files', () => {
    const { onChange } = setup();
    const dropzone = screen.getByText('اسحب الصور أو اضغط للاختيار');
    fireEvent.drop(dropzone, { dataTransfer: { files: [] } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('adds a file via the file input in multiple mode', async () => {
    const { onChange } = setup();
    const input = screen.getByTestId('dropzone-file-input') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile('a.png', 'image/png')] } });
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    const next = onChange.mock.calls[0][0] as string[];
    expect(next).toHaveLength(1);
    expect(next[0]).toMatch(/^data:/);
  });

  it('removes an image when its delete button is clicked', () => {
    const { onChange } = setup({ value: ['https://a.com/1.jpg', 'https://a.com/2.jpg'] });
    fireEvent.click(screen.getByTestId('dropzone-remove-0'));
    expect(onChange).toHaveBeenCalledWith(['https://a.com/2.jpg']);
  });

  it('reorders images via the down arrow button', () => {
    const { onChange } = setup({ value: ['https://a.com/1.jpg', 'https://a.com/2.jpg'] });
    // The first preview's ↓ button moves index 0 down to index 1.
    fireEvent.click(screen.getAllByText('↓')[0]);
    expect(onChange).toHaveBeenCalledWith(['https://a.com/2.jpg', 'https://a.com/1.jpg']);
  });

  it('replaces the single image in single mode', async () => {
    const { onChange } = setup({ mode: 'single', value: 'https://a.com/old.jpg' });
    const input = screen.getByTestId('dropzone-file-input') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile('new.png', 'image/png')] } });
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    const next = onChange.mock.calls[0][0] as string;
    expect(next).toMatch(/^data:/);
  });

  it('shows an error for an unsupported file type', async () => {
    const { onChange } = setup();
    const input = screen.getByTestId('dropzone-file-input') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile('a.pdf', 'application/pdf')] } });
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders no URL input', () => {
    setup();
    expect(screen.queryByTestId('dropzone-url-input')).toBeNull();
    expect(screen.queryByPlaceholderText('إضافة رابط')).toBeNull();
  });

  it('accepts twelve images in a single selection with no limit alert', async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <ImageDropzone
        mode="multiple"
        value={[]}
        onChange={onChange}
        testId="dropzone"
      />,
    );
    expect(screen.queryByText(/حتى\s*\d+\s*صور/)).toBeNull();
    const files = Array.from({ length: 12 }, (_, i) => makeFile(`img-${i}.png`, 'image/png'));
    const input = screen.getByTestId('dropzone-file-input') as HTMLInputElement;
    fireEvent.change(input, { target: { files } });
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    const next = onChange.mock.calls[0][0] as string[];
    expect(next).toHaveLength(12);
    rerender(
      <ImageDropzone
        mode="multiple"
        value={next}
        onChange={onChange}
        testId="dropzone"
      />,
    );
    expect(screen.getAllByAltText('صورة')).toHaveLength(12);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByText(/حتى\s*\d+\s*صور/)).toBeNull();
  });
});
