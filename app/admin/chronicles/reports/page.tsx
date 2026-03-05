'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Loader2, Download, FileText, BarChart3, TrendingUp, DollarSign, Users, RefreshCw, Plus
} from 'lucide-react';

interface Report {
  id: string;
  report_name: string;
  report_type: string;
  period_start: string;
  period_end: string;
  status: string;
  created_at: string;
  summary?: string;
  download_count?: number;
}

interface ReportTemplate {
  id: string;
  name: string;
  slug: string;
  description: string;
  report_type: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    fetchReports();
    fetchTemplates();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/chronicles/admin/reports?limit=10');
      if (!res.ok) throw new Error('Failed to fetch reports');
      const result = await res.json();
      setReports(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/chronicles/admin/reports?includeTemplates=true');
      if (!res.ok) throw new Error('Could not load templates');
      const result = await res.json();
      setTemplates(result.templates || []);
    } catch (err) {
      console.error('Template fetch error', err);
    }
  };

  const generateReport = async (templateId: string) => {
    setGenerating(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/chronicles/admin/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          dateRange: parseInt(dateRange),
          reportType: templates.find((t) => t.id === templateId)?.report_type,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate report');
      const result = await res.json();
      
      setSuccess(`Report "${result.data.report_name}" generated successfully!`);
      setReports([result.data, ...reports]);
      setSelectedTemplate('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = (report: Report) => {
    const json = JSON.stringify(report, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.report_name}-${report.period_start}.json`;
    a.click();
  };

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'analytics':
        return <BarChart3 className="w-5 h-5" />;
      case 'monetization':
        return <DollarSign className="w-5 h-5" />;
      case 'creator_performance':
        return <Users className="w-5 h-5" />;
      case 'engagement':
        return <TrendingUp className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  if (loading && reports.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="w-8 h-8" />
          Reports
        </h1>
        <p className="text-muted-foreground mt-1">Generate and manage platform reports</p>
      </div>

      {/* Generate Report Section */}
      <Card>
        <CardHeader>
          <CardTitle>Generate New Report</CardTitle>
          <CardDescription>Select a report template and date range</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Report Template</label>
                      <select
                title="Report template"
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="">Select a template...</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Date Range</label>
              <select
                title="Date range"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={() => selectedTemplate && generateReport(selectedTemplate)}
                disabled={!selectedTemplate || generating}
                className="w-full"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Report Templates Preview */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
            {templates.map((template) => (
              <div
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedTemplate === template.id
                    ? 'bg-blue-50 border-blue-300'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <p className="font-medium flex items-center gap-2">
                  {getReportIcon(template.report_type)}
                  {template.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>Previously generated reports</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchReports}
              disabled={loading}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">No reports generated yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Generate your first report above to get started
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {getReportIcon(report.report_type)}
                      <div>
                        <p className="font-medium">{report.report_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {report.period_start} to {report.period_end}
                        </p>
                      </div>
                    </div>
                    {report.summary && (
                      <p className="text-xs text-muted-foreground mt-2 ml-8">{report.summary}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {report.download_count || 0} downloads
                    </span>
                    <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                      {report.status}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadReport(report)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Schedule (Future Feature) */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Reports</CardTitle>
          <CardDescription>Automatically generate and deliver reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">Scheduled reports coming soon</p>
            <p className="text-sm text-muted-foreground mt-1">
              Set up automated report generation and email delivery
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
