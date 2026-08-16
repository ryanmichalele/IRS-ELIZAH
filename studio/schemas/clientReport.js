export default {
  name: 'clientReport',
  title: 'Client Report',
  type: 'document',
  groups: [
    { name: 'info', title: 'Report Information', default: true },
    { name: 'accounts', title: 'Account Summary' },
    { name: 'transactions', title: 'Transactions' },
    { name: 'notices', title: 'Notices' },
  ],
  fields: [
    {
      name: 'reportTitle',
      title: 'Report Title',
      type: 'string',
      group: 'info',
      initialValue: 'Client Account Review Report',
    },
    {
      name: 'reportDate',
      title: 'Report Date',
      type: 'date',
      group: 'info',
      options: { dateFormat: 'MMMM D, YYYY' },
    },
    {
      name: 'clientName',
      title: 'Client Name',
      type: 'string',
      group: 'info',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'userId',
      title: 'User ID',
      type: 'string',
      group: 'info',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'taxYear',
      title: 'Tax Year',
      type: 'string',
      group: 'info',
    },
    {
      name: 'reportStatus',
      title: 'Report Status',
      type: 'string',
      group: 'info',
      options: {
        list: [
          { title: 'Draft', value: 'Draft' },
          { title: 'Active Review', value: 'Active Review' },
          { title: 'Pending', value: 'Pending' },
          { title: 'Resolved', value: 'Resolved' },
          { title: 'Closed', value: 'Closed' },
        ],
        layout: 'dropdown',
      },
      initialValue: 'Active Review',
    },
    {
      name: 'accounts',
      title: 'Account Summary',
      type: 'array',
      group: 'accounts',
      of: [
        {
          type: 'object',
          name: 'account',
          title: 'Account',
          fields: [
            {
              name: 'institution',
              title: 'Institution',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'status',
              title: 'Status',
              type: 'string',
              options: {
                list: [
                  { title: 'Normal', value: 'Normal' },
                  { title: 'Flagged', value: 'Flagged' },
                  { title: 'Blocked', value: 'Blocked' },
                  { title: 'Under Review', value: 'Under Review' },
                  { title: 'Restricted', value: 'Restricted' },
                  { title: 'Resolved', value: 'Resolved' },
                ],
                layout: 'dropdown',
              },
              validation: (Rule) => Rule.required(),
            },
          ],
          preview: {
            select: { title: 'institution', subtitle: 'status' },
          },
        },
      ],
    },
    {
      name: 'transactions',
      title: 'Transactions',
      type: 'array',
      group: 'transactions',
      of: [
        {
          type: 'object',
          name: 'transaction',
          title: 'Transaction',
          fields: [
            {
              name: 'date',
              title: 'Date',
              type: 'date',
              options: { dateFormat: 'YYYY-MM-DD' },
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'amount',
              title: 'Amount',
              type: 'number',
              validation: (Rule) => Rule.required().min(0),
            },
            {
              name: 'currency',
              title: 'Currency',
              type: 'string',
              initialValue: 'USD',
              options: {
                list: [
                  { title: 'USD', value: 'USD' },
                  { title: 'EUR', value: 'EUR' },
                  { title: 'GBP', value: 'GBP' },
                ],
                layout: 'dropdown',
              },
            },
            {
              name: 'destination',
              title: 'Destination',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'status',
              title: 'Status',
              type: 'string',
              options: {
                list: [
                  { title: 'Pending', value: 'Pending' },
                  { title: 'Under Review', value: 'Under Review' },
                  { title: 'Completed', value: 'Completed' },
                  { title: 'Returned', value: 'Returned' },
                  { title: 'Rejected', value: 'Rejected' },
                  { title: 'Resolved', value: 'Resolved' },
                ],
                layout: 'dropdown',
              },
              initialValue: 'Under Review',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'note',
              title: 'Internal Note',
              type: 'text',
              rows: 2,
            },
          ],
          preview: {
            select: {
              title: 'destination',
              subtitle: 'amount',
              date: 'date',
            },
            prepare(selection) {
              const { title, subtitle, date } = selection
              return {
                title: title,
                subtitle: subtitle ? `$${subtitle.toLocaleString()} — ${date || ''}` : date || '',
              }
            },
          },
        },
      ],
    },
    {
      name: 'alertNotice',
      title: 'Alert Notice',
      type: 'text',
      group: 'notices',
      rows: 4,
      initialValue:
        'Your account has been flagged for unusual international activity. This activity requires additional internal review. Further action may be required if the matter remains unresolved.',
    },
    {
      name: 'advisoryNote',
      title: 'Advisory Note',
      type: 'text',
      group: 'notices',
      rows: 4,
      initialValue:
        'This report is provided for informational and internal account-review purposes only and does not constitute a legal determination, tax determination, government notice, or official communication from the IRS or any government agency.',
    },
  ],
  preview: {
    select: {
      title: 'clientName',
      subtitle: 'userId',
      year: 'taxYear',
    },
    prepare(selection) {
      const { title, subtitle, year } = selection
      return {
        title: title || 'Unnamed Client',
        subtitle: subtitle ? `${subtitle}${year ? ` \u2022 Tax Year ${year}` : ''}` : '',
      }
    },
  },
  orderings: [
    {
      title: 'Client Name',
      name: 'clientNameAsc',
      by: [{ field: 'clientName', direction: 'asc' }],
    },
    {
      title: 'Date New',
      name: 'dateDesc',
      by: [{ field: 'reportDate', direction: 'desc' }],
    },
  ],
}
