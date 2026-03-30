import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { signup } from '../services/api';
import { useLocation } from 'wouter';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const RegisterPage: React.FC = () => {
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [ , setLocation ] = useLocation();

    const validatePassword = (password: string) => {
        const regex = /^(?=.*[!@#$%^&*(),.?":{}|<>-]).{8,}$/;
        return regex.test(password);
    };

    const handleSubmit = async (e:React.FormEvent) => {
        e.preventDefault();

        if (!validatePassword(password)) {
            toast.error("Password must be at least 8 characters and include a special character.");
            return;
        }

        // Check Password match
        if (password != confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        try {
            setLoading(true);
            await signup(username, email, password);
            toast.success("Signup successful! Please login.")
            // Handle successful registration (e.g., redirect to login page)
            setLocation('/login');
        } catch (err: any) {
            console.error("Registration error:", err);
            toast.error(err.response?.data?.message || "Signup failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='min-h-screen flex items-center justify-center bg-gray-100'>
            <div className='bg-white p-8 rounded-lg shadow-md w-full max-w-md'>
                <h2 className='text-2xl font-bold text-center mb-4'>Create New Account</h2>
                <h3 className='text-sm text-gray-600 mb-2'>Enter your details below</h3>

                <form onSubmit={handleSubmit}>
                    <div className='mb-4'>
                        <input
                            type='text'
                            id='username'
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className='shadow appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline'
                            placeholder='Username'
                        />
                    </div>
                    <div className='mb-4'>
                        <input
                            type='email'
                            id='email'
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className='shadow appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline'
                            placeholder='Email'
                        />
                    </div>
                    <div className='mb-4 relative'>
                        
                        <input
                            type={showPassword ? 'text' : 'password'}
                            id='password'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className='shadow appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline'
                            placeholder='Password'
                            minLength={8}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className='absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500'
                        >
                            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                        </button>
                    </div>
                    <div className='mb-6 relative'>
                        
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            id='confirmPassword'
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className='shadow appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline'
                            placeholder='Confirm Password'
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className='absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500'
                        >
                            {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                        </button>
                    </div>
                    <div className='mb-4'>
                        <button
                            type='submit'
                            disabled={loading}
                            className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline w-full'
                        >
                            {loading ? "Signing up..." : "Sign Up"}
                        </button>
                    </div>
                    <div className='justify-center flex flex-row gap-1'>
                        <h1 className='text-sm'>Already have an account?</h1>
                        <a href="/login" className='text-blue-500 hover:text-blue-700 text-sm'>
                            Log in
                        </a>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default RegisterPage