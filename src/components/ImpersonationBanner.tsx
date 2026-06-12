import React, { useState, useCallback } from "react";
import { LogOut, User, Loader2, Users } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "../lib/utils";

interface ImpersonationBannerProps {
  onSwitchUser?: () => void;
}

export const ImpersonationBanner: React.FC<ImpersonationBannerProps> = ({ onSwitchUser }) => {
  const { impersonationState, stopImpersonation } = useAuth();
  const [isStopping, setIsStopping] = useState(false);

  const handleStopImpersonation = useCallback(async () => {
    if (isStopping) return;
    setIsStopping(true);
    try {
      await stopImpersonation(() => {
        window.location.reload();
      });
    } catch (error) {
    } finally {
      setIsStopping(false);
    }
  }, [stopImpersonation, isStopping]);

  if (!impersonationState.isActive) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-amber-700">
          <User size={16} className="flex-shrink-0" />
          <span className="text-sm font-medium">
            You are impersonating{" "}
            <span className="font-mono font-bold">
              {impersonationState.impersonatedUserEmail || "a user"}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          {onSwitchUser && (
            <button
              onClick={onSwitchUser}
              className="flex items-center gap-1.5 text-sm font-medium text-amber-700 hover:text-amber-900 transition-colors"
            >
              <Users size={14} />
              <span>Switch User</span>
            </button>
          )}
          <button
            onClick={handleStopImpersonation}
            disabled={isStopping}
            className={cn(
              "flex items-center gap-1.5 text-sm font-medium transition-colors",
              "text-amber-700 hover:text-amber-900 disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isStopping ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <LogOut size={14} />
            )}
            <span>Back to Admin</span>
          </button>
        </div>
      </div>
    </div>
  );
};