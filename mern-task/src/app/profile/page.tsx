'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';

export default function Profile() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleStartGame = () => {
    router.push('/game');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
        <div className="md:flex">
          <div className="md:flex-shrink-0 p-6 flex items-center justify-center">
            {session.user?.image ? (
              <div className="h-48 w-48 relative rounded-full overflow-hidden">
                <Image
                  src={session.user.image}
                  alt="Profile"
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="h-48 w-48 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-4xl text-gray-500">{session.user?.name?.charAt(0)}</span>
              </div>
            )}
          </div>
          <div className="p-8 w-full">
            <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">
              User Profile
            </div>
            <h2 className="mt-2 text-2xl font-bold text-gray-900">{session.user?.name}</h2>
            <p className="mt-2 text-gray-600">{session.user?.email}</p>
            
            <div className="mt-6 border-t border-gray-200 pt-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">First Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{session.user?.firstName}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{session.user?.lastName}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone Number</dt>
                  <dd className="mt-1 text-sm text-gray-900">{session.user?.phoneNumber}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Birthdate</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {session.user?.birthdate ? new Date(session.user.birthdate).toLocaleDateString() : 'N/A'}
                  </dd>
                </div>
              </dl>
            </div>
            
            <div className="mt-8">
              <button
                onClick={handleStartGame}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Start Game
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}