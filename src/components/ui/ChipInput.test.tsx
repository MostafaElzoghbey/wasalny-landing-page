// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChipInput } from './ChipInput';

function setup(initial: string[] = []) {
  const onChange = vi.fn();
  render(
    <ChipInput
      label="الميزات"
      value={initial}
      onChange={onChange}
      placeholder="أضف ميزة"
      testId="chip-input"
    />,
  );
  const input = screen.getByLabelText('الميزات') as HTMLInputElement;
  return { onChange, input };
}

describe('ChipInput', () => {
  it('adds a chip when Enter is pressed', async () => {
    const user = userEvent.setup();
    const { onChange, input } = setup();
    await user.type(input, 'تكييف{Enter}');
    expect(onChange).toHaveBeenCalledWith(['تكييف']);
    expect(input.value).toBe('');
  });

  it('adds a chip when a Latin comma is typed', async () => {
    const user = userEvent.setup();
    const { onChange, input } = setup();
    await user.type(input, 'تكييف,');
    expect(onChange).toHaveBeenCalledWith(['تكييف']);
  });

  it('adds a chip when an Arabic comma (،) is typed', async () => {
    const user = userEvent.setup();
    const { onChange, input } = setup();
    await user.type(input, 'تكييف،');
    expect(onChange).toHaveBeenCalledWith(['تكييف']);
  });

  it('splits pasted comma/newline-separated text into multiple chips', () => {
    const { onChange, input } = setup();
    fireEvent.paste(input, {
      clipboardData: { getData: () => 'تكييف،مقاعد جلدية\nواي فاي' },
    });
    expect(onChange).toHaveBeenCalledWith(['تكييف', 'مقاعد جلدية', 'واي فاي']);
    expect(input.value).toBe('');
  });

  it('deletes the last chip when Backspace is pressed on an empty draft', async () => {
    const user = userEvent.setup();
    const { onChange, input } = setup(['تكييف', 'واي فاي']);
    await user.type(input, '{Backspace}');
    expect(onChange).toHaveBeenCalledWith(['تكييف']);
  });

  it('removes a chip when its × button is clicked', async () => {
    const { onChange } = setup(['تكييف', 'واي فاي']);
    fireEvent.click(screen.getByTestId('chip-remove-تكييف'));
    expect(onChange).toHaveBeenCalledWith(['واي فاي']);
  });

  it('does not add duplicate chips', async () => {
    const user = userEvent.setup();
    const { onChange, input } = setup(['تكييف']);
    await user.type(input, 'تكييف{Enter}');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders the container with dir="rtl"', () => {
    setup();
    const container = screen.getByTestId('chip-input');
    expect(container.closest('div[dir="rtl"]')).not.toBeNull();
  });
});
