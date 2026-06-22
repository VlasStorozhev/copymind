import type { ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function DashboardTableSection({
  title,
  description,
  columns,
  rows,
  isRefreshing = false,
  onRefresh,
}: {
  title: string
  description?: string
  columns: string[]
  rows: Array<Array<ReactNode>>
  isRefreshing?: boolean
  onRefresh?: () => void
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="space-y-1.5">
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        {onRefresh ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isRefreshing}
            onClick={onRefresh}
          >
            <RefreshCw className={isRefreshing ? 'animate-spin' : undefined} />
            Refresh
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column}>{column}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, rowIndex) => (
              <TableRow key={`${title}-${rowIndex}`}>
                {row.map((cell, cellIndex) => (
                  <TableCell key={`${title}-${rowIndex}-${cellIndex}`}>{cell ?? '—'}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
