import { useLocation, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';

export const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) return null;

  return (
    <nav className="flex items-center space-x-2 font-mono text-[10px] tracking-widest text-white/40 mb-8">
      <Link to="/" className="hover:text-white transition-colors ">
        HOME
      </Link>
      {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;

        return (
          <div key={to} className="flex items-center space-x-2">
            <ChevronRight size={10} className="text-white/20" />
            {last ? (
              <span className="text-neon-pink uppercase">{value.replace(/-/g, '_')}</span>
            ) : (
              <Link to={to} className="hover:text-white transition-colors uppercase">
                {value.replace(/-/g, '_')}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
};
