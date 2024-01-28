/** @type { import('@storybook/react').Preview } */
const preview = {
  parameters: {
    layout: 'padded',
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
}

export default preview
