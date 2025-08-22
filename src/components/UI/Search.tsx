import React, { useEffect, useState } from "react";
import { FaMagnifyingGlass, FaCircleXmark } from "react-icons/fa6";
import "./Search.scss";

interface Props {
  onSearch: (query: string) => void;
  placeholder?: string;
  initialValue?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  clearOnSearch?: boolean;
}

const SearchBar: React.FC<Props> = ({
  onSearch,
  placeholder = "Qidirish...",
  initialValue = "",
  disabled,
  autoFocus,
  className = "",
  clearOnSearch = false,
}) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleSearch = () => {
    const q = value.trim();
    onSearch(q);
    if (clearOnSearch) setValue("");
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleClear = () => {
    setValue("");
    onSearch("");
  };

  return (
    <div className={`searchbar ${className}`}>
      <input
        className="searchbar__input"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
      />
      {value && !disabled && (
        <button
          type="button"
          className="searchbar__btn searchbar__btn--clear"
          onClick={handleClear}
          aria-label="Tozalash"
          title="Tozalash"
        >
          <FaCircleXmark />
        </button>
      )}
      <button
        type="button"
        className="searchbar__btn searchbar__btn--search"
        onClick={handleSearch}
        disabled={disabled}
        aria-label="Qidirish"
        title="Qidirish"
      >
        <FaMagnifyingGlass />
      </button>
    </div>
  );
};

export default SearchBar;
