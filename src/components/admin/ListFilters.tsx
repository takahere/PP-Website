'use client'

import { useState, useCallback, useEffect } from 'react'
import { Search, X } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface FilterOption {
  value: string
  label: string
}

export interface FilterConfig {
  key: string
  label: string
  options: FilterOption[]
}

interface ListFiltersProps {
  filters: FilterConfig[]
  onFilterChange: (filters: Record<string, string>) => void
  onSearchChange: (search: string) => void
  searchPlaceholder?: string
  initialFilters?: Record<string, string>
  initialSearch?: string
}

export function ListFilters({
  filters,
  onFilterChange,
  onSearchChange,
  searchPlaceholder = 'タイトルで検索...',
  initialFilters = {},
  initialSearch = '',
}: ListFiltersProps) {
  const [search, setSearch] = useState(initialSearch)
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>(initialFilters)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search, onSearchChange])

  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      const newFilters = { ...activeFilters }
      if (value === 'all') {
        delete newFilters[key]
      } else {
        newFilters[key] = value
      }
      setActiveFilters(newFilters)
      onFilterChange(newFilters)
    },
    [activeFilters, onFilterChange]
  )

  const clearAllFilters = useCallback(() => {
    setSearch('')
    setActiveFilters({})
    onSearchChange('')
    onFilterChange({})
  }, [onSearchChange, onFilterChange])

  const hasActiveFilters = search || Object.keys(activeFilters).length > 0

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 pr-9"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Dropdowns */}
      {filters.map((filter) => (
        <Select
          key={filter.key}
          value={activeFilters[filter.key] || 'all'}
          onValueChange={(value) => handleFilterChange(filter.key, value)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={filter.label} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべての{filter.label}</SelectItem>
            {filter.options.map((option, index) => (
              <SelectItem key={`${option.value}-${index}`} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}

      {/* Clear Button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="text-muted-foreground"
        >
          <X className="mr-1 h-4 w-4" />
          クリア
        </Button>
      )}
    </div>
  )
}

// Utility function to filter items based on filters and search
export function filterItems<T extends Record<string, unknown>>(
  items: T[],
  filters: Record<string, string>,
  search: string,
  searchFields: (keyof T)[],
  filterFieldMap: Record<string, keyof T>
): T[] {
  return items.filter((item) => {
    // Check search
    if (search) {
      const searchLower = search.toLowerCase()
      const matchesSearch = searchFields.some((field) => {
        const value = item[field]
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchLower)
        }
        if (Array.isArray(value)) {
          return value.some(
            (v) => typeof v === 'string' && v.toLowerCase().includes(searchLower)
          )
        }
        return false
      })
      if (!matchesSearch) return false
    }

    // Check filters
    for (const [filterKey, filterValue] of Object.entries(filters)) {
      const field = filterFieldMap[filterKey]
      if (!field) continue

      const itemValue = item[field]

      // Handle boolean fields (like is_published)
      if (filterKey === 'status') {
        const isPublished = filterValue === 'published'
        if (itemValue !== isPublished) return false
        continue
      }

      // Handle array fields (like categories)
      if (Array.isArray(itemValue)) {
        if (!itemValue.includes(filterValue)) return false
        continue
      }

      // Handle string fields
      if (typeof itemValue === 'string') {
        if (itemValue !== filterValue) return false
        continue
      }
    }

    return true
  })
}

