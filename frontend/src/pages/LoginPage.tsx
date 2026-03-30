import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { login, setAuthToken } from '../services/api';
import { useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [ , setLocation ] = useLocation();
    const { loginUser } = useAuth();
    //const [token, setToken] = useState<string>('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await login(username, password);
            setAuthToken(response.token);
            toast.success('Login successful!');
            loginUser(response.token);
            // Redirect to a Dashboard or Home page after login if needed
            setLocation('/Dashboard');
        } catch (err: any) {
            console.error("Login error:", err);
            toast.error(err.response?.data?.message || 'Failed to login. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className='min-h-screen flex items-center justify-center bg-gray-100'>
            <div className='bg-white p-8 rounded-lg shadow-md w-full max-w-md'>
                <h2 className='text-2xl font-bold text-center text-gray-800 mb-4'>Warehouse Management System</h2>
                <h3 className='text-sm text-gray-600 mb-2'>Enter your details below</h3>
                <form onSubmit={handleSubmit}>
                    <div className='mb-4'>
                        <input
                            type="text"
                            id="username"
                            className='shadow appearance-none border border-gray-300 rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline w-full'
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder='Username'
                            required
                        />
                        
                    </div>
                    <div className='mb-6'>
                        <input
                            type="password"
                            id="password"
                            className='shadow appearance-none border border-gray-300 rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline w-full'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder='Password'
                            required
                        />
                    </div>
                    <div className='flex items-center justify-between mb-4'>
                        <button
                            type="submit"
                            className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline disabled:opacity-50 w-full'
                            disabled={loading}
                        >
                            {loading ? 'Logging in...' : 'Sign In'}
                        </button>
                    </div>
                    <div className='justify-center flex flex-row gap-1'>
                        <h1 className='text-sm'>Don't have an account?</h1>
                        <a href="/register" className='text-blue-500 hover:text-blue-700 text-sm'>
                            Sign up
                        </a>
                    </div>
                    
                </form>
                
            </div>
        </div>
    )
}

export default LoginPage;