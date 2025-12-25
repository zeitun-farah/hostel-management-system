import { useEffect, useState } from "react";
import { getAdminPayments, confirmPayment, deletePayment } from "../../api/admin";
import { toast } from "react-toastify";
import ConfirmModal from "../../components/common/ConfirmModal";

const AdminPayments = () => {
    const [payments, setPayments] = useState([]);

    const load = async () => {
        try {
            const res = await getAdminPayments();
            setPayments(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => { load(); }, []);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmTitle, setConfirmTitle] = useState("");
    const [confirmMessage, setConfirmMessage] = useState("");
    const [confirmAction, setConfirmAction] = useState(() => async () => { });

    const doConfirm = (id) => {
        setConfirmTitle('Confirm payment');
        setConfirmMessage('Are you sure you want to mark this payment as PAID?');
        setConfirmAction(() => async () => {
            try {
                await confirmPayment(id);
                toast.success('Payment confirmed');
                await load();
            } catch (err) {
                console.error(err);
                toast.error(err?.response?.data?.message || 'Confirm failed');
            }
        });
        setConfirmOpen(true);
    };

    const doDelete = (id) => {
        setConfirmTitle('Delete payment');
        setConfirmMessage('Are you sure you want to delete this payment record? This cannot be undone.');
        setConfirmAction(() => async () => {
            try {
                await deletePayment(id);
                toast.success('Payment deleted');
                await load();
            } catch (err) {
                console.error(err);
                toast.error(err?.response?.data?.message || 'Delete failed');
            }
        });
        setConfirmOpen(true);
    };

    return (
        <>
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mt-6">
                <h2 className="font-semibold mb-4 text-lg">Payments</h2>
                <div className="max-h-64 overflow-y-auto rounded-md">
                    <table className="w-full text-sm divide-y divide-gray-100">
                        <thead className="bg-gray-50">
                            <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                                <th className="px-4 py-3">Student</th>
                                <th className="px-4 py-3">Amount</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Mpesa Reference</th>
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {payments.map(p => (
                                <tr key={p.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">{p.Student?.regNumber}</td>
                                    <td className="px-4 py-3">{p.amount}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${p.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">{p.reference}</td>
                                    <td className="px-4 py-3 flex gap-2">
                                        {p.status !== 'PAID' && (
                                            <button onClick={() => doConfirm(p.id)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md shadow-sm cursor-pointer">Confirm</button>
                                        )}
                                        <button onClick={() => doDelete(p.id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md shadow-sm cursor-pointer">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <ConfirmModal
                isOpen={confirmOpen}
                title={confirmTitle}
                message={confirmMessage}
                onCancel={() => setConfirmOpen(false)}
                onConfirm={async () => { setConfirmOpen(false); await confirmAction(); }}
            />
        </>
    );
};

export default AdminPayments;
