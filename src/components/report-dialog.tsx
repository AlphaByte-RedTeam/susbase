'use client'

import { useState, useActionState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { submitReportAction } from '@/app/(frontend)/actions'
import { Loader2, Flag } from 'lucide-react'

export function ReportDialog({ url }: { url: string }) {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(submitReportAction, null)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-none uppercase text-[10px] tracking-widest transition-colors"
        >
          <Flag className="h-3 w-3" />
          Report
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-106 rounded-none border-2 font-mono max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="uppercase tracking-widest text-lg font-normal">
            Report Malicious URL
          </DialogTitle>
          <DialogDescription className="text-xs uppercase tracking-tight text-muted-foreground">
            Help us protect others by reporting this URL.
          </DialogDescription>
        </DialogHeader>

        {state?.success ? (
          <div className="py-10 text-center space-y-4">
            <p className="uppercase tracking-widest text-sm text-foreground">SUCCESS</p>
            <p className="text-xs text-muted-foreground uppercase">{state.message}</p>
            <Button
              onClick={() => setOpen(false)}
              variant="outline"
              className="mt-4 rounded-none uppercase tracking-widest text-xs"
            >
              Close
            </Button>
          </div>
        ) : (
          <form action={formAction} className="space-y-6 pt-4">
            <input type="hidden" name="url" value={url} />

            <div className="space-y-3">
              <Label className="uppercase tracking-widest text-[10px] text-muted-foreground">
                URL
              </Label>
              <div className="p-3 bg-muted/50 text-xs break-all text-muted-foreground border">
                {url}
              </div>
            </div>

            <div className="space-y-3">
              <Label
                htmlFor="comment"
                className="uppercase tracking-widest text-[10px] text-muted-foreground"
              >
                Additional Details
              </Label>
              <Textarea
                id="comment"
                name="comment"
                placeholder="WHERE DID YOU FIND THIS LINK? WHAT DID IT TRY TO DO?"
                className="min-h-[100px] rounded-none border text-xs placeholder:opacity-50 uppercase"
              />
            </div>

            {state?.error && (
              <div className="text-[10px] text-destructive uppercase tracking-widest">
                {state.error}
              </div>
            )}

            <DialogFooter className="pt-4">
              <Button
                type="submit"
                disabled={isPending}
                className="w-full rounded-none uppercase tracking-widest text-sm h-12"
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Report
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
