'use client'

import { useMemo } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import Placeholder from '@tiptap/extension-placeholder'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'

import { EditorToolbar } from './EditorToolbar'

// lowlightインスタンスの作成（一般的な言語をサポート）
const lowlight = createLowlight(common)

// 拡張機能をモジュールレベルで定義してReact Strict Modeでの重複を防ぐ
const configuredLink = Link.configure({
  openOnClick: false,
  HTMLAttributes: {
    class: 'text-blue-600 underline hover:text-blue-800',
  },
})

const configuredImage = Image.configure({
  HTMLAttributes: {
    class: 'max-w-full h-auto rounded-lg',
  },
})

const configuredTable = Table.configure({
  resizable: true,
  HTMLAttributes: {
    class: 'border-collapse table-auto w-full',
  },
})

const configuredTableHeader = TableHeader.configure({
  HTMLAttributes: {
    class: 'border border-gray-300 bg-gray-100 px-4 py-2 text-left font-semibold',
  },
})

const configuredTableCell = TableCell.configure({
  HTMLAttributes: {
    class: 'border border-gray-300 px-4 py-2',
  },
})

const configuredCodeBlock = CodeBlockLowlight.configure({
  lowlight,
  HTMLAttributes: {
    class: 'bg-gray-900 text-gray-100 rounded-lg p-4 my-4 overflow-x-auto',
  },
})

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  disabled?: boolean
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = '本文を入力...',
  disabled = false,
}: RichTextEditorProps) {
  // 拡張機能をuseMemoで管理（placeholderが変わった場合のみ再生成）
  const extensions = useMemo(() => [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3, 4],
      },
      codeBlock: false,
    }),
    Underline,
    configuredLink,
    configuredImage,
    configuredTable,
    TableRow,
    configuredTableHeader,
    configuredTableCell,
    configuredCodeBlock,
    Placeholder.configure({
      placeholder,
      emptyEditorClass: 'is-editor-empty',
    }),
  ], [placeholder])

  const editor = useEditor({
    immediatelyRender: false, // SSR対応
    extensions,
    content,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[300px] px-4 py-3',
      },
    },
  })

  return (
    <div className="rich-text-editor rounded-md border bg-white">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}

