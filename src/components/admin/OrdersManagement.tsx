import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, CheckCircle, XCircle, Truck } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import OrderDetailModal from "./OrderDetailModal";
import { db } from "@/lib/turso";
import { orders as ordersSchema } from "@/db/schema";
import { eq } from "drizzle-orm";
import { toast } from "sonner";

interface Order {
    id: string;
    user_id: string;
    status: string;
    total_amount: number;
    created_at: string;
}

interface OrdersManagementProps {
    orders: Order[];
    onOrderUpdated: () => void;
}

const OrdersManagement = ({ orders, onOrderUpdated }: OrdersManagementProps) => {
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(price);
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed': return 'bg-green-500 hover:bg-green-600';
            case 'processing': return 'bg-blue-500 hover:bg-blue-600';
            case 'shipped': return 'bg-purple-500 hover:bg-purple-600';
            case 'cancelled': return 'bg-red-500 hover:bg-red-600';
            default: return 'bg-gray-500 hover:bg-gray-600';
        }
    };

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        setUpdatingId(orderId);
        try {
            await db.update(ordersSchema)
                .set({ status: newStatus })
                .where(eq(ordersSchema.id, parseInt(orderId)));

            toast.success(`Status pesanan berhasil diubah menjadi ${newStatus}`);
            onOrderUpdated();
        } catch (error) {
            console.error('Error updating order:', error);
            toast.error('Gagal mengubah status pesanan');
        } finally {
            setUpdatingId(null);
        }
    };

    const openDetail = (order: Order) => {
        setSelectedOrder(order);
        setIsDetailOpen(true);
    };

    return (
        <div className="space-y-4">
            <div className="bg-white dark:bg-card/60 backdrop-blur-sm rounded-lg border dark:border-border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50/80 dark:bg-muted/40">
                        <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    Belum ada pesanan
                                </TableCell>
                            </TableRow>
                        ) : (
                            orders.map((order) => (
                                <TableRow key={order.id} className="hover:bg-white/60 dark:hover:bg-muted/60 transition-colors">
                                    <TableCell className="font-mono text-xs text-foreground">{order.id.slice(0, 8)}...</TableCell>
                                    <TableCell>
                                        {format(new Date(order.created_at), 'dd MMM yyyy', { locale: id })}
                                    </TableCell>
                                    <TableCell className="font-medium">{formatPrice(order.total_amount)}</TableCell>
                                    <TableCell>
                                        <Select
                                            defaultValue={order.status}
                                            onValueChange={(val) => handleStatusChange(order.id, val)}
                                            disabled={updatingId === order.id}
                                        >
                                            <SelectTrigger className={`w-[130px] h-8 text-xs text-white border-none ${getStatusColor(order.status)}`}>
                                                <SelectValue placeholder="Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="processing">Processing</SelectItem>
                                                <SelectItem value="shipped">Shipped</SelectItem>
                                                <SelectItem value="completed">Completed</SelectItem>
                                                <SelectItem value="cancelled">Cancelled</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openDetail(order)}
                                            className="hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400"
                                        >
                                            <Eye className="h-4 w-4 mr-1" /> Detail
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <OrderDetailModal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                order={selectedOrder}
            />
        </div>
    );
};

export default OrdersManagement;
