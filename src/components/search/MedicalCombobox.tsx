import { useEffect, useRef, useState, useId, type KeyboardEvent } from 'react';
import { getSearchClient } from '../../lib/search/client';
import type { SearchDataset, SearchResultItem } from '../../lib/search/types';
import { t, type Locale } from '../../lib/i18n';

type Props = {
  id?: string;
  label: string;
  dataset: SearchDataset;
  locale: Locale;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSelect: (item: SearchResultItem) => void;
  placeholder?: string;
  hint?: string;
};

/**
 * Accessible combobox for ICD-10/CID-10 conditions and medication
 * formulations. Implements the WAI-ARIA "combobox with list autocomplete"
 * pattern: role="combobox" on the input, a referenced role="listbox" of
 * role="option" suggestions, roving aria-activedescendant, and a live
 * region that announces result counts and selections to screen readers.
 * Free text is always accepted — suggestions are optional shortcuts that
 * also fill in the ICD-10 code / medication catalog id.
 */
export function MedicalCombobox({
  id,
  label,
  dataset,
  locale,
  inputValue,
  onInputChange,
  onSelect,
  placeholder,
  hint,
}: Props) {
  const generatedId = useId();
  const baseId = id ?? generatedId;
  const listboxId = `${baseId}-listbox`;
  const hintId = hint ? `${baseId}-hint` : undefined;

  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const requestToken = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = ++requestToken.current;
    if (!inputValue.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    getSearchClient()
      .search(dataset, inputValue, locale)
      .then((items) => {
        if (requestToken.current !== token || items === null) return;
        setResults(items);
        setLoading(false);
        setActiveIndex(items.length > 0 ? 0 : -1);
      });
  }, [inputValue, dataset, locale]);

  useEffect(() => {
    function onDocPointerDown(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('pointerdown', onDocPointerDown);
    return () => document.removeEventListener('pointerdown', onDocPointerDown);
  }, []);

  const showList = open && inputValue.trim().length > 0;
  const activeOptionId =
    activeIndex >= 0 && results[activeIndex] ? `${listboxId}-option-${activeIndex}` : undefined;

  const handleSelect = (item: SearchResultItem) => {
    onSelect(item);
    setOpen(false);
    setResults([]);
    setActiveIndex(-1);
    setAnnouncement(t(locale, 'search.selected', { label: item.label }));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!showList || results.length === 0) {
      if (event.key === 'ArrowDown' && inputValue.trim()) setOpen(true);
      return;
    }
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((index) => (index + 1) % results.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((index) => (index <= 0 ? results.length - 1 : index - 1));
        break;
      case 'Enter':
        if (activeIndex >= 0 && results[activeIndex]) {
          event.preventDefault();
          handleSelect(results[activeIndex]);
        }
        break;
      case 'Escape':
        if (showList) {
          event.preventDefault();
          setOpen(false);
        }
        break;
      case 'Tab':
        setOpen(false);
        break;
      default:
        break;
    }
  };

  const statusMessage = loading
    ? t(locale, 'search.loading')
    : showList
      ? results.length > 0
        ? t(locale, 'search.resultsCount', { count: results.length })
        : t(locale, 'search.noResults')
      : '';

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1">
      <label htmlFor={baseId} className="font-semibold">
        {label}
      </label>
      <input
        id={baseId}
        type="text"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={activeOptionId}
        aria-describedby={hintId}
        autoComplete="off"
        spellCheck={false}
        className="min-h-11 w-full rounded-md border-2 border-cadence-border bg-white px-3 text-cadence-text"
        placeholder={placeholder}
        value={inputValue}
        onChange={(event) => {
          onInputChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (inputValue.trim()) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
      />
      {hint ? (
        <p id={hintId} className="text-sm text-cadence-muted">
          {hint}
        </p>
      ) : null}
      <div role="status" aria-live="polite" className="sr-only">
        {announcement || statusMessage}
      </div>
      {showList ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={label}
          className="absolute top-full z-10 mt-1 max-h-64 w-full overflow-auto rounded-md border-2 border-cadence-border bg-white shadow-lg"
        >
          {results.length === 0 ? (
            <li className="px-3 py-3 text-cadence-muted">
              {loading ? t(locale, 'search.loading') : t(locale, 'search.noResults')}
            </li>
          ) : (
            results.map((item, index) => (
              <li
                key={item.value}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                className={`flex min-h-11 cursor-pointer flex-col justify-center gap-0.5 px-3 py-2 ${
                  index === activeIndex ? 'bg-cadence-primary/10' : ''
                }`}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => {
                  event.preventDefault();
                  handleSelect(item);
                }}
              >
                <span className="font-semibold text-cadence-text">{item.label}</span>
                <span className="text-sm text-cadence-muted">{item.sublabel}</span>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
