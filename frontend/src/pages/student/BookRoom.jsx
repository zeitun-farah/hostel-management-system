import { useEffect, useState } from "react";
import { fetchHostels, fetchAvailableRooms, bookRoom } from "../../api/booking";
import { useAuth } from "../../context/AuthContext";
import HostelCard from "./HostelCard";
import RoomCard from "./RoomCard";

const BookRoom = () => {
    const { user } = useAuth();

    const [hostels, setHostels] = useState([]);
    const [selectedHostel, setSelectedHostel] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // defensive: wait until user is available
        if (!user) return;

        setLoading(true);
        fetchHostels(user.gender)
            .then((res) => setHostels(res.data))
            .catch((err) => {
                console.error('Failed to fetch hostels:', err);
            })
            .finally(() => setLoading(false));
    }, [user]);

    const handleHostelSelect = async (hostel) => {
        setSelectedHostel(hostel);
        const res = await fetchAvailableRooms(hostel.id);
        setRooms(res.data);
    };

    const handleBooking = async (roomId) => {
        try {
            await bookRoom(roomId);
            // use toast for consistent UI feedback
            // import is not present here, so add dynamic import
            const { toast } = await import('react-toastify');
            toast.success('Room booked successfully');
            // refresh room list to reflect occupied change
            if (selectedHostel) {
                const r = await fetchAvailableRooms(selectedHostel.id);
                setRooms(r.data);
            }
        } catch (err) {
            console.error(err);
            const { toast } = await import('react-toastify');
            toast.error(err?.response?.data?.message || 'Booking failed');
        }
    };

    if (loading) {
        return <div className="p-6">Loading hostels...</div>;
    }

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <h1 className="text-2xl font-bold mb-4">
                Book a Room
            </h1>

            {!selectedHostel && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {hostels.map((h) => (
                        <HostelCard
                            key={h.id}
                            hostel={h}
                            onSelect={handleHostelSelect}
                        />
                    ))}
                </div>
            )}

            {selectedHostel && (
                <>
                    <button
                        onClick={() => setSelectedHostel(null)}
                        className="mb-4 text-blue-600 cursor-pointer"
                    >
                        ← Back to hostels
                    </button>

                    <h2 className="text-xl font-semibold mb-3">
                        Available Rooms in {selectedHostel.name}
                    </h2>

                    <div className="space-y-3">
                        {rooms.length === 0 && (
                            <p className="text-gray-500">
                                No rooms available.
                            </p>
                        )}

                        {rooms.map((room) => (
                            <RoomCard
                                key={room.id}
                                room={room}
                                onBook={handleBooking}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default BookRoom;
