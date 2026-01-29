import { useEffect, useState } from "react";
import { db } from "@/lib/turso";
import { consultations } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface Consultation {
    id: number;
    name: string;
    email: string;
    phone: string;
    service_type: string;
    message: string;
    status: string;
    created_at: Date;
}

const ConsultationsManagement = () => {
    const [consultationList, setConsultationList] = useState<Consultation[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchConsultations = async () => {
        try {
            setLoading(true);
            const data = await db.select().from(consultations).orderBy(desc(consultations.created_at));
            setConsultationList(data);
        } catch (error) {
            console.error("Error fetching consultations:", error);
            toast.error("Gagal memuat data konsultasi");
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: number, status: string) => {
        try {
            await db.update(consultations)
                .set({ status })
                .where(eq(consultations.id, id));

            toast.success("Status berhasil diperbarui");
            fetchConsultations();
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Gagal memperbarui status");
        }
    };

    const deleteConsultation = async (id: number) => {
        if (!confirm("Hapus data konsultasi ini?")) return;
        try {
            await db.delete(consultations).where(eq(consultations.id, id));

            toast.success("Data konsultasi dihapus");
            fetchConsultations();
        } catch (error) {
            console.error("Error deleting consultation:", error);
            toast.error("Gagal menghapus data");
        }
    };

    useEffect(() => {
        fetchConsultations();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-foreground">Manajemen Konsultasi</h2>
                <Button onClick={fetchConsultations} variant="outline">Refresh</Button>
            </div>

            <div className="bg-white dark:bg-card rounded-lg shadow dark:shadow-lg border dark:border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-muted/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tanggal</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Klien</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Layanan</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pesan</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-border">
                            {consultationList.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center text-muted-foreground">Belum ada data konsultasi</td>
                                </tr>
                            ) : (
                                consultationList.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                            {format(new Date(item.created_at), "dd MMM yyyy HH:mm", { locale: id })}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-foreground">
                                            <div className="font-medium">{item.name}</div>
                                            <div className="text-muted-foreground text-xs">{item.email}</div>
                                            <div className="text-muted-foreground text-xs">{item.phone}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                            {item.service_type}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate" title={item.message}>
                                            {item.message}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <select
                                                value={item.status || 'pending'}
                                                onChange={(e) => updateStatus(item.id, e.target.value)}
                                                className={`text-xs font-semibold rounded-full px-2 py-1 border-none focus:ring-0 cursor-pointer ${item.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                    item.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="processing">Diproses</option>
                                                <option value="completed">Selesai</option>
                                                <option value="cancelled">Dibatalkan</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => deleteConsultation(item.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Hapus
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ConsultationsManagement;
