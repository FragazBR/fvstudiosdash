
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from 'react-i18next';

type Metric = {
  label: string
  value: string
  change: string
  positive: boolean
}

const metrics: Metric[] = [
  { label: 'metrics.cpc', value: 'R$ 1,20', change: '3.2%', positive: false },
  { label: 'metrics.ctr', value: '5.1%', change: '1.1%', positive: true },
  { label: 'metrics.cpm', value: 'R$ 32,90', change: '0.8%', positive: false },
  { label: 'metrics.conversions', value: '312', change: '12.4%', positive: true },
  { label: 'metrics.roi', value: '241%', change: '4.5%', positive: true }
];

export function PerformanceMetrics() {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {metrics.map((metric, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">{t(metric.label)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            <p className={`text-sm ${metric.positive ? "text-green-500" : "text-red-500"}`}>
              {metric.positive ? "▲" : "▼"} {metric.change}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
