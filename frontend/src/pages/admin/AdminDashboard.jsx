import { useEffect, useState } from "react";
import { getAdminDashboard } from "../../api/admin";
import AdminStats from "./AdminStats";
import AdminHostels from "./AdminHostels";
import AdminRooms from "./AdminRooms";
import AdminAllocations from "./AdminAllocations";
import AdminStudents from "./AdminStudents";
import AdminPayments from "./AdminPayments";

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        getAdminDashboard().then((res) => setStats(res.data));
    }, []);

    if (!stats) return <div className="p-6">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

                <div className="space-y-6">
                    <section>
                        <AdminStats stats={stats} />
                    </section>

                    <section>
                        <AdminHostels />
                    </section>

                    <section>
                        <AdminRooms />
                    </section>

                    <section>
                        <AdminAllocations />
                    </section>

                    <section>
                        <AdminStudents />
                    </section>

                    <section>
                        <AdminPayments />
                    </section>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
