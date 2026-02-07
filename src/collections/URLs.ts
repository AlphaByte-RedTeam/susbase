import type { CollectionConfig } from 'payload'

export const URLs: CollectionConfig = {
  slug: 'urls',
  admin: {
    useAsTitle: 'url',
    defaultColumns: ['url', 'status', 'trust_score', 'reports_count'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'url',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'domain',
      type: 'text',
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'UNKNOWN',
      options: [
        { label: 'Safe', value: 'SAFE' },
        { label: 'Suspicious', value: 'SUSPICIOUS' },
        { label: 'Malicious', value: 'MALICIOUS' },
        { label: 'Unknown', value: 'UNKNOWN' },
      ],
      required: true,
    },
    {
      name: 'trust_score',
      type: 'number',
      min: 0,
      max: 100,
      defaultValue: 50,
    },
    {
      name: 'reports_count',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'flags',
      type: 'json', // Using JSON to store array of strings for flexibility in Payload 3.0
    },
    {
      name: 'redirect_chain',
      type: 'json',
    },
  ],
}
