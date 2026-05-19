'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/request-service', label: 'Request Service' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/test-tools', label: 'Test Tools' },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav>
      <span className="brand">Prowider</span>
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={pathname === href ? 'active' : ''}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
