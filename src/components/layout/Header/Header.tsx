import { useState, type ChangeEvent } from 'react';
import { Search, Grid, List, Cloud } from 'lucide-react';
import './_Header.scss';

interface HeaderProps {
  onSearch: (query: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

export function Header({ onSearch, viewMode, onViewModeChange }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  return (
    <header className="header">
      <div className="header__brand">
        <Cloud size={24} />
        <span>LivingCloud</span>
      </div>
      <div className="header__search">
        <Search size={20} className="header__search-icon" />
        <input
          type="text"
          className="header__search-input"
          placeholder="Search files..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>
      <div className="header__actions">
        <div className="header__view-toggle">
          <button
            className={`header__view-button ${viewMode === 'grid' ? 'header__view-button--active' : ''}`}
            onClick={() => onViewModeChange('grid')}
            title="Grid view"
          >
            <Grid size={18} />
          </button>
          <button
            className={`header__view-button ${viewMode === 'list' ? 'header__view-button--active' : ''}`}
            onClick={() => onViewModeChange('list')}
            title="List view"
          >
            <List size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}

