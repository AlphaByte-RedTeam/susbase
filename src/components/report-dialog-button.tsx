'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Upload, X, Shield } from 'lucide-react'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { submitReportAction } from '@/app/(frontend)/actions'
import { toast } from 'sonner'
import Image from 'next/image'

function FieldInfo({ field }: { field: any }) {
  if (!field.state.meta.isTouched || !field.state.meta.errors.length) return null

  return (
    <div className="text-[10px] uppercase tracking-widest text-destructive mt-1">
      {field.state.meta.errors.map((error: any, i: any) => (
        <p key={i}>
          {typeof error === 'string' ? error : (error as any)?.message || JSON.stringify(error)}
        </p>
      ))}
    </div>
  )
}

const reportSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
  status: z.enum(['SAFE', 'SUSPICIOUS', 'MALICIOUS', 'UNKNOWN']),
  comment: z.string().min(10, 'Please provide more details (at least 10 characters)'),
  is_high_target: z.boolean().default(false),
  screenshot: z.any().optional(),
})

interface ReportDialogProps {
  defaultUrl?: string
  defaultIntent?: 'SAFE' | 'MALICIOUS' | 'SUSPICIOUS'
  trigger?: React.ReactNode
}

export function ReportDialog({ defaultUrl, defaultIntent, trigger }: ReportDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [isPending, setIsPending] = React.useState(false)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)

  const form = useForm({
    defaultValues: {
      url: defaultUrl || '',
      status: defaultIntent || 'MALICIOUS',
      comment: '',
      is_high_target: false,
      screenshot: undefined as File | undefined,
    },
    onSubmit: async ({ value }) => {
      setIsPending(true)
      try {
        const formData = new FormData()
        formData.append('url', value.url)
        formData.append('status', value.status)
        formData.append('comment', value.comment)
        formData.append('is_high_target', String(value.is_high_target))
        if (value.screenshot) {
          formData.append('screenshot', value.screenshot)
        }

        const result = await submitReportAction(null, formData)

        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success('Submission received')
          setOpen(false)
          form.reset()
          setPreviewUrl(null)
        }
      } catch (error) {
        toast.error('Failed to submit report')
        console.error(error)
      } finally {
        setIsPending(false)
      }
    },
  })

  // Sync default URL and Intent
  React.useEffect(() => {
    if (defaultUrl) form.setFieldValue('url', defaultUrl)
    if (defaultIntent) form.setFieldValue('status', defaultIntent)
  }, [defaultUrl, defaultIntent, form])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: any) => {
    const file = e.target.files?.[0]
    if (file) {
      field.handleChange(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const clearFile = (field: any) => {
    field.handleChange(undefined)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  const title = defaultIntent === 'SAFE'
    ? 'Vouch Safe Site'
    : defaultIntent === 'MALICIOUS'
      ? 'Report Malicious Site'
      : 'Contribute to SusBase'

  const description = defaultIntent === 'SAFE'
    ? 'Verify this domain is legitimate to help our whitelist.'
    : 'Submit evidence of phishing, malware, or scams.'

  const formContent = (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="space-y-6 pt-4"
    >
      <form.Field
        name="url"
        validators={{
          onChange: ({ value }) => {
            const res = reportSchema.shape.url.safeParse(value)
            return res.success ? undefined : res.error.issues[0].message
          },
        }}
      >
        {(field) => (
          <div className="space-y-2">
            <Label
              htmlFor={field.name}
              className="uppercase tracking-widest text-[10px] text-muted-foreground"
            >
              Target URL
            </Label>
            <Input
              id={field.name}
              placeholder="https://example.com"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              className="rounded-none border-input focus-visible:ring-0 focus-visible:border-primary font-mono text-sm"
              readOnly={!!defaultUrl}
            />
            <FieldInfo field={field} />
          </div>
        )}
      </form.Field>

      {!defaultIntent && (
        <form.Field name="status">
          {(field) => (
            <div className="space-y-2">
              <Label
                htmlFor={field.name}
                className="uppercase tracking-widest text-[10px] text-muted-foreground"
              >
                Risk Level
              </Label>
              <Select
                value={field.state.value}
                onValueChange={(value) => field.handleChange(value as any)}
              >
                <SelectTrigger className="w-full rounded-none border-input focus:ring-0 focus:border-primary font-mono text-sm uppercase">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="rounded-none font-mono">
                  <SelectItem value="MALICIOUS" className="uppercase text-xs">
                    Malicious
                  </SelectItem>
                  <SelectItem value="SUSPICIOUS" className="uppercase text-xs">
                    Suspicious
                  </SelectItem>
                  <SelectItem value="SAFE" className="uppercase text-xs">
                    Safe
                  </SelectItem>
                  <SelectItem value="UNKNOWN" className="uppercase text-xs">
                    Unknown
                  </SelectItem>
                </SelectContent>
              </Select>
              <FieldInfo field={field} />
            </div>
          )}
        </form.Field>
      )}

      <form.Field name="is_high_target">
        {(field) => (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.name}
              checked={field.state.value}
              onCheckedChange={(checked) => field.handleChange(!!checked)}
              className="rounded-none border-border"
            />
            <Label
              htmlFor={field.name}
              className="text-[10px] uppercase tracking-widest text-muted-foreground cursor-pointer"
            >
              Is High Target?
            </Label>
          </div>
        )}
      </form.Field>

      <form.Field
        name="comment"
        validators={{
          onChange: ({ value }) => {
            const res = reportSchema.shape.comment.safeParse(value)
            return res.success ? undefined : res.error.issues[0].message
          },
        }}
      >
        {(field) => (
          <div className="space-y-2">
            <Label
              htmlFor={field.name}
              className="uppercase tracking-widest text-[10px] text-muted-foreground"
            >
              Observation / Reason
            </Label>
            <Textarea
              id={field.name}
              placeholder={
                defaultIntent === 'SAFE'
                  ? 'WHY IS THIS SITE SAFE? (E.G. OFFICIAL BANK LOGIN)...'
                  : 'DESCRIBE THE THREAT (E.G. PHISHING, FAKE LOGIN)...'
              }
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              className="min-h-25 rounded-none border-input focus-visible:ring-0 focus-visible:border-primary font-mono text-xs uppercase placeholder:normal-case placeholder:text-muted-foreground/50"
            />
            <FieldInfo field={field} />
          </div>
        )}
      </form.Field>

      <form.Field name="screenshot">
        {(field) => (
          <div className="space-y-2">
            <Label className="uppercase tracking-widest text-[10px] text-muted-foreground">
              Evidence (Screenshot)
            </Label>

            {!previewUrl ? (
              <div className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors p-6 flex flex-col items-center justify-center gap-2 cursor-pointer relative group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, field)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Click to upload image
                </span>
              </div>
            ) : (
              <div className="relative border border-border mt-2 group">
                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                  <Image src={previewUrl} alt="Preview" fill className="object-contain" />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6 rounded-none opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => clearFile(field)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            <FieldInfo field={field} />
          </div>
        )}
      </form.Field>

      <div className="pt-4 flex flex-col gap-2">
        <Button
          type="submit"
          disabled={isPending}
          className="w-full rounded-none uppercase tracking-widest text-sm h-12"
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          SUBMIT REPORT
        </Button>
      </div>
    </form>
  )

  const triggerButton = trigger || (
    <Button
      variant="outline"
      className="rounded-none uppercase tracking-widest text-xs h-9 px-4 gap-2"
    >
      <Shield className="w-4 h-4" />
      Submit URL
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-none border-2 font-mono p-0 overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="uppercase tracking-widest text-lg font-normal">
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs uppercase tracking-tight text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 p-6 pt-0">
          {formContent}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
