import { useAuth, useWallet } from "@dag-kit/react-rn";

export function UserProfile() {
  const { user, logout, isAuthenticated } = useAuth();
  const { address } = useWallet();

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="user-profile-card">
      <div className="profile-header">
        {user.picture && <img src={user.picture} alt={user.name} />}
        <div>
          <h3>{user.name || user.email}</h3>
          <p className="provider-badge">{user.provider}</p>
        </div>
      </div>

      <div className="profile-info">
        <div className="info-row">
          <span>Email:</span>
          <span>{user.email}</span>
        </div>
        {address && (
          <div className="info-row">
            <span>Wallet:</span>
            <span>
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
          </div>
        )}
        <div className="info-row">
          <span>Member since:</span>
          <span>{new Date(user.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <button onClick={logout} className="logout-btn">
        Logout
      </button>
    </div>
  );
}
