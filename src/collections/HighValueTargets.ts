import type { CollectionConfig } from 'payload'

export const HighValueTargets: CollectionConfig = {
  slug: 'high-value-targets',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'official_domain',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'variations',
      type: 'json', // Known safe subdomains or variations
    },
  ],
}
