
import { Route, Switch, Redirect } from 'wouter';
import 'react-toastify/dist/ReactToastify.css';
import './App.css'

import LoginPage from './pages/LoginPage';
import Navbar from './components/Navbar';
import LogsTable from './components/LogsTable';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';

import { useAuth } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';


function App() {
 
  const { isAuthenticated } = useAuth();

  return (
    <div className='min-h-screen bg-gray-100'>
      <Navbar />
      <main className='p-4'>
        <Switch>
          {/* Login Route */}
          <Route path='/login' >
            { isAuthenticated ? <Redirect to='/dashboard' /> : <LoginPage /> }
          </Route>

          <Route path='/register' >
            { isAuthenticated ? <Redirect to='/dashboard' /> : <RegisterPage /> }
          </Route>

          {/* Protected Route */}
          <ProtectedRoute path='/dashboard' component={DashboardPage} />
          <ProtectedRoute path='/logs' component={LogsTable} />

          {/* Public Route */}
          <Route path='/'>
            {() => 
              isAuthenticated
                ? <Redirect to='/dashboard' />
                : <Redirect to='/login' />
            }
          </Route>

          <Route>
            <div className='text-center mt-10'>
              <h2 className="text-2xl font-bold text-gray-800">404: Page Not Found</h2>
              <p className="text-gray-600 mt-2">The page you are looking for does not exist.</p>
            </div>
          </Route>
        </Switch>
      </main>

    </div>
  )
}

export default App
