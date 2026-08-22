const {defineConfig} = require('sanity')
const {structureTool} = require('sanity/structure')
const {schemaTypes} = require('./schemas')

module.exports = defineConfig({
  name: 'irs-elizah',
  title: 'IRS ELIZAH',
  projectId: '7qtjf02b',
  dataset: 'production',
  plugins: [structureTool()],
  schema: {
    types: schemaTypes,
  },
})
