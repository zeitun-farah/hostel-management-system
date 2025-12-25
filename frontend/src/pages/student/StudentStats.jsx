import StatCard from './StatCard';

const StudentStats = ({ data }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
                title="Allocation Status"
                value={data.allocationStatus}
            />
            <StatCard
                title="Hostel"
                value={data.room ? data.room.hostel : "N/A"}
            />
            <StatCard
                title="Payment Status"
                value={data.payment.status}
            />
        </div>
    );
};

export default StudentStats;
