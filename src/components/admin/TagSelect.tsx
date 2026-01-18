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

export interface Tag {
  id: string
  slug: string
  name: string
}

interface TagSelectProps {
  tags: Tag[]
  selectedTags: string[]
  onChange: (tags: string[]) => void
  disabled?: boolean
}

export function TagSelect({
  tags,
  selectedTags,
  onChange,
  disabled = false,
}: TagSelectProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  // ユニークなタグリストを作成（名前でソート）
  const uniqueTags = useMemo(() => {
    const seen = new Set<string>()
    const result: Tag[] = []

    for (const tag of tags) {
      if (!seen.has(tag.name)) {
        seen.add(tag.name)
        result.push(tag)
      }
    }

    return result.sort((a, b) => a.name.localeCompare(b.name, 'ja'))
  }, [tags])

  // タグを選択/解除
  const toggleTag = (tagName: string) => {
    const isSelected = selectedTags.includes(tagName)

    if (isSelected) {
      onChange(selectedTags.filter((t) => t !== tagName))
    } else {
      onChange([...selectedTags, tagName])
    }
  }

  // タグを削除
  const removeTag = (tagName: string) => {
    onChange(selectedTags.filter((t) => t !== tagName))
  }

  // 検索でフィルタリング
  const filteredTags = useMemo(() => {
    if (!searchValue) return uniqueTags
    const lowerSearch = searchValue.toLowerCase()
    return uniqueTags.filter((tag) =>
      tag.name.toLowerCase().includes(lowerSearch)
    )
  }, [uniqueTags, searchValue])

  // 選択されているかチェック
  const isSelected = (tagName: string): boolean => {
    return selectedTags.includes(tagName)
  }

  return (
    <div className="space-y-3">
      {/* 選択されたタグ表示 */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="pl-2 pr-1 py-1 gap-1"
            >
              #{tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
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
            {selectedTags.length > 0
              ? `${selectedTags.length}件選択中`
              : 'タグを選択...'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="タグを検索..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>タグが見つかりません</CommandEmpty>
              <CommandGroup>
                {filteredTags.map((tag) => (
                  <CommandItem
                    key={tag.id}
                    value={tag.name}
                    onSelect={() => toggleTag(tag.name)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        isSelected(tag.name) ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    #{tag.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedTags.length === 0 && (
        <p className="text-xs text-muted-foreground">
          クリックしてタグを選択してください
        </p>
      )}
    </div>
  )
}







