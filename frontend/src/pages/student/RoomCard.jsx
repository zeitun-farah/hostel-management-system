const RoomCard = ({ room, onBook }) => {
    return (
        <div className="bg-white p-4 rounded shadow flex justify-between items-center">
            <div>
                <p className="font-semibold text-gray-800">
                    Room {room.roomNumber}
                </p>
                <p className="text-sm text-gray-500">
                    Capacity: {room.capacity}
                </p>
            </div>

            <button
                onClick={() => onBook(room.id)}
                className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 cursor-pointer"
            >
                Book
            </button>
        </div>
    );
};

export default RoomCard;
