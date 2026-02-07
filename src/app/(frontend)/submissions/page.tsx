import React from 'react'
import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  ShieldQuestion,
  Clock,
  CircleX,
  Timer,
  CheckCircle2,
} from 'lucide-react'
import { PaginationControls } from '@/components/ui/pagination-controls'
import { cn } from '@/lib/utils'

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Parse pagination params
  const resolvedSearchParams = await searchParams
  const page =
    typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page) : 1
  const limit = 10

  const payload = await getPayload({ config })

  // Fetch reports with pagination
  const reports = await payload.find({
    collection: 'reports',
    depth: 1,
    sort: '-createdAt',
    limit,
    page,
  })

  return (
    <div className="home-container selection:bg-primary selection:text-primary-foreground">
      <Header user={user} />

      <main className="flex-1 space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-5xl tracking-tight leading-tight uppercase flex items-center justify-center gap-4">
            <Clock className="w-10 h-10 text-primary" />
            Track Submissions
          </h1>
          <p className="text-muted-foreground uppercase tracking-widest text-sm">
            Public feed of reported threats and community history
          </p>
        </div>

        <div className="border-2 border-border bg-background rounded-none overflow-hidden">
          <Table>
            <TableCaption className="pb-6 uppercase tracking-widest text-[10px]">
              Showing {reports.docs.length} of {reports.totalDocs} submissions
            </TableCaption>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent border-b-2">
                <TableHead className="uppercase tracking-widest text-xs font-normal py-4">
                  URL / Domain
                </TableHead>
                <TableHead className="uppercase tracking-widest text-xs font-normal py-4">
                  Status
                </TableHead>
                <TableHead className="uppercase tracking-widest text-xs font-normal py-4">
                  Submitted By
                </TableHead>
                <TableHead className="uppercase tracking-widest text-xs font-normal py-4 text-right">
                  Date
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.docs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-20 text-muted-foreground uppercase tracking-widest text-xs"
                  >
                    No submissions found.
                  </TableCell>
                </TableRow>
              ) : (
                reports.docs.map((report: any) => {
                  const urlData = typeof report.url_id === 'object' ? report.url_id : null
                  const isYou = report.reporter_id === user?.id
                  const reporterMask = `HUNTER-${report.reporter_id?.substring(0, 10).toUpperCase()}`
                  const reporterDisplay = isYou ? 'YOU' : reporterMask

                  return (
                    <TableRow
                      key={report.id}
                      className={cn(
                        'group border-b last:border-0 hover:bg-muted/20 transition-colors',
                        isYou && 'bg-primary/5 border-l-2 border-l-primary/50',
                      )}
                    >
                      <TableCell className="py-6 font-mono">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium text-foreground truncate max-w-38 md:max-w-xs block">
                            {report.submitted_url || 'Unknown'}
                          </span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">
                            {report.submitted_domain || ''}
                          </span>
                          {urlData && <RiskBadge level={urlData.status} />}
                        </div>
                      </TableCell>
                      <TableCell className="py-6">
                        <SubmissionStatusBadge status={report.status || 'PENDING'} />
                      </TableCell>
                      <TableCell className="py-6">
                        <span
                          className={cn(
                            'text-xs font-mono uppercase whitespace-nowrap',
                            isYou ? 'text-primary font-bold' : 'text-muted-foreground',
                          )}
                        >
                          {reporterDisplay}
                        </span>
                      </TableCell>
                      <TableCell className="py-6 text-right text-[10px] text-muted-foreground uppercase font-mono">
                        {new Date(report.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>

          <PaginationControls
            hasNextPage={reports.hasNextPage}
            hasPrevPage={reports.hasPrevPage}
            totalPages={reports.totalPages}
            currentPage={reports.page || 1}
          />
        </div>
      </main>
    </div>
  )
}

function RiskBadge({ level }: { level: string }) {
  switch (level) {
    case 'SAFE':
      return (
        <span className="text-[10px] text-green-500 flex items-center gap-1 uppercase tracking-widest">
          <ShieldCheck className="w-3 h-3" /> Safe
        </span>
      )
    case 'SUSPICIOUS':
      return (
        <span className="text-[10px] text-yellow-500 flex items-center gap-1 uppercase tracking-widest">
          <ShieldAlert className="w-3 h-3" /> Sus
        </span>
      )
    case 'MALICIOUS':
      return (
        <span className="text-[10px] text-red-500 flex items-center gap-1 uppercase tracking-widest">
          <ShieldX className="w-3 h-3" /> Malicious
        </span>
      )
    default:
      return (
        <span className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase tracking-widest">
          <ShieldQuestion className="w-3 h-3" /> Unknown
        </span>
      )
  }
}

function SubmissionStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'ACCEPTED':
      return (
        <Badge
          variant="outline"
          className="rounded-none border-green-500/30 bg-green-500/5 text-green-600 text-[10px] uppercase tracking-widest px-2 py-0.5"
        >
          <CheckCircle2 className="w-3 h-3 mr-1" /> Accepted
        </Badge>
      )
    case 'REJECTED':
      return (
        <Badge
          variant="outline"
          className="rounded-none border-red-500/30 bg-red-500/5 text-red-600 text-[10px] uppercase tracking-widest px-2 py-0.5"
        >
          <CircleX className="w-3 h-3 mr-1" /> Rejected
        </Badge>
      )
    default:
      return (
        <Badge
          variant="outline"
          className="rounded-none border-muted-foreground/30 bg-muted/20 text-muted-foreground text-[10px] uppercase tracking-widest px-2 py-0.5"
        >
          <Timer className="w-3 h-3 mr-1" /> Pending
        </Badge>
      )
  }
}
