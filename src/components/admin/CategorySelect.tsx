'use client'

import { useState, useMemo } from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export interface Category {
  id: string
  slug: string
  name: string
}

interface CategorySelectProps {
  categories: Category[]
  selectedCategories: string[]
  onChange: (categories: string[]) => void
  disabled?: boolean
}

// カテゴリー名をクリーンアップ（|PartnerLab|パートナーラボ などを削除）
// 形式: "KPI|PartnerLab" → "KPI"
// 複数のパイプ文字に対応: | (通常), ｜ (全角), │ (罫線文字)
function cleanCategoryName(name: string): string {
  if (!name) return name
  
  // パイプ（半角・全角・罫線）で分割して最初の部分を取得
  const parts = name.split(/[|｜│]/)
  const firstPart = parts[0]?.trim()
  
  // 最初の部分が有効な場合はそれを返す
  if (firstPart) {
    return firstPart
  }
  
  return name
}

// ユニークなカテゴリー名のリストを取得
function getUniqueCategories(categories: Category[]): { original: string; display: string }[] {
  const seen = new Set<string>()
  const result: { original: string; display: string }[] = []

  for (const cat of categories) {
    const displayName = cleanCategoryName(cat.name)
    if (!seen.has(displayName)) {
      seen.add(displayName)
      result.push({
        original: cat.name,
        display: displayName,
      })
    }
  }

  return result.sort((a, b) => a.display.localeCompare(b.display, 'ja'))
}

export function CategorySelect({
  categories,
  selectedCategories,
  onChange,
  disabled = false,
}: CategorySelectProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  // ユニークなカテゴリーリストを作成
  const uniqueCategories = useMemo(
    () => getUniqueCategories(categories),
    [categories]
  )

  // 選択されたカテゴリーの表示名を取得
  const getDisplayName = (categoryName: string): string => {
    return cleanCategoryName(categoryName)
  }

  // カテゴリーを選択/解除
  const toggleCategory = (categoryName: string) => {
    const displayName = cleanCategoryName(categoryName)
    
    // 既に選択されているかチェック（表示名で比較）
    const isSelected = selectedCategories.some(
      (selected) => cleanCategoryName(selected) === displayName
    )

    if (isSelected) {
      // 解除
      onChange(
        selectedCategories.filter(
          (selected) => cleanCategoryName(selected) !== displayName
        )
      )
    } else {
      // 追加（オリジナル名を使用）
      onChange([...selectedCategories, categoryName])
    }
  }

  // カテゴリーを削除
  const removeCategory = (categoryName: string) => {
    const displayName = cleanCategoryName(categoryName)
    onChange(
      selectedCategories.filter(
        (selected) => cleanCategoryName(selected) !== displayName
      )
    )
  }

  // 検索でフィルタリング
  const filteredCategories = useMemo(() => {
    if (!searchValue) return uniqueCategories
    const lowerSearch = searchValue.toLowerCase()
    return uniqueCategories.filter((cat) =>
      cat.display.toLowerCase().includes(lowerSearch)
    )
  }, [uniqueCategories, searchValue])

  // 選択されているかチェック
  const isSelected = (displayName: string): boolean => {
    return selectedCategories.some(
      (selected) => cleanCategoryName(selected) === displayName
    )
  }

  return (
    <div className="space-y-3">
      {/* 選択されたカテゴリー表示 */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCategories.map((category) => (
            <Badge
              key={category}
              variant="secondary"
              className="pl-2 pr-1 py-1 gap-1"
            >
              {getDisplayName(category)}
              <button
                type="button"
                onClick={() => removeCategory(category)}
                className="ml-1 rounded-full hover:bg-gray-300 p-0.5"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* オートコンプリート選択 */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {selectedCategories.length > 0
              ? `${selectedCategories.length}件選択中`
              : 'カテゴリーを選択...'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="カテゴリーを検索..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>カテゴリーが見つかりません</CommandEmpty>
              <CommandGroup>
                {filteredCategories.map((cat) => (
                  <CommandItem
                    key={cat.original}
                    value={cat.display}
                    onSelect={() => toggleCategory(cat.original)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        isSelected(cat.display) ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {cat.display}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedCategories.length === 0 && (
        <p className="text-xs text-muted-foreground">
          クリックしてカテゴリーを選択してください
        </p>
      )}
    </div>
  )
}

