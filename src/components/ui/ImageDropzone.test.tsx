// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('adds a valid URL via the URL input', async () => {
    const user = userEvent.setup();
    const { onChange } = setup();
    const urlInput = screen.getByTestId('dropzone-url-input');
    await user.type(urlInput, 'https://example.com/a.jpg');
    fireEvent.click(screen.getByTestId('dropzone-url-add'));
    expect(onChange).toHaveBeenCalledWith(['https://example.com/a.jpg']);
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

  it('replaces the single image in single mode', () => {
    const { onChange } = setup({ mode: 'single', value: 'https://a.com/old.jpg' });
    const urlInput = screen.getByTestId('dropzone-url-input');
    fireEvent.change(urlInput, { target: { value: 'https://a.com/new.png' } });
    fireEvent.click(screen.getByTestId('dropzone-url-add'));
    expect(onChange).toHaveBeenCalledWith('https://a.com/new.png');
  });

  it('shows an error for an invalid URL', async () => {
    const user = userEvent.setup();
    const { onChange } = setup();
    const urlInput = screen.getByTestId('dropzone-url-input');
    await user.type(urlInput, 'not-a-url');
    fireEvent.click(screen.getByTestId('dropzone-url-add'));
    // No valid URL is added — the value stays empty.
    expect(onChange).toHaveBeenCalledWith([]);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
