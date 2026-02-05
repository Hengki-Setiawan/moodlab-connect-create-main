import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { format, subDays } from "date-fns";
import { id } from "date-fns/locale";

interface AnalyticsViewProps {
    orders?: any[];
}

const AnalyticsView = ({ orders = [] }: AnalyticsViewProps) => {
    const [viewsByDay, setViewsByDay] = useState<{ date: string; count: number }[]>([]);
    const [topPages, setTopPages] = useState<{ path: string; count: number }[]>([]);
    const [topReferrers, setTopReferrers] = useState<{ referrer: string; count: number }[]>([]);
    const [rawViews, setRawViews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const thirtyDaysAgo = subDays(new Date(), 30);

            const { data, error } = await supabase
                .from('page_views' as any)
                .select('*')
                .gte('created_at', thirtyDaysAgo.toISOString());

            if (error) throw error;

            setRawViews(data || []);

            const byDay = new Map<string, number>();
            const pages = new Map<string, number>();
            const referrers = new Map<string, number>();

            const sample = data?.[0];
            const timeColumn = sample && 'viewed_at' in sample ? 'viewed_at' : 'created_at';

            (data || []).forEach((v: any) => {
                const timestamp = v[timeColumn];
                if (!timestamp) return;
                const dateObj = new Date(timestamp);
                if (isNaN(dateObj.getTime())) return;

                const day = dateObj.toISOString().slice(0, 10);
                byDay.set(day, (byDay.get(day) || 0) + 1);

                const p = v.path || "/";
                pages.set(p, (pages.get(p) || 0) + 1);

                if (v.referrer) referrers.set(v.referrer, (referrers.get(v.referrer) || 0) + 1);
            });

            // Fill missing days
            const filledViewsByDay = [];
            for (let i = 29; i >= 0; i--) {
                const d = subDays(new Date(), i);
                const dateStr = d.toISOString().slice(0, 10);
                filledViewsByDay.push({
                    date: dateStr,
                    count: byDay.get(dateStr) || 0
                });
            }

            setViewsByDay(filledViewsByDay);

            setTopPages(
                Array.from(pages.entries())
                    .map(([path, count]) => ({ path, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 10)
            );

            setTopReferrers(
                Array.from(referrers.entries())
                    .map(([referrer, count]) => ({ referrer, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 10)
            );

        } catch (error) {
            console.error("Error fetching analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    const downloadCSV = (data: any[], filename: string) => {
        if (!data.length) return;
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(fieldName => JSON.stringify(row[fieldName], (key, value) => value === null ? '' : value)).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    if (loading) return <div className="p-8 text-center">Loading analytics...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Analytics Detail (30 Hari Terakhir)</h2>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => downloadCSV(rawViews, 'analytics_page_views.csv')}>
                        <Download className="mr-2 h-4 w-4" /> Export Views
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => downloadCSV(orders, 'orders_export.csv')}>
                        <Download className="mr-2 h-4 w-4" /> Export Orders
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Tren Pengunjung</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={viewsByDay}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(val) => format(new Date(val), 'dd MMM', { locale: id })}
                                    fontSize={12}
                                />
                                <YAxis fontSize={12} />
                                <Tooltip
                                    labelFormatter={(val) => format(new Date(val), 'dd MMMM yyyy', { locale: id })}
                                />
                                <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Halaman Populer</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {topPages.map((page, idx) => (
                                <div key={idx} className="flex justify-between items-center border-b pb-2 last:border-0">
                                    <span className="text-sm font-medium truncate max-w-[70%]" title={page.path}>
                                        {page.path}
                                    </span>
                                    <span className="text-sm text-gray-500">{page.count} views</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Sumber Referensi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {topReferrers.length === 0 ? (
                                <p className="text-sm text-gray-500">Tidak ada data referensi</p>
                            ) : (
                                topReferrers.map((ref, idx) => (
                                    <div key={idx} className="flex justify-between items-center border-b pb-2 last:border-0">
                                        <span className="text-sm font-medium truncate max-w-[70%]" title={ref.referrer}>
                                            {ref.referrer}
                                        </span>
                                        <span className="text-sm text-gray-500">{ref.count} visits</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AnalyticsView;
