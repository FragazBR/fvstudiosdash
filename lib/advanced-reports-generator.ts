// ===============================================
// 📊 SISTEMA DE GERAÇÃO DE RELATÓRIOS AVANÇADOS
// ===============================================
// Sistema completo para geração de relatórios em múltiplos formatos
// com processamento de dados, renderização e export customizável
// ===============================================

import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import { createObjectCsvWriter } from 'csv-writer';
import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

// ===============================================
// TIPOS E INTERFACES
// ===============================================

export type ReportFormat = 'pdf' | 'excel' | 'csv' | 'json' | 'html';
export type ReportCategory = 'financial' | 'performance' | 'projects' | 'team' | 'clients' | 'marketing' | 'analytics' | 'compliance' | 'executive' | 'operational';
export type ChartType = 'line' | 'bar' | 'pie' | 'doughnut' | 'radar' | 'scatter' | 'bubble' | 'area' | 'gauge';

export interface ReportConfig {
  id: string;
  name: string;
  description?: string;
  category: ReportCategory;
  template_id?: string;
  data_config: DataConfig;
  filter_values: Record<string, any>;
  date_range: DateRange;
  output_formats: ReportFormat[];
  layout_settings: LayoutSettings;
  agency_id: string;
  created_by: string;
}

export interface DataConfig {
  data_sources: string[];
  query_config: QueryConfig;
  aggregations?: AggregationConfig[];
  joins?: JoinConfig[];
}

export interface QueryConfig {
  base_query: string;
  grouping?: string[];
  metrics: string[];
  filters?: FilterConfig[];
  sorting?: SortConfig[];
}

export interface FilterConfig {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in' | 'like' | 'between';
  value: any;
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface AggregationConfig {
  field: string;
  function: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'distinct_count';
  alias?: string;
}

export interface JoinConfig {
  table: string;
  type: 'inner' | 'left' | 'right' | 'full';
  on: string;
}

export interface DateRange {
  start_date: string;
  end_date: string;
  preset?: 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'last_90_days' | 'this_month' | 'last_month' | 'this_year' | 'custom';
}

export interface LayoutSettings {
  orientation: 'portrait' | 'landscape';
  page_size: 'A4' | 'A3' | 'letter' | 'legal';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  sections: ReportSection[];
  styling: StylingConfig;
}

export interface ReportSection {
  id: string;
  type: 'header' | 'footer' | 'summary' | 'chart' | 'table' | 'text' | 'image' | 'metric';
  title?: string;
  content?: any;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  styling?: StylingConfig;
}

export interface StylingConfig {
  colors?: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts?: {
    family: string;
    sizes: {
      title: number;
      subtitle: number;
      body: number;
      caption: number;
    };
  };
  spacing?: {
    section_gap: number;
    element_gap: number;
  };
}

export interface ChartConfig {
  type: ChartType;
  data: any;
  options: any;
  width: number;
  height: number;
}

export interface ReportData {
  raw_data: any[];
  processed_data: any[];
  aggregated_data: any[];
  charts_data: Record<string, any>;
  metrics: Record<string, number>;
  metadata: {
    total_rows: number;
    processing_time_ms: number;
    data_sources: string[];
    filters_applied: FilterConfig[];
  };
}

export interface GenerationResult {
  success: boolean;
  execution_id: string;
  files: GeneratedFile[];
  performance_metrics: PerformanceMetrics;
  error?: string;
}

export interface GeneratedFile {
  id: string;
  filename: string;
  format: ReportFormat;
  file_path: string;
  file_size_bytes: number;
  download_url?: string;
}

export interface PerformanceMetrics {
  total_duration_ms: number;
  query_duration_ms: number;
  processing_duration_ms: number;
  rendering_duration_ms: number;
  export_duration_ms: number;
  memory_usage_mb: number;
  rows_processed: number;
}

// ===============================================
// CLASSE PRINCIPAL DO GERADOR DE RELATÓRIOS
// ===============================================

export class AdvancedReportsGenerator {
  private supabase: any;
  private chartRenderer: ChartJSNodeCanvas;
  private tempDir: string;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    this.chartRenderer = new ChartJSNodeCanvas({
      width: 800,
      height: 600,
    });

    this.tempDir = path.join(process.cwd(), 'temp', 'reports');
    this.ensureTempDir();
  }

  private async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Erro ao criar diretório temporário:', error);
    }
  }

  // ===============================================
  // MÉTODO PRINCIPAL DE GERAÇÃO
  // ===============================================

  async generateReport(config: ReportConfig): Promise<GenerationResult> {
    const startTime = Date.now();
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // 1. Criar registro de execução
      await this.createExecution(executionId, config);

      // 2. Processar dados
      const reportData = await this.processData(config);

      // 3. Gerar arquivos nos formatos solicitados
      const files: GeneratedFile[] = [];
      
      for (const format of config.output_formats) {
        const file = await this.generateFileByFormat(
          format, 
          config, 
          reportData, 
          executionId
        );
        files.push(file);
      }

      // 4. Calcular métricas de performance
      const totalTime = Date.now() - startTime;
      const metrics: PerformanceMetrics = {
        total_duration_ms: totalTime,
        query_duration_ms: reportData.metadata.processing_time_ms,
        processing_duration_ms: 0, // Será calculado em processData
        rendering_duration_ms: 0, // Será calculado em generateFileByFormat
        export_duration_ms: 0, // Será calculado em generateFileByFormat
        memory_usage_mb: process.memoryUsage().heapUsed / 1024 / 1024,
        rows_processed: reportData.metadata.total_rows
      };

      // 5. Salvar resultados e métricas
      await this.saveExecutionResults(executionId, files, metrics);

      return {
        success: true,
        execution_id: executionId,
        files,
        performance_metrics: metrics
      };

    } catch (error: any) {
      console.error('Erro na geração de relatório:', error);
      
      await this.markExecutionFailed(executionId, error.message);
      
      return {
        success: false,
        execution_id: executionId,
        files: [],
        performance_metrics: {
          total_duration_ms: Date.now() - startTime,
          query_duration_ms: 0,
          processing_duration_ms: 0,
          rendering_duration_ms: 0,
          export_duration_ms: 0,
          memory_usage_mb: 0,
          rows_processed: 0
        },
        error: error.message
      };
    }
  }

  // ===============================================
  // PROCESSAMENTO DE DADOS
  // ===============================================

  private async processData(config: ReportConfig): Promise<ReportData> {
    const startTime = Date.now();

    try {
      // 1. Obter dados brutos das fontes
      const rawData = await this.fetchRawData(config);

      // 2. Aplicar filtros
      const filteredData = this.applyFilters(rawData, config.filter_values);

      // 3. Processar agregações
      const aggregatedData = this.processAggregations(filteredData, config.data_config);

      // 4. Preparar dados para gráficos
      const chartsData = this.prepareChartsData(aggregatedData, config.layout_settings);

      // 5. Calcular métricas
      const metrics = this.calculateMetrics(aggregatedData);

      return {
        raw_data: rawData,
        processed_data: filteredData,
        aggregated_data: aggregatedData,
        charts_data: chartsData,
        metrics,
        metadata: {
          total_rows: filteredData.length,
          processing_time_ms: Date.now() - startTime,
          data_sources: config.data_config.data_sources,
          filters_applied: config.data_config.query_config.filters || []
        }
      };

    } catch (error) {
      console.error('Erro no processamento de dados:', error);
      throw error;
    }
  }

  private async fetchRawData(config: ReportConfig): Promise<any[]> {
    const { data_sources, query_config } = config.data_config;
    let combinedData: any[] = [];

    for (const source of data_sources) {
      try {
        let query = this.supabase.from(source);

        // Aplicar seleções
        if (query_config.metrics && query_config.metrics.length > 0) {
          query = query.select(query_config.metrics.join(', '));
        } else {
          query = query.select('*');
        }

        // Aplicar filtros básicos
        if (query_config.filters) {
          for (const filter of query_config.filters) {
            query = this.applyQueryFilter(query, filter);
          }
        }

        // Aplicar range de datas
        if (config.date_range.start_date && config.date_range.end_date) {
          query = query.gte('created_at', config.date_range.start_date)
                      .lte('created_at', config.date_range.end_date);
        }

        // Aplicar ordenação
        if (query_config.sorting) {
          for (const sort of query_config.sorting) {
            query = query.order(sort.field, { ascending: sort.direction === 'asc' });
          }
        }

        const { data, error } = await query;
        
        if (error) {
          throw new Error(`Erro ao buscar dados de ${source}: ${error.message}`);
        }

        combinedData = combinedData.concat(data || []);

      } catch (error) {
        console.error(`Erro ao processar fonte ${source}:`, error);
        throw error;
      }
    }

    return combinedData;
  }

  private applyQueryFilter(query: any, filter: FilterConfig): any {
    switch (filter.operator) {
      case 'eq':
        return query.eq(filter.field, filter.value);
      case 'neq':
        return query.neq(filter.field, filter.value);
      case 'gt':
        return query.gt(filter.field, filter.value);
      case 'gte':
        return query.gte(filter.field, filter.value);
      case 'lt':
        return query.lt(filter.field, filter.value);
      case 'lte':
        return query.lte(filter.field, filter.value);
      case 'in':
        return query.in(filter.field, filter.value);
      case 'like':
        return query.ilike(filter.field, `%${filter.value}%`);
      default:
        return query;
    }
  }

  private applyFilters(data: any[], filterValues: Record<string, any>): any[] {
    if (!filterValues || Object.keys(filterValues).length === 0) {
      return data;
    }

    return data.filter(row => {
      return Object.entries(filterValues).every(([field, value]) => {
        if (value === null || value === undefined || value === '') {
          return true;
        }
        
        const rowValue = row[field];
        
        if (Array.isArray(value)) {
          return value.includes(rowValue);
        }
        
        return rowValue === value;
      });
    });
  }

  private processAggregations(data: any[], dataConfig: DataConfig): any[] {
    if (!dataConfig.aggregations || dataConfig.aggregations.length === 0) {
      return data;
    }

    const groupedData: Record<string, any[]> = {};
    const groupingFields = dataConfig.query_config.grouping || [];

    // Agrupar dados
    data.forEach(row => {
      const groupKey = groupingFields.map(field => row[field]).join('|') || 'all';
      if (!groupedData[groupKey]) {
        groupedData[groupKey] = [];
      }
      groupedData[groupKey].push(row);
    });

    // Aplicar agregações
    return Object.entries(groupedData).map(([groupKey, groupRows]) => {
      const result: any = {};

      // Adicionar campos de agrupamento
      if (groupingFields.length > 0) {
        const groupValues = groupKey.split('|');
        groupingFields.forEach((field, index) => {
          result[field] = groupValues[index];
        });
      }

      // Aplicar funções de agregação
      dataConfig.aggregations!.forEach(agg => {
        const alias = agg.alias || `${agg.function}_${agg.field}`;
        const values = groupRows.map(row => row[agg.field]).filter(v => v != null);

        switch (agg.function) {
          case 'sum':
            result[alias] = values.reduce((sum, val) => sum + (Number(val) || 0), 0);
            break;
          case 'avg':
            result[alias] = values.length > 0 ? 
              values.reduce((sum, val) => sum + (Number(val) || 0), 0) / values.length : 0;
            break;
          case 'count':
            result[alias] = values.length;
            break;
          case 'min':
            result[alias] = values.length > 0 ? Math.min(...values.map(Number)) : 0;
            break;
          case 'max':
            result[alias] = values.length > 0 ? Math.max(...values.map(Number)) : 0;
            break;
          case 'distinct_count':
            result[alias] = new Set(values).size;
            break;
        }
      });

      return result;
    });
  }

  private prepareChartsData(data: any[], layoutSettings: LayoutSettings): Record<string, any> {
    const chartsData: Record<string, any> = {};

    layoutSettings.sections.forEach(section => {
      if (section.type === 'chart' && section.content) {
        const chartConfig = section.content as ChartConfig;
        chartsData[section.id] = this.processChartData(data, chartConfig);
      }
    });

    return chartsData;
  }

  private processChartData(data: any[], chartConfig: ChartConfig): any {
    // Implementar processamento específico por tipo de gráfico
    switch (chartConfig.type) {
      case 'line':
      case 'bar':
        return this.prepareBarLineData(data, chartConfig);
      case 'pie':
      case 'doughnut':
        return this.preparePieData(data, chartConfig);
      default:
        return { labels: [], datasets: [] };
    }
  }

  private prepareBarLineData(data: any[], chartConfig: ChartConfig): any {
    const labels = data.map(row => row.label || row.name || row.category);
    const values = data.map(row => row.value || row.count || 0);

    return {
      labels,
      datasets: [{
        label: chartConfig.data.label || 'Dados',
        data: values,
        backgroundColor: chartConfig.data.backgroundColor || '#3B82F6',
        borderColor: chartConfig.data.borderColor || '#1D4ED8',
        borderWidth: 2
      }]
    };
  }

  private preparePieData(data: any[], chartConfig: ChartConfig): any {
    const labels = data.map(row => row.label || row.name || row.category);
    const values = data.map(row => row.value || row.count || 0);

    return {
      labels,
      datasets: [{
        data: values,
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
          '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
        ]
      }]
    };
  }

  private calculateMetrics(data: any[]): Record<string, number> {
    if (data.length === 0) return {};

    const metrics: Record<string, number> = {};
    const numericFields = Object.keys(data[0]).filter(key => 
      typeof data[0][key] === 'number'
    );

    numericFields.forEach(field => {
      const values = data.map(row => row[field]).filter(v => typeof v === 'number');
      
      metrics[`${field}_sum`] = values.reduce((sum, val) => sum + val, 0);
      metrics[`${field}_avg`] = values.length > 0 ? 
        values.reduce((sum, val) => sum + val, 0) / values.length : 0;
      metrics[`${field}_min`] = values.length > 0 ? Math.min(...values) : 0;
      metrics[`${field}_max`] = values.length > 0 ? Math.max(...values) : 0;
    });

    metrics.total_records = data.length;

    return metrics;
  }

  // ===============================================
  // GERAÇÃO POR FORMATO
  // ===============================================

  private async generateFileByFormat(
    format: ReportFormat,
    config: ReportConfig,
    data: ReportData,
    executionId: string
  ): Promise<GeneratedFile> {
    const filename = `${config.name}_${executionId}.${format}`;
    const filepath = path.join(this.tempDir, filename);

    switch (format) {
      case 'pdf':
        await this.generatePDF(config, data, filepath);
        break;
      case 'excel':
        await this.generateExcel(config, data, filepath);
        break;
      case 'csv':
        await this.generateCSV(config, data, filepath);
        break;
      case 'json':
        await this.generateJSON(config, data, filepath);
        break;
      case 'html':
        await this.generateHTML(config, data, filepath);
        break;
    }

    const stats = await fs.stat(filepath);

    return {
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      filename,
      format,
      file_path: filepath,
      file_size_bytes: stats.size
    };
  }

  // ===============================================
  // GERAÇÃO PDF
  // ===============================================

  private async generatePDF(config: ReportConfig, data: ReportData, filepath: string): Promise<void> {
    const doc = new PDFDocument({
      size: config.layout_settings.page_size,
      layout: config.layout_settings.orientation,
      margins: config.layout_settings.margins
    });

    doc.pipe(require('fs').createWriteStream(filepath));

    // Header
    doc.fontSize(20).text(config.name, { align: 'center' });
    doc.moveDown();

    if (config.description) {
      doc.fontSize(12).text(config.description, { align: 'center' });
      doc.moveDown();
    }

    // Processar seções
    for (const section of config.layout_settings.sections) {
      await this.renderPDFSection(doc, section, data);
    }

    doc.end();
  }

  private async renderPDFSection(doc: any, section: ReportSection, data: ReportData): Promise<void> {
    switch (section.type) {
      case 'text':
        doc.fontSize(14).text(section.title || '');
        if (section.content) {
          doc.fontSize(10).text(section.content.text || '');
        }
        doc.moveDown();
        break;

      case 'table':
        await this.renderPDFTable(doc, section, data);
        break;

      case 'chart':
        await this.renderPDFChart(doc, section, data);
        break;

      case 'metric':
        this.renderPDFMetric(doc, section, data);
        break;
    }
  }

  private async renderPDFTable(doc: any, section: ReportSection, data: ReportData): Promise<void> {
    if (section.title) {
      doc.fontSize(14).text(section.title);
      doc.moveDown();
    }

    const tableData = data.aggregated_data.slice(0, 50); // Limite para PDF
    if (tableData.length === 0) return;

    const headers = Object.keys(tableData[0]);
    const startY = doc.y;
    const cellWidth = 80;
    const cellHeight = 20;

    // Headers
    headers.forEach((header, i) => {
      doc.rect(i * cellWidth, startY, cellWidth, cellHeight).stroke();
      doc.fontSize(8).text(header, i * cellWidth + 5, startY + 5, {
        width: cellWidth - 10,
        height: cellHeight - 10
      });
    });

    // Rows
    tableData.forEach((row, rowIndex) => {
      const y = startY + (rowIndex + 1) * cellHeight;
      headers.forEach((header, colIndex) => {
        doc.rect(colIndex * cellWidth, y, cellWidth, cellHeight).stroke();
        doc.fontSize(7).text(
          String(row[header] || ''),
          colIndex * cellWidth + 5,
          y + 5,
          { width: cellWidth - 10, height: cellHeight - 10 }
        );
      });
    });

    doc.y = startY + (tableData.length + 1) * cellHeight + 20;
  }

  private async renderPDFChart(doc: any, section: ReportSection, data: ReportData): Promise<void> {
    if (section.title) {
      doc.fontSize(14).text(section.title);
      doc.moveDown();
    }

    const chartData = data.charts_data[section.id];
    if (!chartData) return;

    try {
      const chartBuffer = await this.chartRenderer.renderToBuffer({
        type: (section.content as ChartConfig).type as any,
        data: chartData,
        options: (section.content as ChartConfig).options || {}
      });

      doc.image(chartBuffer, {
        fit: [400, 300],
        align: 'center'
      });
      doc.moveDown();

    } catch (error) {
      console.error('Erro ao renderizar gráfico no PDF:', error);
      doc.fontSize(10).text('Erro ao renderizar gráfico');
      doc.moveDown();
    }
  }

  private renderPDFMetric(doc: any, section: ReportSection, data: ReportData): void {
    if (section.title) {
      doc.fontSize(14).text(section.title);
    }

    const metricName = section.content?.metric;
    const metricValue = data.metrics[metricName];

    if (metricValue !== undefined) {
      doc.fontSize(24).text(String(metricValue), { align: 'center' });
    }

    doc.moveDown();
  }

  // ===============================================
  // GERAÇÃO EXCEL
  // ===============================================

  private async generateExcel(config: ReportConfig, data: ReportData, filepath: string): Promise<void> {
    const workbook = XLSX.utils.book_new();

    // Aba principal com dados processados
    const mainSheet = XLSX.utils.json_to_sheet(data.aggregated_data);
    XLSX.utils.book_append_sheet(workbook, mainSheet, 'Dados');

    // Aba com dados brutos (se solicitado)
    if (data.raw_data.length > 0 && data.raw_data.length <= 10000) {
      const rawSheet = XLSX.utils.json_to_sheet(data.raw_data);
      XLSX.utils.book_append_sheet(workbook, rawSheet, 'Dados Brutos');
    }

    // Aba com métricas
    const metricsData = Object.entries(data.metrics).map(([key, value]) => ({
      Métrica: key,
      Valor: value
    }));
    const metricsSheet = XLSX.utils.json_to_sheet(metricsData);
    XLSX.utils.book_append_sheet(workbook, metricsSheet, 'Métricas');

    XLSX.writeFile(workbook, filepath);
  }

  // ===============================================
  // GERAÇÃO CSV
  // ===============================================

  private async generateCSV(config: ReportConfig, data: ReportData, filepath: string): Promise<void> {
    if (data.aggregated_data.length === 0) {
      await fs.writeFile(filepath, 'Nenhum dado encontrado\n');
      return;
    }

    const headers = Object.keys(data.aggregated_data[0]);
    const csvWriter = createObjectCsvWriter({
      path: filepath,
      header: headers.map(h => ({ id: h, title: h }))
    });

    await csvWriter.writeRecords(data.aggregated_data);
  }

  // ===============================================
  // GERAÇÃO JSON
  // ===============================================

  private async generateJSON(config: ReportConfig, data: ReportData, filepath: string): Promise<void> {
    const jsonData = {
      report_info: {
        name: config.name,
        description: config.description,
        generated_at: new Date().toISOString(),
        category: config.category
      },
      data: data.aggregated_data,
      metrics: data.metrics,
      metadata: data.metadata
    };

    await fs.writeFile(filepath, JSON.stringify(jsonData, null, 2));
  }

  // ===============================================
  // GERAÇÃO HTML
  // ===============================================

  private async generateHTML(config: ReportConfig, data: ReportData, filepath: string): Promise<void> {
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .section { margin-bottom: 30px; }
        .metric { text-align: center; padding: 20px; background: #f5f5f5; border-radius: 8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .charts { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${config.name}</h1>
        ${config.description ? `<p>${config.description}</p>` : ''}
        <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
    </div>

    <div class="section">
        <h2>Métricas Principais</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            ${Object.entries(data.metrics).map(([key, value]) => `
                <div class="metric">
                    <h3>${key.replace(/_/g, ' ')}</h3>
                    <p style="font-size: 24px; margin: 0;">${value}</p>
                </div>
            `).join('')}
        </div>
    </div>

    <div class="section">
        <h2>Dados</h2>
        <table>
            ${data.aggregated_data.length > 0 ? `
                <thead>
                    <tr>
                        ${Object.keys(data.aggregated_data[0]).map(key => `<th>${key}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${data.aggregated_data.slice(0, 100).map(row => `
                        <tr>
                            ${Object.values(row).map(value => `<td>${value}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            ` : '<p>Nenhum dado encontrado</p>'}
        </table>
    </div>
</body>
</html>`;

    await fs.writeFile(filepath, html);
  }

  // ===============================================
  // MÉTODOS DE APOIO PARA BANCO DE DADOS
  // ===============================================

  private async createExecution(executionId: string, config: ReportConfig): Promise<void> {
    const { error } = await this.supabase
      .from('report_executions')
      .insert({
        id: executionId,
        report_id: config.id,
        agency_id: config.agency_id,
        execution_number: 1, // Seria calculado baseado em execuções anteriores
        status: 'generating',
        config_snapshot: config,
        filter_values: config.filter_values,
        date_range: config.date_range,
        executed_by: config.created_by,
        execution_source: 'manual'
      });

    if (error) {
      throw new Error(`Erro ao criar execução: ${error.message}`);
    }
  }

  private async saveExecutionResults(
    executionId: string,
    files: GeneratedFile[],
    metrics: PerformanceMetrics
  ): Promise<void> {
    // Atualizar execução
    await this.supabase
      .from('report_executions')
      .update({
        status: 'completed',
        progress_percentage: 100,
        completed_at: new Date().toISOString(),
        duration_seconds: Math.round(metrics.total_duration_ms / 1000),
        output_files: files,
        performance_metrics: metrics
      })
      .eq('id', executionId);

    // Salvar arquivos
    for (const file of files) {
      await this.supabase
        .from('report_files')
        .insert({
          id: file.id,
          execution_id: executionId,
          filename: file.filename,
          format: file.format,
          file_size_bytes: file.file_size_bytes,
          file_path: file.file_path
        });
    }

    // Salvar métricas de performance
    await this.supabase
      .from('report_performance_metrics')
      .insert({
        execution_id: executionId,
        query_duration_ms: metrics.query_duration_ms,
        processing_duration_ms: metrics.processing_duration_ms,
        rendering_duration_ms: metrics.rendering_duration_ms,
        export_duration_ms: metrics.export_duration_ms,
        total_duration_ms: metrics.total_duration_ms,
        rows_processed: metrics.rows_processed,
        memory_usage_mb: metrics.memory_usage_mb
      });
  }

  private async markExecutionFailed(executionId: string, errorMessage: string): Promise<void> {
    await this.supabase
      .from('report_executions')
      .update({
        status: 'failed',
        error_message: errorMessage,
        completed_at: new Date().toISOString()
      })
      .eq('id', executionId);
  }

  // ===============================================
  // MÉTODOS UTILITÁRIOS
  // ===============================================

  async cleanupTempFiles(olderThanHours: number = 24): Promise<void> {
    try {
      const files = await fs.readdir(this.tempDir);
      const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);

      for (const file of files) {
        const filepath = path.join(this.tempDir, file);
        const stats = await fs.stat(filepath);
        
        if (stats.mtime.getTime() < cutoffTime) {
          await fs.unlink(filepath);
        }
      }
    } catch (error) {
      console.error('Erro na limpeza de arquivos temporários:', error);
    }
  }

  async getExecutionStatus(executionId: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('report_executions')
      .select('*')
      .eq('id', executionId)
      .single();

    if (error) {
      throw new Error(`Erro ao buscar status da execução: ${error.message}`);
    }

    return data;
  }

  async cancelExecution(executionId: string): Promise<void> {
    await this.supabase
      .from('report_executions')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString()
      })
      .eq('id', executionId);
  }
}

// ===============================================
// EXPORTAÇÃO
// ===============================================

export default AdvancedReportsGenerator;