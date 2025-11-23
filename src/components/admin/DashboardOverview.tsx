import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Package, ShoppingCart, Users, Activity } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface DashboardOverviewProps {
    stats: {
        productsCount: number;
        ordersCount: number;
        consultationsCount: number;
        totalViews: number;
    };
    analytics: {
        viewsByDay: { date: string; count: number }[];
        topPages: { path: string; count: number }[];
    };
    recentActivity?: {
        id: string;
        action: string;
        details: string;
        timestamp: string;
    }[];
}

const safeFormat = (date: string | Date, fmt: string) => {
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return "-";
        return format(d, fmt, { locale: id });
    } catch (e) {
        return "-";
    }
};

const DashboardOverview = ({ stats, analytics, recentActivity = [] }: DashboardOverviewProps) => {
    return (
        <div className="space-y-6 animate-fade-in">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 border-none shadow-lg text-white hover:shadow-xl transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-purple-100">Total Produk</CardTitle>
                        <Package className="h-4 w-4 text-purple-100" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.productsCount}</div>
                        <p className="text-xs text-purple-200 mt-1">Item tersedia</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 border-none shadow-lg text-white hover:shadow-xl transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-blue-100">Total Pesanan</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-blue-100" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.ordersCount}</div>
                        <p className="text-xs text-blue-200 mt-1">Transaksi berhasil</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 border-none shadow-lg text-white hover:shadow-xl transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-100">Konsultasi</CardTitle>
                        <Users className="h-4 w-4 text-emerald-100" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.consultationsCount}</div>
                        <p className="text-xs text-emerald-200 mt-1">Permintaan masuk</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500 to-red-600 border-none shadow-lg text-white hover:shadow-xl transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-orange-100">Total Views</CardTitle>
                        <Activity className="h-4 w-4 text-orange-100" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalViews}</div>
                        <p className="text-xs text-orange-200 mt-1">Pengunjung halaman</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Section */}
                <Card className="lg:col-span-2 bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-gray-800 dark:text-gray-100">Statistik Pengunjung (7 Hari Terakhir)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analytics.viewsByDay}>
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(value) => safeFormat(value, 'dd MMM')}
                                        fontSize={12}
                                        stroke="#888888"
                                    />
                                    <YAxis fontSize={12} stroke="#888888" />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        labelFormatter={(value) => safeFormat(value, 'dd MMMM yyyy')}
                                    />
                                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activity Feed */}
                <Card className="bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-gray-800 dark:text-gray-100">Aktivitas Terbaru</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentActivity.length > 0 ? (
                                recentActivity.map((activity) => (
                                    <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0">
                                        <div className="h-2 w-2 mt-2 rounded-full bg-blue-500 shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{activity.action}</p>
                                            <p className="text-xs text-muted-foreground">{activity.details}</p>
                                            <p className="text-[10px] text-gray-400 mt-1">
                                                {safeFormat(activity.timestamp, 'dd MMM HH:mm')}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">Belum ada aktivitas baru</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default DashboardOverview;
