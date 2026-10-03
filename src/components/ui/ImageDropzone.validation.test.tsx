// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImageDropzone, MAX_FILE_BYTES, MAX_FILE_MB } from './ImageDropzone';

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
    <ImageDropzone mode="multiple" value={[]} onChange={onChange} testId="dropzone" {...props} />,
  );
  return { onChange };
}

function bigFile(name: string, type: string, bytes: number): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

describe('ImageDropzone hardening matrix (RED first)', () => {
  it('rejects a file over the cap in single mode with Arabic error naming the cap', async () => {
    const onChange = vi.fn();
    render(<ImageDropzone mode="single" value="" onChange={onChange} testId="dropzone" />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = bigFile('big.png', 'image/png', MAX_FILE_BYTES + 1);
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert').textContent).toContain(`${MAX_FILE_MB}MB`);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('rejects a file over the cap via drag-drop in multiple mode', async () => {
    const { onChange } = setup();
    const dropzone = screen.getByText('اسحب الصور أو اضغط للاختيار');
    fireEvent.drop(dropzone, { dataTransfer: { files: [bigFile('big.png', 'image/png', MAX_FILE_BYTES + 1)] } });
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(onChange).not.toHaveBeenCalled();
  });

  it('accepts a file just under the cap', async () => {
    const { onChange } = setup();
    const dropzone = screen.getByText('اسحب الصور أو اضغط للاختيار');
    fireEvent.drop(dropzone, { dataTransfer: { files: [bigFile('ok.png', 'image/png', MAX_FILE_BYTES)] } });
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('rejects wrong-MIME file with Arabic error and keeps valid ones', async () => {
    const { onChange } = setup();
    const dropzone = screen.getByText('اسحب الصور أو اضغط للاختيار');
    const bad = new File(['x'], 'a.pdf', { type: 'application/pdf' });
    const good = new File(['y'], 'ok.png', { type: 'image/png' });
    fireEvent.drop(dropzone, { dataTransfer: { files: [bad, good] } });
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(onChange).toHaveBeenCalledTimes(1);
    const next = onChange.mock.calls[0][0] as string[];
    expect(next).toHaveLength(1);
    expect(next[0]).toMatch(/^data:/);
  });
});
