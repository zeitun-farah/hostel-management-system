import { useEffect, useState } from "react";
import {
    getAdminHostels,
    createHostel,
    updateHostel,
    deleteHostel,
} from "../../api/admin";
import ConfirmModal from "../../components/common/ConfirmModal";
import { toast } from "react-toastify";

const AdminHostels = () => {
    const [hostels, setHostels] = useState([]);
    const [loading, setLoading] = useState(true);

    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: "", gender: "Male", totalRooms: "", feeAmount: "" });

    const load = async () => {
        setLoading(true);
        try {
            const res = await getAdminHostels();
            setHostels(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const startEdit = (h) => {
        setEditing(h.id);
        setForm({ name: h.name, gender: h.gender, totalRooms: h.totalRooms || 0, feeAmount: h.feeAmount ?? 0 });
    };

    const resetForm = () => {
        setEditing(null);
        setForm({ name: "", gender: "Male", totalRooms: "", feeAmount: "" });
    };

    const submit = async (e) => {
        e.preventDefault();
        try {
            if (editing) {
                await updateHostel(editing, form);
            } else {
                await createHostel(form);
            }
            await load();
            resetForm();
        } catch (err) {
            console.error(err);
            toast.error("Failed to save hostel");
        }
    };

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmTitle, setConfirmTitle] = useState("");
    const [confirmMessage, setConfirmMessage] = useState("");
    const [confirmAction, setConfirmAction] = useState(() => async () => { });

    const handleDelete = (id) => {
        setConfirmTitle("Delete hostel?");
        setConfirmMessage("This will permanently delete the hostel and related rooms.");
        setConfirmAction(() => async () => {
            try {
                await deleteHostel(id);
                await load();
                toast.success("Hostel deleted");
            } catch (err) {
                console.error(err);
                toast.error("Delete failed");
            }
        });
        setConfirmOpen(true);
    };

    if (loading) return <div className="p-4">Loading hostels...</div>;

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h2 className="font-semibold mb-4 text-lg">Manage Hostels</h2>

            <div className="grid grid-cols-1 gap-4 mb-6">
                <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                    <input
                        name="name"
                        placeholder="Hostel name"
                        className="border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        required
                    />
                    <select
                        name="gender"
                        value={form.gender}
                        onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                        className="border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    >
                        <option>Male</option>
                        <option>Female</option>
                    </select>
                    <input
                        name="totalRooms"
                        type="number"
                        min={0}
                        className="border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        value={form.totalRooms}
                        onChange={(e) => setForm((f) => ({ ...f, totalRooms: Number(e.target.value) }))}
                    />
                    <input
                        name="feeAmount"
                        type="number"
                        step="0.01"
                        min={0}
                        placeholder="Fee amount (per semester)"
                        className="border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        value={form.feeAmount}
                        onChange={(e) => setForm((f) => ({ ...f, feeAmount: e.target.value }))}
                    />
                    <div>
                        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md shadow">
                            {editing ? "Update Hostel" : "Create Hostel"}
                        </button>
                        {editing && (
                            <button type="button" onClick={resetForm} className="ml-3 px-4 py-2 border border-gray-200 rounded-md cursor-pointer">
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="max-h-72 overflow-y-auto rounded-md">
                <table className="w-full text-sm divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                        <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Gender</th>
                            <th className="px-4 py-3">Total Rooms</th>
                            <th className="px-4 py-3">Fee (per sem)</th>
                            <th className="px-4 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {hostels.map((h) => (
                            <tr key={h.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">{h.name}</td>
                                <td className="px-4 py-3">{h.gender}</td>
                                <td className="px-4 py-3">{h.totalRooms ?? "-"}</td>
                                <td className="px-4 py-3">{h.feeAmount ?? "-"}</td>
                                <td className="px-4 py-3">
                                    <button onClick={() => startEdit(h)} className="text-indigo-600 mr-3 font-medium cursor-pointer">Edit</button>
                                    <button onClick={() => handleDelete(h.id)} className="text-red-600 font-medium cursor-pointer">Delete</button>
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

export default AdminHostels;
