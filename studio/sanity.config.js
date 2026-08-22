import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import schemaTypes from './schemas'

export default defineConfig({
  name: 'irs-elizah',
  title: 'IRS ELIZAH',
  projectId: '7qtjf02b',
  dataset: 'production',
  plugins: [structureTool()],
  schema: {
    types: schemaTypes,
  },
})
