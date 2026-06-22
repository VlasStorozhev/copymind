import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function DashboardSummaryGrid({
  metrics,
}: {
  metrics: Array<{ label: string; value: number | string; description?: string }>
}) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.label} size="sm">
          <CardHeader>
            <CardDescription>{metric.label}</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{metric.value}</CardTitle>
          </CardHeader>
          {metric.description ? (
            <CardContent className="pt-0 text-xs text-muted-foreground">{metric.description}</CardContent>
          ) : null}
        </Card>
      ))}
    </section>
  )
}
