import { createClient } from '@sanity/client'

const client = createClient({
  projectId: '40qhs8fu',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_AUTH_TOKEN,
  useCdn: false,
})

const seedDoc = {
  _type: 'clientReport',
  reportTitle: 'Client Account Review Report',
  reportDate: '2026-08-16',
  clientName: 'Dennis Albert',
  userId: 'CR-2026-8888-8EI9X4',
  taxYear: '2021',
  reportStatus: 'Active Review',
  accounts: [
    { _type: 'account', institution: 'Capital One NA', status: 'Flagged' },
    { _type: 'account', institution: 'Chase Bank', status: 'Flagged' },
    { _type: 'account', institution: 'Bank of America', status: 'Blocked' },
  ],
  transactions: [
    {
      _type: 'transaction',
      date: '2026-08-13',
      amount: 1000000,
      currency: 'USD',
      destination: 'Bank of Tehran',
      status: 'Under Review',
      note: '',
    },
    {
      _type: 'transaction',
      date: '2026-08-13',
      amount: 700000,
      currency: 'USD',
      destination: 'Bank of Tehran',
      status: 'Under Review',
      note: '',
    },
    {
      _type: 'transaction',
      date: '2026-08-14',
      amount: 49000,
      currency: 'USD',
      destination: 'Islamic Wellfare',
      status: 'Under Review',
      note: '',
    },
    {
      _type: 'transaction',
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
  console.log('Checking for existing Dennis Albert document...')
  const existing = await client.fetch(
    '*[_type == "clientReport" && userId == "CR-2026-8888-8EI9X4"][0]._id'
  )

  if (existing) {
    console.log(`Document already exists: ${existing}. Updating...`)
    await client
      .patch(existing)
      .set(seedDoc)
      .commit()
    console.log('Updated!')
  } else {
    const created = await client.create(seedDoc)
    console.log(`Created document: ${created._id}`)
  }

  console.log('Seed complete.')
  console.log('Open Sanity Studio to manage this report.')
}

seed().catch((err) => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})
