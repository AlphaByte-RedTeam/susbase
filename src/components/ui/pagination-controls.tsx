'use client'

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { useSearchParams, useRouter, usePathname } from "next/navigation"

interface PaginationControlsProps {
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
  currentPage: number
}

export function PaginationControls({
  totalPages,
  hasNextPage,
  hasPrevPage,
  currentPage,
}: PaginationControlsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', pageNumber.toString())
    return `${pathname}?${params.toString()}`
  }

  return (
    <Pagination className="rounded-none border-t border-border bg-background py-4">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious 
            href={hasPrevPage ? createPageURL(currentPage - 1) : '#'} 
            aria-disabled={!hasPrevPage}
            className={!hasPrevPage ? 'pointer-events-none opacity-50' : ''}
          />
        </PaginationItem>
        
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
            // Show first, last, current, and adjacent pages
            if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
            ) {
                return (
                    <PaginationItem key={page}>
                        <PaginationLink 
                            href={createPageURL(page)} 
                            isActive={page === currentPage}
                            className="rounded-none font-mono"
                        >
                            {page}
                        </PaginationLink>
                    </PaginationItem>
                )
            }
            // Show ellipsis
            if (
                page === currentPage - 2 ||
                page === currentPage + 2
            ) {
                return (
                    <PaginationItem key={page}>
                        <PaginationEllipsis />
                    </PaginationItem>
                )
            }
            return null
        })}

        <PaginationItem>
          <PaginationNext 
            href={hasNextPage ? createPageURL(currentPage + 1) : '#'} 
            aria-disabled={!hasNextPage}
            className={!hasNextPage ? 'pointer-events-none opacity-50' : ''}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
