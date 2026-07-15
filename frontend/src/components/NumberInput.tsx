import cn from 'classnames';
import { useRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import Icon from './Icon.js';

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'step'> {
  increment: number;
  decreaseLabel: string;
  increaseLabel: string;
}

export default function NumberInput({ className, increment, decreaseLabel, increaseLabel, onBlur, onKeyDown, ...props }: NumberInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function setValue(value: number | string) {
    const input = inputRef.current;
    if (!input) return;
    const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    if (!valueSetter) return;
    valueSetter.call(input, String(value));
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function step(direction: 'stepUp' | 'stepDown') {
    const input = inputRef.current;
    if (!input || input.disabled) return;
    const current = Number.isNaN(input.valueAsNumber) ? 0 : input.valueAsNumber;
    const min = input.min ? Number(input.min) : -Infinity;
    const max = input.max ? Number(input.max) : Infinity;
    const next = roundMoney(Math.min(max, Math.max(min, current + (direction === 'stepUp' ? increment : -increment))));
    setValue(next);
    input.focus();
  }

  function normalize() {
    const input = inputRef.current;
    if (!input || Number.isNaN(input.valueAsNumber)) return;
    const value = input.valueAsNumber;
    const rounded = roundMoney(value).toFixed(2);
    if (input.value !== rounded) setValue(rounded);
  }

  return (
    <div className="relative" data-input-surface>
      <input
        ref={inputRef}
        type="number"
        step="any"
        className={cn('pr-8', className)}
        onBlur={(event) => {
          normalize();
          onBlur?.(event);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return;
          event.preventDefault();
          step(event.key === 'ArrowUp' ? 'stepUp' : 'stepDown');
        }}
        {...props}
      />
      <div className="absolute inset-y-px right-px flex w-7 flex-col overflow-hidden rounded-r-[7px]" data-number-stepper>
        <button type="button" className="flex flex-1 items-center justify-center border border-transparent hover:border-hairline hover:bg-accent-soft focus:outline-none focus-visible:border-hairline focus-visible:bg-accent-soft" onClick={() => step('stepUp')} aria-label={increaseLabel}>
          <Icon src="caret-up" type="black" className="h-2.5 w-2.5" title="" />
        </button>
        <button type="button" className="flex flex-1 items-center justify-center border border-transparent hover:border-hairline hover:bg-accent-soft focus:outline-none focus-visible:border-hairline focus-visible:bg-accent-soft" onClick={() => step('stepDown')} aria-label={decreaseLabel}>
          <Icon src="caret-down" type="black" className="h-2.5 w-2.5" title="" />
        </button>
      </div>
    </div>
  );
}
