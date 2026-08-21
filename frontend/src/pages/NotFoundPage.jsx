/**
 * NotFoundPage — 404
 */
import { Link } from 'react-router-dom';
import NmButton from '../components/NmButton';

const NotFoundPage = () => (
  <main className="flex-1 flex flex-col items-center justify-center gap-6 px-6 nm-animate-in">
    <div className="text-center">
      <p className="text-8xl font-black nm-gradient-text mb-2">404</p>
      <h1 className="text-2xl font-bold text-[var(--nm-text-primary)] mb-2">Page not found</h1>
      <p className="text-[var(--nm-text-secondary)]">
        The page you're looking for doesn't exist or has been moved.
      </p>
    </div>
    <Link to="/generate">
      <NmButton variant="primary" label="Go to Generator" icon="pi pi-home" />
    </Link>
  </main>
);

export default NotFoundPage;
