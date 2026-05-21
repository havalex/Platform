/** Shared palette + property field definitions (admin + docs + AI) */

export const PALETTE_GROUPS = [
  { name: 'Display', types: ['Text', 'Badge', 'Alert', 'TodoList'] },
  { name: 'Inputs', types: ['Input', 'TextArea', 'Select', 'Checkbox', 'Button', 'Form'] },
  { name: 'Containers', types: ['Flex', 'Grid', 'Card', 'Section', 'Modal', 'Tabs'] },
  { name: 'Data', types: ['Table'] },
  { name: 'Modules', types: ['StatCard', 'Highlight'] },
];

export const ALL_COMPONENT_TYPES = PALETTE_GROUPS.flatMap(g => g.types);

/** Editable fields per type (properties panel) */
export const FIELD_SCHEMAS = {
  Text: [
    { key: 'content', label: 'Content', type: 'text' },
    { key: 'variant', label: 'Variant', type: 'select', options: ['heading', 'subheading', 'body', 'muted', 'lead', 'small'] },
    { key: 'className', label: 'CSS classes', type: 'text' },
  ],
  Badge: [
    { key: 'label', label: 'Label', type: 'text' },
    { key: 'color', label: 'Color', type: 'select', options: ['gray', 'red', 'yellow', 'green', 'blue', 'indigo', 'purple', 'pink'] },
    { key: 'icon', label: 'Icon', type: 'text' },
  ],
  Button: [
    { key: 'label', label: 'Label', type: 'text' },
    { key: 'icon', label: 'Icon', type: 'text' },
    { key: 'className', label: 'CSS classes', type: 'text' },
    { key: 'action.kind', label: 'Action', type: 'select', options: ['alert', 'navigate', 'emit', 'log'] },
    { key: 'action.message', label: 'Message / route', type: 'text' },
    { key: 'action.signal', label: 'Signal name', type: 'text' },
  ],
  Input: [
    { key: 'label', label: 'Label', type: 'text' },
    { key: 'placeholder', label: 'Placeholder', type: 'text' },
    { key: 'id', label: 'ID', type: 'text' },
  ],
  TextArea: [
    { key: 'label', label: 'Label', type: 'text' },
    { key: 'placeholder', label: 'Placeholder', type: 'text' },
    { key: 'rows', label: 'Rows', type: 'number' },
  ],
  Select: [
    { key: 'label', label: 'Label', type: 'text' },
  ],
  Checkbox: [
    { key: 'label', label: 'Label', type: 'text' },
    { key: 'defaultChecked', label: 'Checked', type: 'checkbox' },
  ],
  Section: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'description', label: 'Description', type: 'text' },
    { key: 'icon', label: 'Icon', type: 'text' },
  ],
  Card: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'subtitle', label: 'Subtitle', type: 'text' },
    { key: 'icon', label: 'Icon', type: 'text' },
    { key: 'accent', label: 'Accent', type: 'text' },
  ],
  Flex: [
    { key: 'direction', label: 'Direction', type: 'select', options: ['col', 'row'] },
    { key: 'gap', label: 'Gap', type: 'number' },
  ],
  Grid: [
    { key: 'cols', label: 'Columns', type: 'number' },
    { key: 'gap', label: 'Gap', type: 'number' },
  ],
  Alert: [
    { key: 'variant', label: 'Variant', type: 'select', options: ['info', 'success', 'warning', 'error'] },
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'message', label: 'Message', type: 'text' },
  ],
  Table: [
    { key: 'emptyMessage', label: 'Empty message', type: 'text' },
  ],
  Modal: [
    { key: 'triggerLabel', label: 'Trigger', type: 'text' },
    { key: 'title', label: 'Title', type: 'text' },
  ],
  Form: [
    { key: 'submitLabel', label: 'Submit label', type: 'text' },
  ],
  TodoList: [
    { key: 'dataKey', label: 'Data key', type: 'text' },
    { key: 'emptyMessage', label: 'Empty message', type: 'text' },
  ],
  Tabs: [],
  StatCard: [
    { key: 'label', label: 'Label', type: 'text' },
    { key: 'value', label: 'Value', type: 'text' },
    { key: 'trend', label: 'Trend', type: 'text' },
    { key: 'color', label: 'Color', type: 'select', options: ['indigo', 'green', 'red', 'amber'] },
  ],
  Highlight: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'body', label: 'Body', type: 'text' },
    { key: 'variant', label: 'Variant', type: 'select', options: ['info', 'success', 'warning'] },
  ],
};
