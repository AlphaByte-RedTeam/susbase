import React from 'react'
import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import { CheckUrlForm } from '@/components/check-url-form'

export default async function ReportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="home-container selection:bg-primary selection:text-primary-foreground">
      <Header user={user} />

      <main className="flex-1 flex flex-col items-center justify-center space-y-8">
        <div className="w-full text-center space-y-6">
          <h1 className="text-3xl md:text-5xl tracking-tight leading-tight uppercase">
            Submit a Report
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Found something suspicious? Check it first, then report it.
          </p>
        </div>

        <CheckUrlForm />
      </main>
    </div>
  )
}
