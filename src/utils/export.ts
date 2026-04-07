import { DashboardStats } from '@/types'

interface ReportData {
	title: string
	date: string
	stats: DashboardStats
	period: string
}

export function generatePDFReport(data: ReportData): void {
	const printWindow = window.open('', '_blank')
	if (!printWindow) return

	const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${data.title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 40px;
          color: #1a1a1a;
          line-height: 1.6;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #e5e5e5;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .logo-icon {
          width: 40px;
          height: 40px;
          background: hsl(185 72% 36%);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 18px;
        }
        .logo-text { font-size: 24px; font-weight: 700; color: hsl(185 72% 36%); }
        .meta { text-align: right; color: #999; font-size: 14px; }
        h1 { font-size: 28px; margin-bottom: 8px; color: hsl(185 72% 36%); }
        h2 { font-size: 20px; margin: 24px 0 16px; color: hsl(185 72% 36%); }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }
        .stat-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
        }
        .stat-label { font-size: 12px; color: #999; text-transform: uppercase; font-weight: 600; }
        .stat-value { font-size: 28px; font-weight: 700; margin-top: 4px; color: hsl(185 72% 36%); }
        .stat-value.green { color: hsl(185 72% 36% / 0.8); }
        .stat-value.red { color: hsl(185 72% 36% / 0.95); }
        .stat-value.yellow { color: hsl(185 72% 36% / 0.6); }
        .chart-section { margin: 32px 0; }
        .bar-chart { display: flex; flex-direction: column; gap: 12px; }
        .bar-row { display: flex; align-items: center; gap: 12px; }
        .bar-label { width: 120px; font-size: 13px; font-weight: 500; }
        .bar-container { flex: 1; height: 20px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }
        .bar { height: 100%; border-radius: 4px; background: hsl(185 72% 36%); }
        .bar.low { opacity: 0.4; }
        .bar.medium { opacity: 0.65; }
        .bar.high { opacity: 0.85; }
        .bar.critical { opacity: 0.95; }
        .bar-value { width: 60px; text-align: right; font-size: 14px; font-weight: 500; color: #666; }
        .table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        .table th, .table td { 
          padding: 12px; 
          text-align: left; 
          border-bottom: 1px solid #e5e7eb; 
        }
        .table th { 
          background: #f9fafb; 
          font-weight: 600; 
          font-size: 12px; 
          text-transform: uppercase; 
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e5e5;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
        @media print {
          body { padding: 20px; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">
          <img src="/img/ScoraLogoDark.png" alt="Scora" style="height: 40px; width: auto;" />
        </div>
        <div class="meta">
          <div>${data.date}</div>
          <div>${data.period}</div>
        </div>
      </div>

      <h1>${data.title}</h1>

      <h2>Overview</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Decisions Today</div>
          <div class="stat-value">${data.stats.total_decisions_today.toLocaleString()}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Pending Reviews</div>
          <div class="stat-value yellow">${data.stats.pending_reviews}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Blocked Today</div>
          <div class="stat-value red">${data.stats.blocked_today}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Avg Latency</div>
          <div class="stat-value">${data.stats.avg_latency_ms}ms</div>
        </div>
      </div>

      <h2>Risk Distribution</h2>
      <div class="bar-chart">
        ${data.stats.risk_distribution
			.map(
				(r) => `
          <div class="bar-row">
            <div class="bar-label">${r.level.charAt(0).toUpperCase() + r.level.slice(1)}</div>
            <div class="bar-container">
              <div class="bar ${r.level}" style="width: ${r.percentage}%"></div>
            </div>
            <div class="bar-value">${r.percentage}%</div>
          </div>
        `
			)
			.join('')}
      </div>

      <h2>Top Patterns Detected</h2>
      <table class="table">
        <thead>
          <tr>
            <th>Pattern</th>
            <th>Count</th>
            <th>Percentage</th>
          </tr>
        </thead>
        <tbody>
          ${data.stats.pattern_distribution
			.map(
				(p) => `
            <tr>
              <td>${p.pattern.replace(/_/g, ' ')}</td>
              <td>${p.count}</td>
              <td>${p.percentage}%</td>
            </tr>
          `
			)
			.join('')}
        </tbody>
      </table>

      <h2>Decisions by Data Type</h2>
      <table class="table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Allow</th>
            <th>Review</th>
            <th>Block</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${data.stats.decisions_by_type
			.map(
				(d) => `
            <tr>
              <td style="font-weight: 600; color: hsl(185 72% 36%)">${d.type.toUpperCase()}</td>
              <td style="color: hsl(185 72% 36% / 0.6)">${d.allow}</td>
              <td style="color: hsl(185 72% 36% / 0.75)">${d.review}</td>
              <td style="color: hsl(185 72% 36% / 0.95)">${d.block}</td>
              <td style="font-weight: 600; color: hsl(185 72% 36%)">${d.allow + d.review + d.block}</td>
            </tr>
          `
			)
			.join('')}
        </tbody>
      </table>

      <div class="footer">
        Generated by Scora Risk Intelligence Engine • ${new Date().toISOString()}
      </div>

      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `

	printWindow.document.write(html)
	printWindow.document.close()
}

export function downloadCSV(data: Record<string, unknown>[], filename: string): void {
	if (data.length === 0) return

	const headers = Object.keys(data[0])
	const rows = data.map((row) =>
		headers
			.map((header) => {
				const value = row[header]
				if (typeof value === 'object') {
					return JSON.stringify(value)
				}
				return String(value ?? '')
			})
			.join(',')
	)

	const csv = [headers.join(','), ...rows].join('\n')
	const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
	const url = URL.createObjectURL(blob)

	const link = document.createElement('a')
	link.href = url
	link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
	link.click()

	URL.revokeObjectURL(url)
}

export function downloadJSON(data: unknown, filename: string): void {
	const json = JSON.stringify(data, null, 2)
	const blob = new Blob([json], { type: 'application/json' })
	const url = URL.createObjectURL(blob)

	const link = document.createElement('a')
	link.href = url
	link.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`
	link.click()

	URL.revokeObjectURL(url)
}
