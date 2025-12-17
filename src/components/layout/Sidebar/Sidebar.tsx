import { FolderTree } from '../../files/FolderTree/FolderTree';
import { useFilesStore } from '../../../store/useFilesStore';
import './_Sidebar.scss';

export function Sidebar() {
  const currentFolderId = useFilesStore((state) => state.currentFolderId);

  return (
    <aside className="sidebar">
      <div className="sidebar__section">
        <h3 className="sidebar__title">Folders</h3>
        <FolderTree currentFolderId={currentFolderId} />
      </div>
    </aside>
  );
}

