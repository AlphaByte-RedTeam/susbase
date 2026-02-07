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
import { Loader2, Upload, X, Shield } from 'lucide-react'
import { useForm, FieldApi } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { z } from 'zod'
import { submitReportAction } from '@/app/(frontend)/actions'
import { toast } from 'sonner'
import Image from 'next/image'

// Helper FieldInfo component for displaying errors
function FieldInfo({ field }: { field: FieldApi<any, any, any, any> }) {
  if (!field.state.meta.isTouched || !field.state.meta.errors.length) return null

  return (
    <div className="text-[10px] uppercase tracking-widest text-destructive mt-1">
      {field.state.meta.errors.map((error, i) => (
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
  screenshot: z.any().optional(),
})

export function ReportDialogButton() {
  const [open, setOpen] = React.useState(false)
  const [isPending, setIsPending] = React.useState(false)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)

  const form = useForm({
    validatorAdapter: zodValidator(),
    defaultValues: {
      url: '',
      status: 'MALICIOUS' as const,
      comment: '',
      screenshot: undefined as File | undefined,
    },
    onSubmit: async ({ value }) => {
      setIsPending(true)
      try {
        const formData = new FormData()
        formData.append('url', value.url)
        formData.append('status', value.status)
        formData.append('comment', value.comment)
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

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: FieldApi<any, any, any, any>,
  ) => {
    const file = e.target.files?.[0]
    if (file) {
      field.handleChange(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const clearFile = (field: FieldApi<any, any, any, any>) => {
    field.handleChange(undefined)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="rounded-none w-full md:w-auto uppercase tracking-widest text-xs h-9 px-4 gap-2"
        >
          <Shield className="w-4 h-4" />
          Submit URL
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-125 rounded-none border-2 font-mono">
        <DialogHeader>
          <DialogTitle className="uppercase tracking-widest text-lg font-normal">
            Contribute to SusBase
          </DialogTitle>
          <DialogDescription className="text-xs uppercase tracking-tight text-muted-foreground">
            Vouch for a safe site to build our whitelist, or report a malicious one.
          </DialogDescription>
        </DialogHeader>

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
              onChange: reportSchema.shape.url,
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
                />
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>

          <form.Field name="status">
            {(field) => (
              <div className="space-y-2">
                <Label
                  htmlFor={field.name}
                  className="uppercase tracking-widest text-[10px] text-muted-foreground"
                >
                  Risk Level
                </Label>
                <Select value={field.state.value} onValueChange={field.handleChange}>
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

          <form.Field
            name="comment"
            validators={{
              onChange: reportSchema.shape.comment,
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
                  placeholder="DESCRIBE YOUR FINDINGS (E.G. 'OFFICIAL LOGIN PAGE' OR 'PHISHING SCAM')..."
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

          <DialogFooter className="pt-4">
            <Button
              type="submit"
              disabled={isPending}
              className="w-full rounded-none uppercase tracking-widest text-sm h-12"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              SUBMIT REPORT
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
