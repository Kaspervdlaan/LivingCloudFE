import type { User } from '../../../types/auth';
import { User as UserIcon } from 'lucide-react';
import './_UserList.scss';

interface UserListProps {
  users: User[];
  onUserClick: (user: User) => void;
}

export function UserList({ users, onUserClick }: UserListProps) {
  return (
    <div className="user-list">
      {users.map((user) => (
        <div
          key={user.id}
          className="user-item"
          onClick={() => onUserClick(user)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onUserClick(user);
            }
          }}
        >
          <div className="user-item__icon">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="user-item__avatar" />
            ) : (
              <UserIcon size={48} />
            )}
          </div>
          <div className="user-item__info">
            <div className="user-item__name">{user.name || user.email}</div>
            <div className="user-item__email">{user.email}</div>
            <div className="user-item__id">ID: {user.id}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

