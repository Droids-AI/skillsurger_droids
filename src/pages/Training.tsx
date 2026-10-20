import { Navigate, useLocation } from 'react-router-dom';

export default function Training() {
  const { search } = useLocation();
  return <Navigate to={{ pathname: '/job-search-copilot-webinar', search }} replace />;
}
