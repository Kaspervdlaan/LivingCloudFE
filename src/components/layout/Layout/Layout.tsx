import { ReactNode } from 'react';
import { Header } from '../Header/Header';
import { Sidebar } from '../Sidebar/Sidebar';
import './_Layout.scss';

interface LayoutProps {
  children: ReactNode;
  onSearch: (query: string) => void;
  onUpload: () => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

export function Layout({ children, onSearch, onUpload, viewMode, onViewModeChange }: LayoutProps) {
  return (
    <div className="layout">
      <Header
        onSearch={onSearch}
        onUpload={onUpload}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
      />
      <div className="layout__body">
        <Sidebar />
        <main className="layout__main">{children}</main>
      </div>
    </div>
  );
}

