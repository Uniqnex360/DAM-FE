import React, { useState, useEffect, useCallback } from "react";
import { X, Search, Loader2, UserCheck } from "lucide-react";
import { userService } from "../services/userService";
import { User } from "../types/interface";
import { cn } from "../lib/utils";

interface SwitchUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (userId: string, userEmail: string) => Promise<void>;
}

export const SwitchUserModal: React.FC<SwitchUserModalProps> = ({
  isOpen,
  onClose,
  onSelectUser,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await userService.getAll();
      setUsers(data.filter(u => u.role !== "admin"));
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      setSearch("");
      setSelectedUserId(null);
    }
  }, [isOpen, loadUsers]);

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      (user.full_name && user.full_name.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSwitch = async () => {
    if (!selectedUserId) return;
    const selectedUser = users.find(u => u.id === selectedUserId);
    if (!selectedUser) return;
    
    setSwitching(true);
    try {
      await onSelectUser(selectedUserId, selectedUser.email);
      onClose();
    } catch (error) {
      // Error handled in parent
    } finally {
      setSwitching(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold">Switch to another user</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-y-auto max-h-96 p-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No users found</div>
          ) : (
            filteredUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedUserId(user.id)}
                className={cn(
                  "w-full text-left p-3 rounded-lg transition-colors mb-1",
                  selectedUserId === user.id
                    ? "bg-blue-50 border border-blue-200"
                    : "hover:bg-gray-50 border border-transparent"
                )}
              >
                <div className="font-medium">{user.full_name || "No name"}</div>
                <div className="text-sm text-gray-500">{user.email}</div>
              </button>
            ))
          )}
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSwitch}
            disabled={!selectedUserId || switching}
            className={cn(
              "px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 transition-colors",
              "hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {switching ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Switching...
              </>
            ) : (
              <>
                <UserCheck size={16} />
                Switch
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};