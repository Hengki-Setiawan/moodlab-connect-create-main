import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Package, MapPin, User, Calendar, CreditCard } from "lucide-react";

interface OrderDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: any; // Using any for now, should be typed properly
}

const OrderDetailModal = ({ isOpen, onClose, order }: OrderDetailModalProps) => {
    if (!order) return null;

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(price);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl">Detail Pesanan #{order.id.slice(0, 8)}</DialogTitle>
                        <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                            {order.status}
                        </Badge>
                    </div>
                    <DialogDescription>
                        Dibuat pada {format(new Date(order.created_at), 'dd MMMM yyyy, HH:mm', { locale: id })}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Customer Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <User className="h-4 w-4" /> Informasi Pembeli
                            </h3>
                            <div className="text-sm space-y-1 text-muted-foreground">
                                <p><span className="font-medium text-foreground">User ID:</span> {order.user_id}</p>
                                {/* Add more user details if available in the join */}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <MapPin className="h-4 w-4" /> Alamat Pengiriman
                            </h3>
                            <div className="text-sm text-muted-foreground">
                                {/* Placeholder as address might be in a separate table or json field */}
                                <p>Alamat pengiriman akan muncul di sini jika tersedia di database.</p>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Order Items */}
                    <div className="space-y-3">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Package className="h-4 w-4" /> Item Pesanan
                        </h3>
                        <div className="border rounded-lg p-4 space-y-4">
                            {/* This would map through order items if we had them joined */}
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-medium">Total Pesanan</p>
                                    <p className="text-sm text-muted-foreground">Termasuk pajak & biaya layanan</p>
                                </div>
                                <p className="font-bold text-lg">{formatPrice(order.total)}</p>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Payment Info */}
                    <div className="space-y-3">
                        <h3 className="font-semibold flex items-center gap-2">
                            <CreditCard className="h-4 w-4" /> Pembayaran
                        </h3>
                        <div className="bg-gray-50 p-3 rounded text-sm">
                            <div className="flex justify-between mb-1">
                                <span>Metode Pembayaran</span>
                                <span className="font-medium">Transfer Bank / E-Wallet</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Status Pembayaran</span>
                                <span className="text-green-600 font-medium">Lunas</span>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default OrderDetailModal;
