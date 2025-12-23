import React from 'react'
import AppLayout from '@/layouts/app-layout'
import { Head } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

type PageProps = {
  rows: Array<{
    department: string
    employee_name: string
    [key: string]: string | number | null
  }>
  evaluationNames: string[]
  branches: { id: number; name: string }[]
  departments: { id: number; name: string }[]
  periods: { id: number; evaluation_period_name: string }[]
  request?: { branch_id?: string; department_id?: string; period_id?: string }
}

export default function EvaluationSummaryPage({ rows, evaluationNames, branches, departments, periods, request }: PageProps) {
  const [branchId, setBranchId] = React.useState<string>(request?.branch_id ?? '')
  const [departmentId, setDepartmentId] = React.useState<string>(request?.department_id ?? '')
  const [periodId, setPeriodId] = React.useState<string>(request?.period_id ?? (periods.length > 0 ? String(periods[0].id) : ''))
  const [visible, setVisible] = React.useState<Record<string, boolean>>(
    () => evaluationNames.reduce((acc, name) => { acc[name] = true; return acc }, {} as Record<string, boolean>)
  )

  const buildQuery = () => {
    const params = new URLSearchParams()
    if (branchId) params.set('branch_id', branchId)
    if (departmentId) params.set('department_id', departmentId)
    if (periodId) params.set('period_id', periodId)
    const s = params.toString()
    return s ? `?${s}` : ''
  }

  const applyFilters = () => {
    window.location.href = `/reports/evaluation-summary${buildQuery()}`
  }

  const toggleColumn = (name: string) => {
    setVisible((prev) => ({ ...prev, [name]: !prev[name] }))
  }

  const visibleEvalNames = React.useMemo(() => evaluationNames.filter(n => visible[n]), [evaluationNames, visible])

  const calcOverall = React.useCallback((r: Record<string, any>) => {
    const values = visibleEvalNames
      .map((name) => r[name])
      .filter((v) => v !== null && v !== undefined)
      .map((v) => Number(v))
      .filter((n) => !Number.isNaN(n))
    if (values.length === 0) return '-'
    const sum = values.reduce((acc, n) => acc + n, 0)
    return (sum / values.length).toFixed(2)
  }, [visibleEvalNames])

  return (
    <AppLayout title="Evaluation Summary">
      <Head title="Evaluation Summary" />
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <Card>
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end flex-wrap">
              <div className="w-56">
                <label className="text-sm font-medium mb-2 block">Branch</label>
                <Select value={branchId || 'all'} onValueChange={(v) => setBranchId(v === 'all' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-56">
                <label className="text-sm font-medium mb-2 block">Department</label>
                <Select value={departmentId || 'all'} onValueChange={(v) => setDepartmentId(v === 'all' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-56">
                <label className="text-sm font-medium mb-2 block">Period</label>
                <Select value={periodId || 'all'} onValueChange={(v) => setPeriodId(v === 'all' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {periods.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.evaluation_period_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" onClick={applyFilters}>Apply Filters</Button>
              <Button
                variant="outline"
                onClick={() => {
                  const params = new URLSearchParams()
                  if (branchId) params.set('branch_id', branchId)
                  if (departmentId) params.set('department_id', departmentId)
                  if (periodId) params.set('period_id', periodId)
                  const selected = evaluationNames.filter(n => visible[n])
                  if (selected.length > 0 && selected.length < evaluationNames.length) {
                    params.set('columns', selected.join(','))
                  }
                  window.location.href = `/reports/evaluation-summary/export${params.toString() ? `?${params.toString()}` : ''}`
                }}
              >
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Columns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-center">
              {evaluationNames.map((name) => (
                <label key={name} className="inline-flex items-center gap-2 text-sm">
                  <Checkbox checked={!!visible[name]} onCheckedChange={() => toggleColumn(name)} />
                  <span>{name}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-500 dark:bg-slate-700">
                <TableRow>
                  <TableHead className="font-bold text-white">Department</TableHead>
                  <TableHead className="font-bold text-white">Employee Name</TableHead>
                  {visibleEvalNames.map((name) => (
                    <TableHead key={name} className="font-bold text-white text-center">{name}</TableHead>
                  ))}
                  <TableHead className="font-bold text-white text-center">Overall Avg</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  // compute rowspans for department only
                  const spans: { department: number[] } = { department: [] }
                  const rs = rows
                  let i = 0
                  while (i < rs.length) {
                    const dept = rs[i].department ?? ''
                    let j = i
                    while (j < rs.length && (rs[j].department ?? '') === dept) j++
                    spans.department[i] = j - i
                    i = j
                  }

                  return rs.map((r, idx) => (
                    <TableRow key={idx} className="odd:bg-slate-100 dark:odd:bg-slate-800">
                      {spans.department[idx] ? (
                        <TableCell rowSpan={spans.department[idx]}>{r.department}</TableCell>
                      ) : null}
                      <TableCell>{r.employee_name}</TableCell>
                      {visibleEvalNames.map((name) => (
                        <TableCell key={name} className="text-center">{r[name] ?? '-'}</TableCell>
                      ))}
                      <TableCell className="text-center">{calcOverall(r)}</TableCell>
                    </TableRow>
                  ))
                })()}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}


