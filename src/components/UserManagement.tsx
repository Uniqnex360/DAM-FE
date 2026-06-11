import React, { useState, useEffect } from "react";
import { UserPlus, Edit, Trash2, X, Check } from "lucide-react";
import { userService } from "../services/userService";
import { User, UserCreate } from "../types/interface";
import { toast } from "sonner"; // Use your existing notification library

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<UserCreate>>({
    email: "",
    full_name: "",
    password: "",
    role: "user",
    is_active: true,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await userService.getAll();
      setUsers(data);
    } catch (err: any) {
      toast.error(err.message || "Error loading users");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await userService.update(editingId, formData);
        toast.success("User updated successfully");
      } else {
        await userService.create(formData as UserCreate);
        toast.success("User created successfully");
      }
      resetForm();
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      email: "",
      full_name: "",
      password: "",
      role: "user",
      is_active: true,
    });
  };

  const handleEdit = (user: User) => {
    setFormData({
      email: user.email,
      full_name: user.full_name || "",
      role: user.role,
      is_active: user.is_active,
    });
    setEditingId(user.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Permanently delete this user?")) return;
    try {
      await userService.delete(id);
      toast.success("User deleted successfully");
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <UserPlus size={18} /> Add User
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-xl shadow-md mb-8 border border-gray-200"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              className="border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Full Name"
              value={formData.full_name}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
              className="border p-2 rounded"
            />
            <input
              type="password"
              placeholder={
                editingId ? "Leave blank to keep same" : "Password"
              }
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required={!editingId}
              className="border p-2 rounded"
            />
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              className="border p-2 rounded"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Save User
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4">User</th>
              <th className="p-4">Role</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b hover:bg-gray-50">
                <td className="p-4">
                  <div className="font-bold">{u.full_name || "N/A"}</div>
                  <div className="text-sm text-gray-500">{u.email}</div>
                </td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-bold ${
                      u.role === "admin"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {u.role.toUpperCase()}
                  </span>
                </td>
                <td className="p-4">
                  {u.is_active ? (
                    <Check className="text-green-500" />
                  ) : (
                    <X className="text-red-500" />
                  )}
                </td>
                <td className="p-4 text-right flex justify-end gap-2">
                  <button
                    onClick={() => handleEdit(u)}
                    className="p-2 hover:bg-blue-50 text-blue-600 rounded"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(u.id)}
                    className="p-2 hover:bg-red-50 text-red-600 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}