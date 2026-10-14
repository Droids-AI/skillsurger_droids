import { useUser } from '../context/UserContext';

export default function ProfileProtectedRoute({ children }: { children: React.ReactNode }) {
  const { loading } = useUser();
  if (loading) return <p role="status" className="p-8">Loading your profile…</p>;
  // ProtectedRoute verifies authentication. Profile access does not require a paid plan.
  return <>{children}</>;
}
