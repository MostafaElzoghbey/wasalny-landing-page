// @vitest-environment jsdom
// RED contract for the brand-identity panel.
//
// Implementation target: `export function IdentityAdmin()` from
// `src/admin/IdentityAdmin.tsx` — flat, next to FaqAdmin.tsx / ContentAdmin.tsx.
// (Named export, not default: every admin panel in this folder is a named export
// and components/AGENTS.md lists default exports as an anti-pattern.)
//
// The panel owns the `mockupImages` content key: an ordered list of brand-identity
// image URLs persisted whole-array through
// `adminGetContent('mockupImages')` / `adminUpdateContent('mockupImages', urls)`
// (src/data/api.ts:201-211), the same singleton load/save seam ContentAdmin uses
// for `contactInfo`.
//
// Images are never addressed by typed URL: admins work with the shared
// `ImageDropzone` primitive, exactly like the cars panel. New images are staged
// in a multiple-mode dropzone and appended on submit; an expanded row swaps its
// own image through a single-mode dropzone. ImageDropzone already owns the
// size / mime guards and emits compressed data URLs.
//
// Test-id contract asserted below:
//   identity-card-{i}  identity-expand-{i}  identity-delete-{i}
//   identity-delete-confirm-{i}  identity-move-up-{i}  identity-move-down-{i}
//   identity-add  identity-save  identity-cancel
//   identity-upload-create  identity-upload-create-file-input
//   identity-upload-edit-{i}  identity-upload-edit-{i}-file-input
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { adminGetContent, adminUpdateContent } from '@/data/api';
import { useReorderAnimation } from '@/hooks/useReorderAnimation';
import { IdentityAdmin } from './IdentityAdmin';
import { MAX_FILE_BYTES } from '@/components/ui/ImageDropzone';

const { mockCapture, mockRef } = vi.hoisted(() => ({
  mockCapture: vi.fn(),
  mockRef: { current: null },
}));

vi.mock('@/data/api', () => ({
  adminGetContent: vi.fn(),
  adminUpdateContent: vi.fn(),
}));

vi.mock('@/hooks/useReorderAnimation', () => ({
  useReorderAnimation: vi.fn(() => ({ ref: mockRef, capture: mockCapture })),
  useExpandCollapse: vi.fn(() => ({ current: null })),
}));

const CONTENT_KEY = 'mockupImages';

const INITIAL: string[] = [
  '/assets/images/mockups/identity-a.jpeg',
  '/assets/images/mockups/identity-b.jpeg',
  '/assets/images/mockups/identity-c.jpeg',
];

const DATA_URL = /^data:image\/png;base64,/;

function fileOf(name: string, type: string, bytes: number): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

/** First rendered image src inside row `index` — the observable identity of that row. */
function rowSrc(index: number): string | null {
  const img = screen.getByTestId(`identity-card-${index}`).querySelector('img');
  return img ? img.getAttribute('src') : null;
}

/** The staging dropzone that adds new identity images. */
function createFileInput(): HTMLInputElement {
  return screen.getByTestId('identity-upload-create-file-input');
}

/** The per-row dropzone that swaps the image of an expanded row. */
function editFileInput(index: number): HTMLInputElement {
  return screen.getByTestId(`identity-upload-edit-${index}-file-input`);
}

/** Drop a valid image into the staging dropzone and wait for its data URL preview. */
async function stageImage(name = 'identity-d.png'): Promise<void> {
  fireEvent.change(createFileInput(), {
    target: { files: [fileOf(name, 'image/png', 512)] },
  });
  // FileReader is async — wait for the data URL itself, not just the preview node,
  // otherwise a later click can race the read.
  await waitFor(() => {
    const img = screen.getByTestId('dropzone-preview-0').querySelector('img');
    expect(img?.getAttribute('src')).toMatch(DATA_URL);
  });
}

/** Drop a valid image into an expanded row's dropzone and wait for its data URL. */
async function stageRowImage(index: number, name: string): Promise<void> {
  fireEvent.change(editFileInput(index), {
    target: { files: [fileOf(name, 'image/png', 512)] },
  });
  // The row dropzone already previews the current image, so presence proves nothing.
  await waitFor(() => {
    const img = screen
      .getByTestId(`identity-edit-${index}-dropzone-preview-0`)
      .querySelector('img');
    expect(img?.getAttribute('src')).toMatch(DATA_URL);
  });
}

async function renderPanel(): Promise<void> {
  render(<IdentityAdmin />);
  await screen.findByTestId('identity-card-0');
}

beforeEach(() => {
  vi.mocked(useReorderAnimation).mockClear();
  mockCapture.mockClear();
  vi.mocked(adminGetContent).mockResolvedValue([...INITIAL]);
  vi.mocked(adminUpdateContent).mockResolvedValue(undefined);
});

describe('IdentityAdmin brand-identity image panel', () => {
  it('loads the mockupImages content key on mount and renders one row per image', async () => {
    await renderPanel();

    expect(adminGetContent).toHaveBeenCalledWith(CONTENT_KEY);
    expect(screen.getByTestId('identity-card-2')).toBeInTheDocument();
    expect(screen.queryByTestId('identity-card-3')).toBeNull();
    expect(rowSrc(0)).toBe(INITIAL[0]);
  });

  it('renders the row controls, the add control and a dropzone instead of a URL field', async () => {
    await renderPanel();

    for (const index of [0, 1, 2]) {
      expect(screen.getByTestId(`identity-card-${index}`)).toBeInTheDocument();
      expect(screen.getByTestId(`identity-expand-${index}`)).toBeInTheDocument();
      expect(screen.getByTestId(`identity-move-up-${index}`)).toBeInTheDocument();
      expect(screen.getByTestId(`identity-move-down-${index}`)).toBeInTheDocument();
      expect(screen.getByTestId(`identity-delete-${index}`)).toBeInTheDocument();
    }
    expect(screen.getByTestId('identity-add')).toBeInTheDocument();
    expect(screen.getByTestId('identity-upload-create')).toBeInTheDocument();
    // Admins never type an image URL — no text input for one may exist.
    expect(screen.queryByTestId('identity-url-input')).toBeNull();
    expect(screen.queryByTestId('identity-url-edit-0')).toBeNull();
  });

  it('expanding a row reveals the shared image swap form with save and cancel', async () => {
    await renderPanel();
    expect(screen.queryByTestId('identity-save')).toBeNull();

    fireEvent.click(screen.getByTestId('identity-expand-0'));

    expect(screen.getByTestId('identity-upload-edit-0')).toBeInTheDocument();
    expect(screen.getByTestId('identity-save')).toBeInTheDocument();
    expect(screen.getByTestId('identity-cancel')).toBeInTheDocument();
  });

  it('cancel discards a staged image swap without persisting anything', async () => {
    await renderPanel();
    fireEvent.click(screen.getByTestId('identity-expand-0'));
    await stageRowImage(0, 'identity-a-v2.png');

    fireEvent.click(screen.getByTestId('identity-cancel'));

    expect(adminUpdateContent).not.toHaveBeenCalled();
    expect(rowSrc(0)).toBe(INITIAL[0]);
  });

  it('add appends the staged dropped image and persists the extended array', async () => {
    await renderPanel();
    await stageImage();

    fireEvent.click(screen.getByTestId('identity-add'));

    await waitFor(() => {
      expect(adminUpdateContent).toHaveBeenCalledWith(CONTENT_KEY, [
        ...INITIAL,
        expect.stringMatching(DATA_URL),
      ]);
    });
    await waitFor(() => expect(rowSrc(3)).toMatch(DATA_URL));
  });

  it('clears the staging dropzone after a successful add', async () => {
    await renderPanel();
    await stageImage();

    fireEvent.click(screen.getByTestId('identity-add'));

    await waitFor(() => expect(screen.queryByTestId('identity-card-3')).toBeInTheDocument());
    expect(screen.queryByTestId('dropzone-preview-0')).toBeNull();
  });

  it('save persists the swapped image of the expanded row', async () => {
    await renderPanel();
    fireEvent.click(screen.getByTestId('identity-expand-0'));
    await stageRowImage(0, 'identity-a-v2.png');

    fireEvent.click(screen.getByTestId('identity-save'));

    await waitFor(() => {
      expect(adminUpdateContent).toHaveBeenCalledWith(CONTENT_KEY, [
        expect.stringMatching(DATA_URL),
        INITIAL[1],
        INITIAL[2],
      ]);
    });
  });

  it('delete is two-step and drops the row at that index once confirmed', async () => {
    await renderPanel();

    fireEvent.click(screen.getByTestId('identity-delete-1'));
    expect(screen.queryByTestId('identity-delete-confirm-1')).toBeInTheDocument();
    expect(adminUpdateContent).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('identity-delete-confirm-1'));

    await waitFor(() => {
      expect(adminUpdateContent).toHaveBeenCalledWith(CONTENT_KEY, [INITIAL[0], INITIAL[2]]);
    });
    await waitFor(() => expect(screen.queryByTestId('identity-card-2')).toBeNull());
    expect(rowSrc(1)).toBe(INITIAL[2]);
  });

  it('move-down persists the reordered array and shows the new row order', async () => {
    await renderPanel();

    fireEvent.click(screen.getByTestId('identity-move-down-0'));

    await waitFor(() => {
      expect(adminUpdateContent).toHaveBeenCalledWith(CONTENT_KEY, [
        INITIAL[1],
        INITIAL[0],
        INITIAL[2],
      ]);
    });
    await waitFor(() => expect(rowSrc(0)).toBe(INITIAL[1]));
  });

  it('move-up persists the reordered array and shows the new row order', async () => {
    await renderPanel();

    fireEvent.click(screen.getByTestId('identity-move-up-2'));

    await waitFor(() => {
      expect(adminUpdateContent).toHaveBeenCalledWith(CONTENT_KEY, [
        INITIAL[0],
        INITIAL[2],
        INITIAL[1],
      ]);
    });
    await waitFor(() => expect(rowSrc(2)).toBe(INITIAL[1]));
  });

  it('restores the previous row order and surfaces an error when a reorder persist rejects', async () => {
    vi.mocked(adminUpdateContent).mockRejectedValueOnce(new Error('reorder rejected'));
    await renderPanel();

    fireEvent.click(screen.getByTestId('identity-move-down-0'));

    await waitFor(() => expect(screen.getAllByRole('alert').length).toBeGreaterThan(0));
    expect(rowSrc(0)).toBe(INITIAL[0]);
  });

  it('rejects an oversized identity upload with an Arabic size error and persists nothing', async () => {
    await renderPanel();

    fireEvent.change(createFileInput(), {
      target: { files: [fileOf('oversized.png', 'image/png', MAX_FILE_BYTES + 1)] },
    });

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert').textContent).toMatch(/حجم/);
    expect(adminUpdateContent).not.toHaveBeenCalled();
  });

  it('rejects an unsupported mime upload with an Arabic format error and persists nothing', async () => {
    await renderPanel();

    fireEvent.change(createFileInput(), {
      target: { files: [fileOf('brand-guide.pdf', 'application/pdf', 1024)] },
    });

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert').textContent).toMatch(/غير مدعومة/);
    expect(adminUpdateContent).not.toHaveBeenCalled();
  });

  it('guards an add with no staged image instead of appending a blank entry', async () => {
    await renderPanel();

    fireEvent.click(screen.getByTestId('identity-add'));

    await waitFor(() => expect(screen.getAllByRole('alert').length).toBeGreaterThan(0));
    expect(adminUpdateContent).not.toHaveBeenCalled();
    expect(screen.queryByTestId('identity-card-3')).toBeNull();
  });

  it('guards a save with no image instead of persisting a blank entry', async () => {
    await renderPanel();
    fireEvent.click(screen.getByTestId('identity-expand-0'));
    fireEvent.click(screen.getByTestId('identity-edit-0-dropzone-remove-0'));

    fireEvent.click(screen.getByTestId('identity-save'));

    await waitFor(() => expect(screen.getAllByRole('alert').length).toBeGreaterThan(0));
    expect(adminUpdateContent).not.toHaveBeenCalled();
    expect(rowSrc(0)).toBe(INITIAL[0]);
  });
});