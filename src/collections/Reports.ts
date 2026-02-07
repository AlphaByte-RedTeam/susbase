import type { CollectionConfig } from 'payload'

export const Reports: CollectionConfig = {
  slug: 'reports',
  admin: {
    useAsTitle: 'submitted_domain',
  },
  hooks: {
    afterChange: [
      async ({ doc, req, operation }) => {
        if (operation === 'update' && doc.status === 'ACCEPTED') {
          const { payload } = req
          const domain = doc.submitted_domain

          if (!domain) return

          try {
            // 1. Update URL stats
            const existing = await payload.find({
              collection: 'urls',
              where: {
                domain: {
                  equals: domain,
                },
              },
            })

            if (existing.docs.length > 0) {
              const urlDoc = existing.docs[0]
              await payload.update({
                collection: 'urls',
                id: urlDoc.id,
                data: {
                  reports_count: (urlDoc.reports_count || 0) + 1,
                  trust_score: Math.max(0, (urlDoc.trust_score || 50) - 1),
                },
              })
            } else {
              await payload.create({
                collection: 'urls',
                data: {
                  url: doc.submitted_url,
                  domain: domain,
                  status: 'MALICIOUS', 
                  trust_score: 20,
                  reports_count: 1,
                },
              })
            }
          } catch (error) {
            console.error('Error processing accepted report hook:', error)
          }
        }
      },
    ],
  },
  fields: [
    {
      name: 'submitted_url',
      type: 'text',
      required: true,
      admin: {
        description: 'URL submitted for review',
      },
    },
    {
      name: 'submitted_domain',
      type: 'text',
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
      name: 'reporter_name',
      type: 'text',
      admin: {
        description: 'Formatted Name of the reporter',
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
