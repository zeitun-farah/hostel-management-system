import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import PaymentModal from '../../components/common/PaymentModal';
import { initiatePayment } from '../../api/student';
import { fetchHostels } from '../../api/booking';
import { toast } from 'react-toastify';

const ActionButton = ({ label, disabled, color, onClick }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full py-2 rounded text-white font-medium cursor-pointer
      ${disabled ? "bg-gray-400" : color}`}
    >
        {label}
    </button>
);

const StudentActions = ({ data }) => {
    const navigate = useNavigate();
    const canBook =
        data.allocationStatus === "NOT_ALLOCATED" &&
        data.payment.status === "PAID";

    const [payOpen, setPayOpen] = useState(false);
    const [hostels, setHostels] = useState([]);

    const handleInitiate = async (payload) => {
        try {
            await initiatePayment(payload);
            toast.success('Payment initiated, awaiting admin confirmation');
            setPayOpen(false);
            // refresh page to reflect updated payment state
            window.location.reload();
        } catch (err) {
            console.error(err);
            toast.error(err?.response?.data?.message || 'Payment initiation failed');
        }
    };

    const loadHostels = async () => {
        try {
            // fetch hostels for student's gender if available
            const res = await fetchHostels();
            setHostels(res.data || []);
        } catch (err) {
            console.error('Failed to load hostels for payment', err);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>

            <div className="space-y-3">
                <ActionButton
                    label="Book Room"
                    disabled={!canBook}
                    color="bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                        if (canBook) navigate('/student/book-room');
                    }}
                />
                <ActionButton
                    label="View Payment"
                    disabled={false}
                    color="bg-green-600 hover:bg-green-700"
                    onClick={() => navigate('/student/dashboard')}
                />
                <ActionButton
                    label={data.payment?.status === 'PAID' ? 'Paid' : 'Make Payment'}
                    disabled={data.payment?.status === 'PAID'}
                    color="bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => { setPayOpen(true); loadHostels(); }}
                />
                <ActionButton
                    label="Vacate Room"
                    disabled={data.allocationStatus !== "ALLOCATED"}
                    color="bg-red-600 hover:bg-red-700"
                    onClick={() => {
                        /* Student vacate flow handled on StudentActions card or StudentDashboard; implement if needed */
                    }}
                />
            </div>
            <PaymentModal
                isOpen={payOpen}
                hostels={hostels}
                onCancel={() => setPayOpen(false)}
                onSubmit={handleInitiate}
            />
        </div>
    );
};

export default StudentActions;
