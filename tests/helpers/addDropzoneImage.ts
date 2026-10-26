import { expect } from 'vitest';
import { fireEvent, waitFor, within } from '@testing-library/react';

export async function addDropzoneImage(scope: HTMLElement, testId: string, fileName = 'a.jpg'): Promise<void> {
  const input = within(scope).getByTestId(`${testId}-file-input`) as HTMLInputElement;
  fireEvent.change(input, { target: { files: [new File(['data'], fileName, { type: 'image/jpeg' })] } });
  await waitFor(() => expect(scope.querySelector('img[src^="data:"]')).toBeTruthy());
}
