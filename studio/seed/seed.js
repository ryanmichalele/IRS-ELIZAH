import {createClient} from '@sanity/client'
import dotenv from 'dotenv'

dotenv.config()

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || '7qtjf02b',
  dataset: process.env.SANITY_DATASET || 'production',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN || 'skVNA8iq8BVYWnCA8t9DpeEnRbsUF99RK8TQKEYXpwbm8svuX8OtZfKxrctOAUNsKV0yuFwNkPLvZ95UA2dBKOVNI5OJZNUVhmLHvD2cfuCY8aU6Iu70mk6vDMQ7j28pWNdq9l4AKKsO6HHq0uHXaUBGBxnAPykcGCdE8JdNUrxEcMmrUpeI',
})

const seedData = {
  _type: 'clientReport',
  title: 'IRS ELIZAH',
  reportDate: '2026-08-16',
  userId: 'CR-2026-8888-8EI9X4',
  taxYear: '2021',
  reportStatus: 'active-review',
  accounts: [
    {institution: 'Capital One NA', status: 'Flagged'},
    {institution: 'Chase Bank', status: 'Flagged'},
    {institution: 'Bank of America', status: 'Blocked'},
  ],
  transactions: [
    {
      date: '2026-08-13',
      amount: 1000000,
      currency: 'USD',
      destination: 'Bank of Tehran',
      status: 'Under Review',
      note: '',
    },
    {
      date: '2026-08-13',
      amount: 700000,
      currency: 'USD',
      destination: 'Bank of Tehran',
      status: 'Under Review',
      note: '',
    },
    {
      date: '2026-08-14',
      amount: 49000,
      currency: 'USD',
      destination: 'Islamic Wellfare',
      status: 'Under Review',
      note: '',
    },
    {
      date: '2026-08-13',
      amount: 22000,
      currency: 'USD',
      destination: 'Aid for Palestine \u2014 Transferred back to Sofi',
      status: 'Under Review',
      note: '',
    },
  ],
  alertNotice:
    'Your account has been flagged for unusual international activity. This activity requires additional internal review. Further action may be required if the matter remains unresolved.',
  advisoryNote:
    'This report is provided for informational and internal account-review purposes only and does not constitute a legal determination, tax determination, government notice, or official communication from the IRS or any government agency.',
}

async function seed() {
  try {
    const result = client.create(seedData)
    console.log('Seeded client report:', result._id)
  } catch (err) {
    console.error('Seed failed:', err.message)
    process.exit(1)
  }
}

seed()
