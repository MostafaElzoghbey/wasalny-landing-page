// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImageDropzone } from './ImageDropzone';

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
  it('rejects oversized 12MB png in single mode with Arabic error (bug: accepted)', async () => {
    const onChange = vi.fn();
    render(<ImageDropzone mode="single" value="" onChange={onChange} testId="dropzone" />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = bigFile('big.png', 'image/png', 12 * 1024 * 1024);
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(onChange).not.toHaveBeenCalled();
  });

  it('rejects oversized 12MB png via drag-drop in multiple mode (bug: accepted)', async () => {
    const { onChange } = setup();
    const dropzone = screen.getByText('اسحب الصور أو اضغط للاختيار');
    fireEvent.drop(dropzone, { dataTransfer: { files: [bigFile('big.png', 'image/png', 12 * 1024 * 1024)] } });
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(onChange).not.toHaveBeenCalled();
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
