import React, { useState, useEffect } from "react";
import { Users, ChevronDown, Check } from "lucide-react";
import { userService } from "../services/userService";
import { User } from "../types/interface";
import { useAuth } from "../contexts/AuthContext";
import { useUserSelection } from "../contexts/UserSelectionContext";

interface UserSelectorProps {
  className?: string;
}

export const UserSelector: React.FC<UserSelectorProps> = ({ className = "" }) => {
  const { selectedUserId, setSelectedUserId } = useUserSelection();
  const { isImpersonating, userRole } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const shouldShowSelector = userRole === "admin" && !isImpersonating;

  useEffect(() => {
    if (shouldShowSelector) {
      const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await userService.getAll();
                const nonAdminUsers = data.filter(u => u.role !== 'admin');
          setUsers(nonAdminUsers);
        } catch (error) {
          console.error("Failed to load users:", error);
        } finally {
          setLoading(false);
        }
      };
      loadUsers();
    }
  }, [shouldShowSelector]);

  if (!shouldShowSelector) return null;

  const selectedUser = users.find((u) => u.id === selectedUserId);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
      >
        <Users size={18} className="text-slate-500" />
        <span className="text-sm font-medium text-slate-700">
          {selectedUser ? selectedUser.email : "All Users"}
        </span>
        <ChevronDown size={16} className="text-slate-400" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
            <button
              onClick={() => {
                setSelectedUserId(null);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center justify-between ${
                !selectedUserId ? "bg-blue-50 text-blue-600" : "text-slate-700"
              }`}
            >
              <span>All Users</span>
              {!selectedUserId && <Check size={16} />}
            </button>
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => {
                  setSelectedUserId(user.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center justify-between ${
                  selectedUserId === user.id ? "bg-blue-50 text-blue-600" : "text-slate-700"
                }`}
              >
                <span className="truncate">{user.email}</span>
                {selectedUserId === user.id && <Check size={16} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};