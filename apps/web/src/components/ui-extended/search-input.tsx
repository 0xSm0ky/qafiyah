'use client';

import { Search, X } from 'lucide-react';
import {
  type ChangeEventHandler,
  type KeyboardEventHandler,
  type MouseEventHandler,
  useRef,
} from 'react';

import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { MAX_QUERY_LENGTH } from '@qafiyah/config';

type Props = {
  readonly inputValue: string;
  readonly validationError: string | null;
  readonly searchLabel: string;
  readonly onKeyDown: KeyboardEventHandler<HTMLInputElement>;
  readonly onInputChange: ChangeEventHandler<HTMLInputElement>;
  readonly onInputBlur: () => void;
  readonly onClearInput: () => void;
  readonly onSearch: () => void;
  readonly hasQueryToShow: boolean;
  readonly placeholder: string;
};

const preventInputBlur: MouseEventHandler = (event) => {
  event.preventDefault();
};

export function SearchInput({
  inputValue,
  validationError,
  searchLabel,
  onKeyDown,
  onInputChange,
  onInputBlur,
  onClearInput,
  onSearch,
  placeholder,
  hasQueryToShow,
}: Props) {
  const wasFocusedRef = useRef(false);

  const handleInputMouseDown: MouseEventHandler<HTMLInputElement> = (event) => {
    wasFocusedRef.current = event.currentTarget === document.activeElement;
  };

  const handleInputClick: MouseEventHandler<HTMLInputElement> = (event) => {
    if (wasFocusedRef.current) return;
    const el = event.currentTarget;
    if (el.value.length > 0 && el.selectionStart === 0 && el.selectionEnd === 0) {
      const end = el.value.length;
      el.setSelectionRange(end, end);
    }
  };

  return (
    <div tabIndex={-1} className="w-full">
      <div tabIndex={-1} className={cn('mb-2 flex h-4 items-center justify-between')}>
        {validationError !== null && (
          <p tabIndex={-1} className={cn('text-right text-xs text-danger md:text-base')}>
            {validationError}
          </p>
        )}
      </div>
      <div tabIndex={-1} className="relative">
        <Input
          tabIndex={0}
          placeholder={placeholder}
          maxLength={MAX_QUERY_LENGTH}
          value={inputValue}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          autoSave="off"
          spellCheck={false}
          onChange={onInputChange}
          onKeyDown={onKeyDown}
          onBlur={onInputBlur}
          onMouseDown={handleInputMouseDown}
          onClick={handleInputClick}
          enterKeyHint="search"
          aria-label={searchLabel}
          className={cn(
            'h-12 rounded-none border-0 border-b border-border bg-transparent pr-14 pl-14 text-right shadow-none ring-0 transition-colors placeholder:text-text-subtle focus-visible:border-text focus-visible:ring-0 focus-visible:outline-none md:text-lg',
            { 'border-danger focus-visible:border-danger': validationError }
          )}
          dir="rtl"
        />
        <IconButton
          onClick={onSearch}
          aria-label={searchLabel}
          className="absolute top-1/2 right-2 -translate-y-1/2"
        >
          <Search className="h-5 w-5" aria-hidden="true" />
        </IconButton>
        {hasQueryToShow && (
          <div tabIndex={-1} className="absolute top-1/2 left-2 flex -translate-y-1/2 items-center">
            <IconButton
              tabIndex={0}
              onMouseDown={preventInputBlur}
              onClick={onClearInput}
              aria-label="مسح البحث"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </IconButton>
          </div>
        )}
      </div>
    </div>
  );
}
