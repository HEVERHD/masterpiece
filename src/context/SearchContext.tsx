"use client";

import { createContext, useContext, useState } from "react";

interface SearchCtx {
  search: string;
  setSearch: (v: string) => void;
}

const SearchContext = createContext<SearchCtx>({ search: "", setSearch: () => {} });

export function SearchProvider({
  children,
  initialSearch = "",
}: {
  children: React.ReactNode;
  initialSearch?: string;
}) {
  const [search, setSearch] = useState(initialSearch);
  return (
    <SearchContext.Provider value={{ search, setSearch }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  return useContext(SearchContext);
}
