import { type AuthUser } from 'wasp/auth';
import { FC, ReactNode, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

interface Props {
  user: AuthUser;
  children?: ReactNode;
}

const DefaultLayout: FC<Props> = ({ children, user }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user.isAdmin) {
    return <Navigate to='/' replace />;
  }

  return (
    <div className='bg-background text-foreground'>
      <div className='flex min-h-screen overflow-hidden'>
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className='relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden'>
          {/* Mobile hamburger button for sidebar */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className='lg:hidden fixed top-20 left-4 z-40 p-2 bg-background border border-border rounded-md shadow-sm hover:bg-accent transition-colors'
            aria-label='Toggle sidebar'
          >
            <Menu className='h-5 w-5' />
          </button>
          
          <main className='flex-1'>
            <div className='mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10'>{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DefaultLayout;
