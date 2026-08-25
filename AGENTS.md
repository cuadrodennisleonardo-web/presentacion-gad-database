# Presentacion Municipal GAD Database - AI Agent Rules & Guidelines

## 1. STRICT NO EMOJI RULE (CRITICAL)
- **NEVER use raw emoji characters** (such as 🎓, 🏥, 🤝, 🏘️, 🏫, 🏗️, 🗺️, 📅, ⚡, ✨, 📋, ⬆️, ⬇️, 📊, 🚀, 💡, 📌, ⚠️, ✅, ❌, 🚨, 🔍, 📝, ⚙️, etc.) anywhere in the codebase.
- **Scope**: This applies unconditionally to:
  - UI components, JSX/TSX elements, and HTML.
  - Dropdown options, select labels, and form placeholders.
  - Button text, badge labels, card titles, and table headers.
  - Toast notifications, alert dialogues, and modal copy.
  - System strings, comments, and console outputs.
- **Approved Icon Solution**: Always use clean, professional SVG icons (inline SVG or Lucide / Heroicons icons) with proper Tailwind / CSS classes, or use plain descriptive text.

## 2. Dynamic Tables & Custom Rows
- Dynamic schemas support custom user-inputted rows (`targetEntity: 'custom_rows'`) in addition to built-in barangays, schools, daycare centers, and age brackets.
- All dynamic schemas must preserve their `customRows` and `customRowLabel` configurations.

## 3. Data Entry & Tab Sequence Customization
- Tab ordering across sectors is customizable and persisted via `localStorage` and `dynamic_schemas.schema.tab_order`.
- Data entry layout must maintain both native tabs and dynamic tabs in the user's customized sequence.
