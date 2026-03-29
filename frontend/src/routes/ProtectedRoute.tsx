import React from 'react';
import { Route, Redirect } from 'wouter';
import { useAuth } from '../context/AuthContext';

interface Props {
    path: string;
    component: React.ComponentType<any>;
}


const ProtectedRoute: React.FC<Props> = ({ path, component: Component }) => {
  const { isAuthenticated } = useAuth();

  return (
    <Route path={path}>
        {isAuthenticated ? <Component /> : <Redirect to='/login' />}
    </Route>
  )
}

export default ProtectedRoute