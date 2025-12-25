import { useEffect, useState } from "react";
import { getAdminAllocations, vacateRoomAdmin } from "../../api/admin";
import ConfirmModal from "../../components/common/ConfirmModal";
import { toast } from "react-toastify";

const AdminAllocations = () => {
    const [allocations, setAllocations] = useState([]);
    const [loading, setLoading] = useState(true);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmTitle, setConfirmTitle] = useState("");
    const [confirmMessage, setConfirmMessage] = useState("");
    const [confirmAction, setConfirmAction] = useState(() => async () => { });

    const load = async () => {
        setLoading(true);
        try {
            const res = await getAdminAllocations();
            setAllocations(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const handleVacate = (a) => {
        const studentReg = a.Student?.regNumber || a.Student?.id || 'student';
        setConfirmTitle('Vacate allocation');
        setConfirmMessage(`Vacate allocation for ${studentReg}?`);
        setConfirmAction(() => async () => {
            try {
                const studentId = a.Student?.id || a.studentId;
                await vacateRoomAdmin({ studentId });
                toast.success('Vacated successfully');
                await load();
            } catch (err) {
                console.error(err);
                toast.error(err?.response?.data?.message || 'Vacate failed');
            }
        });
        setConfirmOpen(true);
    };

    if (loading) return <div className="p-4">Loading allocations...</div>;

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h2 className="font-semibold mb-4 text-lg">Room Allocations</h2>

            <div className="overflow-x-auto">
                <table className="w-full text-sm divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                        <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                            <th className="px-4 py-3">Student</th>
                            <th className="px-4 py-3">Room</th>
                            <th className="px-4 py-3">Hostel</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {allocations.map((a) => (
                            <tr key={a.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">{a.Student?.regNumber}</td>
                                <td className="px-4 py-3">{a.Room?.roomNumber}</td>
                                <td className="px-4 py-3">{a.Room?.Hostel?.name}</td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${a.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {a.status}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    {a.status === 'ACTIVE' && (
                                        <button onClick={() => handleVacate(a)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md shadow-sm cursor-pointer">Vacate</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <ConfirmModal
                isOpen={confirmOpen}
                title={confirmTitle}
                message={confirmMessage}
                onCancel={() => setConfirmOpen(false)}
                onConfirm={async () => { setConfirmOpen(false); await confirmAction(); }}
            />
        </div>
    );
};

export default AdminAllocations;
