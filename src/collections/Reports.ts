import type { CollectionConfig } from 'payload'

export const Reports: CollectionConfig = {
  slug: 'reports',
  admin: {
    useAsTitle: 'url_id',
  },
  fields: [
    {
      name: 'url_id',
      type: 'relationship',
      relationTo: 'urls',
      required: true,
    },
    {
      name: 'reporter_id',
      type: 'text',
      required: true,
      admin: {
        description: 'Supabase User ID',
      },
    },
    {
      name: 'comment',
      type: 'textarea',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'PENDING',
      options: [
        { label: 'Pending', value: 'PENDING' },
        { label: 'Accepted', value: 'ACCEPTED' },
        { label: 'Rejected', value: 'REJECTED' },
      ],
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'modified_by',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
        readOnly: true,
        condition: (data) => Boolean(data?.modified_by), // Only show if set
      },
      access: {
        read: ({ req }) => !!req.user, // Only authenticated (admin) users can read this
      },
    },
    {
      name: 'screenshot',
      type: 'upload',
      relationTo: 'media',
    },
  ],
}
