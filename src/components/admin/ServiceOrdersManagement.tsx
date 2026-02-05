import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Eye, CheckCircle, XCircle, Mail, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { db } from "@/lib/turso";
import { serviceOrders } from "@/db/schema";
import { desc, eq, like, or } from "drizzle-orm";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface ServiceOrder {
    id: number;
    order_id: number | null;
    service_id: string;
    user_id: string;
    contact_name: string;
    contact_email: string;
    contact_phone: string;
    briefing: string | null;
    service_name: string | null;
    service_price: number | null;
    status: 'pending_contact' | 'contacted' | 'in_progress' | 'completed' | string | null;
    created_at: Date | null;
}

const ServiceOrdersManagement = () => {
    const [orders, setOrders] = useState<ServiceOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const data = await db.select().from(serviceOrders).orderBy(desc(serviceOrders.created_at));
            setOrders(data);
        } catch (error) {
            console.error("Error fetching service orders:", error);
            toast.error("Gagal memuat pesanan layanan");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const updateStatus = async (id: number, status: string) => {
        try {
            await db.update(serviceOrders)
                .set({ status })
                .where(eq(serviceOrders.id, id));

            toast.success(`Status berhasil diubah menjadi ${status}`);
            fetchOrders();
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Gagal mengubah status");
        }
    };

    const filteredOrders = orders.filter(
        (order) =>
            order.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
            order.contact_email?.toLowerCase().includes(search.toLowerCase()) ||
            order.service_name?.toLowerCase().includes(search.toLowerCase()) ||
            order.order_id?.toString().includes(search)
    );

    const getStatusBadge = (status: string | null) => {
        switch (status) {
            case 'pending_contact':
                return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Menunggu Kontak</Badge>;
            case 'contacted':
                return <Badge className="bg-blue-100 text-blue-800">Sudah Dihubungi</Badge>;
            case 'in_progress':
                return <Badge className="bg-purple-100 text-purple-800">Sedang Dikerjakan</Badge>;
            case 'completed':
                return <Badge className="bg-green-100 text-green-800">Selesai</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Pesanan Layanan</h2>
                    <p className="text-muted-foreground">Kelola pesanan layanan dan briefing klien.</p>
                </div>
                <Button onClick={fetchOrders} variant="outline" size="sm">
                    <Loader2 className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Run Update
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari pesanan..."
                                className="pl-8"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Order ID</TableHead>
                                        <TableHead>Klien</TableHead>
                                        <TableHead>Layanan</TableHead>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredOrders.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                Tidak ada pesanan layanan ditemukan
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredOrders.map((order) => (
                                            <TableRow key={order.id}>
                                                <TableCell className="font-medium">#{order.order_id}</TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{order.contact_name}</p>
                                                        <p className="text-xs text-muted-foreground">{order.contact_email}</p>
                                                        <p className="text-xs text-muted-foreground">{order.contact_phone}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <p className="font-medium">{order.service_name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(order.service_price || 0)}
                                                    </p>
                                                </TableCell>
                                                <TableCell>
                                                    {order.created_at ? format(new Date(order.created_at), 'dd MMM yyyy HH:mm', { locale: id }) : '-'}
                                                </TableCell>
                                                <TableCell>{getStatusBadge(order.status)}</TableCell>
                                                <TableCell className="text-right">
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(order)}>
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-2xl">
                                                            <DialogHeader>
                                                                <DialogTitle>Detail Pesanan #{order.order_id}</DialogTitle>
                                                            </DialogHeader>
                                                            <div className="grid gap-6 py-4">
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <h4 className="text-sm font-semibold mb-2">Informasi Klien</h4>
                                                                        <div className="text-sm space-y-1">
                                                                            <p><span className="text-muted-foreground">Nama:</span> {order.contact_name}</p>
                                                                            <p><span className="text-muted-foreground">Email:</span> {order.contact_email}</p>
                                                                            <p><span className="text-muted-foreground">Telepon:</span> {order.contact_phone}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="text-sm font-semibold mb-2">Layanan</h4>
                                                                        <div className="text-sm space-y-1">
                                                                            <p><span className="text-muted-foreground">Layanan:</span> {order.service_name}</p>
                                                                            <p><span className="text-muted-foreground">Harga:</span> {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(order.service_price || 0)}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <h4 className="text-sm font-semibold mb-2">Briefing Klien</h4>
                                                                    <div className="bg-muted p-4 rounded-md text-sm whitespace-pre-wrap">
                                                                        {order.briefing || "Tidak ada briefing."}
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <h4 className="text-sm font-semibold mb-2">Update Status</h4>
                                                                    <div className="flex gap-2">
                                                                        <Button
                                                                            size="sm"
                                                                            variant={order.status === 'pending_contact' ? "default" : "outline"}
                                                                            onClick={() => updateStatus(order.id, 'pending_contact')}
                                                                        >
                                                                            Pending
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant={order.status === 'contacted' ? "default" : "outline"}
                                                                            className={order.status === 'contacted' ? "bg-blue-600 hover:bg-blue-700" : ""}
                                                                            onClick={() => updateStatus(order.id, 'contacted')}
                                                                        >
                                                                            <MessageSquare className="w-3 h-3 mr-1" /> Dihubungi
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant={order.status === 'in_progress' ? "default" : "outline"}
                                                                            className={order.status === 'in_progress' ? "bg-purple-600 hover:bg-purple-700" : ""}
                                                                            onClick={() => updateStatus(order.id, 'in_progress')}
                                                                        >
                                                                            Proses
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant={order.status === 'completed' ? "default" : "outline"}
                                                                            className={order.status === 'completed' ? "bg-green-600 hover:bg-green-700" : ""}
                                                                            onClick={() => updateStatus(order.id, 'completed')}
                                                                        >
                                                                            <CheckCircle className="w-3 h-3 mr-1" /> Selesai
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                                <div className="flex justify-end gap-2 mt-4">
                                                                    <Button variant="outline" asChild>
                                                                        <a href={`mailto:${order.contact_email}?subject=Konfirmasi Pesanan Layanan #${order.order_id}`}>
                                                                            <Mail className="w-4 h-4 mr-2" /> Kirim Email
                                                                        </a>
                                                                    </Button>
                                                                    <Button className="bg-green-600 hover:bg-green-700" asChild>
                                                                        <a href={`https://wa.me/${order.contact_phone?.replace(/^0/, '62')}`} target="_blank" rel="noopener noreferrer">
                                                                            <MessageSquare className="w-4 h-4 mr-2" /> WhatsApp
                                                                        </a>
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default ServiceOrdersManagement;
