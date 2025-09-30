'use client';

import dynamic from 'next/dynamic';

// Dynamically import the HomePage component with no SSR
const HomePage = dynamic(() => import('@/app/components/HomePage'), {
  ssr: false,
});

export default function Home() {
  return <HomePage />;
}
