import React, { useState } from 'react';

const PaymentModal = ({ isOpen, onCancel, onSubmit, defaultAmount, hostels = [] }) => {
    const [selectedHostel, setSelectedHostel] = useState(hostels.length ? hostels[0].id : '');
    const [option, setOption] = useState('SEMESTER');
    const [reference, setReference] = useState('');

    // compute amount from selected hostel and option
    const getAmount = () => {
        const h = hostels.find((x) => String(x.id) === String(selectedHostel));
        if (!h) return '';
        const fee = Number(h.feeAmount || 0);
        return option === 'FULL_YEAR' ? (fee * 2).toFixed(2) : fee.toFixed(2);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded shadow-lg w-11/12 max-w-md p-6">
                <h3 className="text-lg font-semibold mb-2">Make Payment</h3>

                <div className="mb-3">
                    <label className="block text-sm text-gray-600 mb-1">Hostel</label>
                    <select
                        className="w-full border p-2 rounded"
                        value={selectedHostel}
                        onChange={(e) => setSelectedHostel(e.target.value)}
                    >
                        <option value="">Select hostel to pay for</option>
                        {hostels.map((h) => (
                            <option key={h.id} value={h.id}>{h.name} — {h.gender} — {h.feeAmount}</option>
                        ))}
                    </select>
                </div>

                <div className="mb-3">
                    <label className="block text-sm text-gray-600 mb-1">Payment Option</label>
                    <div className="flex gap-4 items-center">
                        <label className="inline-flex items-center">
                            <input type="radio" name="option" value="SEMESTER" checked={option === 'SEMESTER'} onChange={() => setOption('SEMESTER')} />
                            <span className="ml-2">Semester</span>
                        </label>
                        <label className="inline-flex items-center">
                            <input type="radio" name="option" value="FULL_YEAR" checked={option === 'FULL_YEAR'} onChange={() => setOption('FULL_YEAR')} />
                            <span className="ml-2">Full Year (2 semesters)</span>
                        </label>
                    </div>
                </div>

                <div className="mb-3">
                    <label className="block text-sm text-gray-600 mb-1">Amount</label>
                    <input
                        type="text"
                        readOnly
                        className="w-full border p-2 rounded bg-gray-50"
                        value={getAmount()}
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm text-gray-600 mb-1">Mpesa Reference Code</label>
                    <input
                        type="text"
                        className="w-full border p-2 rounded"
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        placeholder="Payment reference or transaction id"
                    />
                </div>

                <div className="flex justify-end gap-3">
                    <button onClick={onCancel} className="px-4 py-2 rounded border">Cancel</button>
                    <button
                        onClick={() => onSubmit({ hostelId: selectedHostel, option, reference })}
                        disabled={!selectedHostel}
                        className={`px-4 py-2 rounded ${!selectedHostel ? 'bg-gray-300 text-gray-600' : 'bg-blue-600 text-white'}`}
                    >
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
