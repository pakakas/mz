---
name: mz-pretty
description: Pretty-printing MarkZero (ADN) payloads with indentation and alignment for human readability.
---

# MZ Pretty Print

MarkZero payloads can be rendered in a human-readable "pretty" format with indentation and alignment while preserving the exact same token structure when parsed by AI.

## Rules

1. **Grid start** (`ⓖ`) on its own line, no indent
2. **Rows** (`ʀ`) indented with 3 spaces after the first row
3. **Column headers** (`ᴄ`) on the first row after `ⓖ`
4. **Row separator** (`¦`) and **relation binder** (`→`) aligned with spaces
5. **Title** (`★`) on its own line before the grid
6. **Protocol start** (`ⓟ`) on its own line
7. **Grid refs** (`※`) and **value refs** (`¤`) unchanged

## Examples

### Map (Key-Value)
**Compact:**
```
ⓖ ʀ file → src/main.0 ʀ span → ※0
```
**Pretty:**
```
ⓖ ʀ file → src/main.0
   ʀ span → ※0
```

### Table (Grid with Headers)
**Compact:**
```
ⓖ ᴄ type ¦ pos ¦ text ʀ insert ¦ 124 ¦ let
```
**Pretty:**
```
ⓖ ᴄ type   ¦ pos ¦ text
   ʀ insert ¦ 124 ¦ let
```

### ToolCall (PAP)
**Compact:**
```
ⓟⓖ ʀ pattern → "const" ʀ files → ※0 ★ ToolCall ⓖ ʀ cmd → grep ʀ args → ※1
```
**Pretty:**
```
ⓟ
ⓖ ʀ pattern → "const"
   ʀ files   → ※0
★ ToolCall
ⓖ ʀ cmd  → grep
   ʀ args → ※1
```

### ToolRegistry (PAP)
**Pretty:**
```
ⓟ
ⓖ ʀ pattern τstr
   ʀ files τset optional
   ʀ flags τmap optional

ⓖ ʀ directory τstr optional

★ Registry
ⓖ ᴄ cmd  ¦ args ¦ returns
   ʀ grep ¦ ※0   ¦ τgrid
   ʀ ls   ¦ ※1   ¦ τgrid
```

### ToolResult
**Pretty:**
```
ⓟ
★ Result
ⓖ ᴄ file ¦ line ¦ text
   ʀ a.ts ¦ 10   ¦ const x = 1
   ʀ b.ts ¦ 42   ¦ const y = 2
```

### Error Result
**Pretty:**
```
ⓟ
★ Error
ⓖ ʀ code → 404
```

## Zero-Loss Guarantee

Pretty MZ is **cosmetically different** but **semantically identical** to compact MZ. Both produce the same decoded output. The whitespace (spaces, newlines) between markers is ignored by the MarkZero decoder.

---
*Based on PAP Specification v1 - Pakakas Agent Protocol*
