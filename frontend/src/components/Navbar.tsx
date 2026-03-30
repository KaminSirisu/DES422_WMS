import React from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const [ location, setLocation ] = useLocation();
  const { logoutUser } = useAuth();

  return (
    <nav className="bg-gray-800 p-4 text-white flex justify-between items-center ">
      <div className="font-bold text-xl">DES422 Warehouse</div>
      <div className='flex flex-row gap-3'>
        <button
          onClick={() => setLocation('/login')}
          className={` hover:text-gray-300 ${location === '/login' ? 'underline' : ''}`}
        >
          Login
        </button>
        <button
          onClick={() => setLocation('/logs')}
          className={` hover:text-gray-300 ${location === '/logs' ? 'underline' : ''}`}
        >
          Logs
        </button>
        <button 
          onClick={logoutUser}
          className='hover:text-gray-300'>
          Logout
        </button>
      </div>
    </nav>
  )
}

export default Navbar