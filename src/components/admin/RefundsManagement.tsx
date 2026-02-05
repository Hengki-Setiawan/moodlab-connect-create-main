import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Eye, CheckCircle, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/turso";
import { refundRequests } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface RefundRequest {
    id: number;
    order_id: number | null;
    user_id: string;
    item_type: 'product' | 'service' | string | null;
    reason: string;
    status: 'pending' | 'approved' | 'rejected' | string | null;
    admin_notes: string | null;
    refund_amount: number | null;
    created_at: Date | null;
}

const RefundsManagement = () => {
    const [requests, setRequests] = useState<RefundRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedRequest, setSelectedRequest] = useState<RefundRequest | null>(null);
    const [adminNote, setAdminNote] = useState("");
    const [processing, setProcessing] = useState(false);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const data = await db.select().from(refundRequests).orderBy(desc(refundRequests.created_at));
            setRequests(data);
        } catch (error) {
            console.error("Error fetching refund requests:", error);
            toast.error("Gagal memuat permintaan refund");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleProcessRefund = async (status: 'approved' | 'rejected') => {
        if (!selectedRequest) return;
        setProcessing(true);

        try {
            await db.update(refundRequests)
                .set({
                    status,
                    admin_notes: adminNote,
                    updated_at: new Date()
                })
                .where(eq(refundRequests.id, selectedRequest.id));

            toast.success(`Permintaan refund berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}`);
            setSelectedRequest(null);
            setAdminNote("");
            fetchRequests();
        } catch (error) {
            console.error("Error processing refund:", error);
            toast.error("Gagal memproses refund");
        } finally {
            setProcessing(false);
        }
    };

    const filteredRequests = requests.filter(
        (req) =>
            req.reason.toLowerCase().includes(search.toLowerCase()) ||
            req.order_id?.toString().includes(search)
    );

    const getStatusBadge = (status: string | null) => {
        switch (status) {
            case 'pending':
                return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Menunggu</Badge>;
            case 'approved':
                return <Badge className="bg-green-100 text-green-800">Disetujui</Badge>;
            case 'rejected':
                return <Badge className="bg-red-100 text-red-800">Ditolak</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Permintaan Refund</h2>
                    <p className="text-muted-foreground">Kelola pengajuan pengembalian dana.</p>
                </div>
                <Button onClick={fetchRequests} variant="outline" size="sm">
                    <Loader2 className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari ID Order atau alasan..."
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
                                        <TableHead>Tipe</TableHead>
                                        <TableHead>Alasan</TableHead>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredRequests.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                Tidak ada permintaan refund
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredRequests.map((req) => (
                                            <TableRow key={req.id}>
                                                <TableCell className="font-medium">#{req.order_id}</TableCell>
                                                <TableCell>
                                                    {req.item_type === 'service' ? (
                                                        <Badge variant="outline" className="bg-blue-50 text-blue-700">Layanan</Badge>
                                                    ) : (
                                                        <Badge variant="outline">Produk</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="max-w-[200px] truncate" title={req.reason}>
                                                    {req.reason}
                                                </TableCell>
                                                <TableCell>
                                                    {req.created_at ? format(new Date(req.created_at), 'dd MMM yyyy', { locale: id }) : '-'}
                                                </TableCell>
                                                <TableCell>{getStatusBadge(req.status)}</TableCell>
                                                <TableCell className="text-right">
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" onClick={() => {
                                                                setSelectedRequest(req);
                                                                setAdminNote(req.admin_notes || "");
                                                            }}>
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-md">
                                                            <DialogHeader>
                                                                <DialogTitle>Detail Refund #{req.id}</DialogTitle>
                                                            </DialogHeader>
                                                            <div className="grid gap-4 py-4">
                                                                <div className="space-y-1">
                                                                    <p className="text-sm font-medium text-muted-foreground">Order ID</p>
                                                                    <p className="font-semibold">#{req.order_id}</p>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <p className="text-sm font-medium text-muted-foreground">Alasan Pengajuan</p>
                                                                    <div className="bg-muted p-3 rounded-md text-sm">
                                                                        {req.reason}
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <p className="text-sm font-medium text-muted-foreground">Status Saat Ini</p>
                                                                    <div>{getStatusBadge(req.status)}</div>
                                                                </div>

                                                                {req.status === 'pending' ? (
                                                                    <div className="space-y-2 pt-2 border-t">
                                                                        <Label>Catatan Admin (Opsional)</Label>
                                                                        <Textarea
                                                                            placeholder="Alasan persetujuan/penolakan..."
                                                                            value={adminNote}
                                                                            onChange={(e) => setAdminNote(e.target.value)}
                                                                        />
                                                                        <div className="flex gap-2 justify-end pt-2">
                                                                            <Button
                                                                                variant="destructive"
                                                                                onClick={() => handleProcessRefund('rejected')}
                                                                                disabled={processing}
                                                                            >
                                                                                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                                                                                Tolak
                                                                            </Button>
                                                                            <Button
                                                                                className="bg-green-600 hover:bg-green-700"
                                                                                onClick={() => handleProcessRefund('approved')}
                                                                                disabled={processing}
                                                                            >
                                                                                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                                                                Setujui
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="space-y-1">
                                                                        <p className="text-sm font-medium text-muted-foreground">Catatan Admin</p>
                                                                        <p className="text-sm italic">{req.admin_notes || "-"}</p>
                                                                    </div>
                                                                )}
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

export default RefundsManagement;
