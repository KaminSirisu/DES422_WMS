import React, { useState, useEffect } from 'react';
import { getLogs } from '../services/api';

interface Log {
    id: number;
    userId: number;
    itemId: number;
    locationId: number;
    quantity: number;
    action: string;
    createdAt: string;
    user?: { username: string };
    item?: { name: string };
}

// React.FC help to define that this is Functional Component, with props in it.
const LogsTable: React.FC = () => {
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const data = await getLogs();
                setLogs(data);
                setLoading(false);
            } catch (err: any) {
                console.log("Error fetching logs:", err);
                setError(err.response?.data?.message || "Failed to fetch logs");
                setLoading(false);
            }
        }
        fetchLogs();
    }, []);

    if (loading) return <div className='p-4 text-center text-gray-600'>Loading logs...</div>
    if (error) return <div className='p-4 text-center text-red-500'>Error: {error}</div>
    

    return (
        <div className='p-6'>
            <h2 className='text-2xl font-bold mb-4 text-gray-800'>System Logs</h2>
            <div className='overflow-x-auto bg-white rounded-lg shadow'>
                <table className='min-w-full table-auto'>
                    <thead className='bg-gray-50'>
                        <tr>
                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>ID</th>
                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Action</th>
                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>User</th>
                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Item</th>
                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Quantity</th>
                            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Date</th>
                        </tr>
                    </thead>
                    <tbody className='bg-white divide-y divide-gray-200'>
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan={6} className='px-6 py-4 text-center text-sm text-gray-500'></td>
                            </tr>
                        ): (
                            logs.map((log) => (
                                <tr key={log.id} className='hover:bg-gray-50'>
                                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>{log.id}</td>
                                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${log.action === 'ADD' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                                        {log.user?.username || `User ${log.userId}`}
                                    </td>
                                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                                        {log.item?.name || `Item ${log.itemId}`}
                                    </td>
                                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium'>
                                        {log.quantity}
                                    </td>
                                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                                        {new Date(log.createdAt).toLocaleString()}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default LogsTable