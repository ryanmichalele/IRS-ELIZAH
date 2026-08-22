module.exports = {
  name: 'clientReport',
  title: 'Client Report',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Report Title',
      type: 'string',
      initialValue: 'Client Account Review Report',
    },
    {
      name: 'reportDate',
      title: 'Report Date',
      type: 'date',
      options: {
        dateFormat: 'YYYY-MM-DD',
      },
    },
    {
      name: 'userId',
      title: 'User ID',
      type: 'string',
    },
    {
      name: 'taxYear',
      title: 'Tax Year',
      type: 'string',
    },
    {
      name: 'reportStatus',
      title: 'Report Status',
      type: 'string',
      options: {
        list: [
          {title: 'Draft', value: 'draft'},
          {title: 'Active Review', value: 'active-review'},
          {title: 'Pending', value: 'pending'},
          {title: 'Resolved', value: 'resolved'},
          {title: 'Closed', value: 'closed'},
        ],
      },
      initialValue: 'active-review',
    },
    {
      name: 'accounts',
      title: 'Account Summary',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'institution',
              title: 'Institution',
              type: 'string',
            },
            {
              name: 'status',
              title: 'Account Status',
              type: 'string',
              options: {
                list: [
                  {title: 'Flagged', value: 'Flagged'},
                  {title: 'Blocked', value: 'Blocked'},
                  {title: 'Under Review', value: 'Under Review'},
                  {title: 'Cleared', value: 'Cleared'},
                ],
              },
            },
          ],
          preview: {
            select: {
              title: 'institution',
              subtitle: 'status',
            },
          },
        },
      ],
    },
    {
      name: 'transactions',
      title: 'Transaction Details',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'date',
              title: 'Date',
              type: 'date',
              options: {
                dateFormat: 'YYYY-MM-DD',
              },
            },
            {
              name: 'amount',
              title: 'Amount',
              type: 'number',
            },
            {
              name: 'currency',
              title: 'Currency',
              type: 'string',
              initialValue: 'USD',
            },
            {
              name: 'destination',
              title: 'Destination',
              type: 'string',
            },
            {
              name: 'status',
              title: 'Status',
              type: 'string',
              options: {
                list: [
                  {title: 'Under Review', value: 'Under Review'},
                  {title: 'Flagged', value: 'Flagged'},
                  {title: 'Blocked', value: 'Blocked'},
                  {title: 'Cleared', value: 'Cleared'},
                  {title: 'Resolved', value: 'Resolved'},
                ],
              },
            },
            {
              name: 'note',
              title: 'Note',
              type: 'string',
            },
          ],
          preview: {
            select: {
              title: 'destination',
              subtitle: 'amount',
            },
            prepare(select) {
              return {
                title: select.title,
                subtitle: '$' + (select.subtitle ? select.subtitle.toLocaleString() : '0'),
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
      rows: 3,
    },
    {
      name: 'advisoryNote',
      title: 'Advisory Note',
      type: 'text',
      rows: 3,
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'clientName',
    },
  },
}
