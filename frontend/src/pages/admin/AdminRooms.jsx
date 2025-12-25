import { useEffect, useState } from "react";
import { getAdminRooms, getAdminHostels, createRoom, deleteRoom } from "../../api/admin";

const AdminRooms = () => {
    const [rooms, setRooms] = useState([]);
    const [hostels, setHostels] = useState([]);
    const [roomNumber, setRoomNumber] = useState("");
    const [capacity, setCapacity] = useState(2);
    const [hostelId, setHostelId] = useState("");

    const load = async () => {
        const r = await getAdminRooms();
        const h = await getAdminHostels();
        setRooms(r.data);
        setHostels(h.data);
    };

    useEffect(() => {
        load();
    }, []);

    const submit = async () => {
        await createRoom({ roomNumber, capacity, hostelId });
        setRoomNumber("");
        setCapacity(4);
        setHostelId("");
        await load();
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h2 className="font-semibold mb-4 text-lg">Manage Rooms</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
                <input
                    className="border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    placeholder="Room #"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                />
                <input
                    type="number"
                    className="border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                />
                <select className="border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-200" value={hostelId} onChange={(e) => setHostelId(e.target.value)}>
                    <option value="">Select hostel</option>
                    {hostels.map((h) => (
                        <option key={h.id} value={h.id}>
                            {h.name}
                        </option>
                    ))}
                </select>
                <button onClick={submit} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md shadow cursor-pointer">
                    Add
                </button>
            </div>

            <ul className="space-y-3">
                {rooms.map((r) => (
                    <li key={r.id} className="flex items-center justify-between bg-gray-50 rounded-md px-4 py-3">
                        <span className="text-sm text-gray-800">
                            <span className="font-medium">{r.roomNumber}</span> — <span className="text-gray-600">{r.Hostel?.name}</span>
                        </span>
                        <button onClick={() => deleteRoom(r.id).then(load)} className="text-red-600 font-medium cursor-pointer">Delete</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default AdminRooms;
