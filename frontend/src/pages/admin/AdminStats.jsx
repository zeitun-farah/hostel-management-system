const Stat = ({ label, value }) => (
    <div className="bg-linear-to-r from-indigo-600 to-purple-600 text-white p-5 rounded-xl shadow-lg border border-indigo-50">
        <p className="text-indigo-100/90 text-sm">{label}</p>
        <h2 className="text-3xl font-extrabold mt-2">{value}</h2>
    </div>
);

const AdminStats = ({ stats }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Hostels" value={stats.totalHostels} />
        <Stat label="Rooms" value={stats.totalRooms} />
        <Stat label="Allocated Students" value={stats.totalAllocations} />
        <Stat label="Available Rooms" value={stats.availableRooms} />
    </div>
);

export default AdminStats;
