"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "./Logo";
import styles from "./Navbar.module.scss";
import { useEffect, useState } from "react";
import { getFirstName, getRole, isAuthenticated, logout } from "@/services/auth";

type UserBar = {
  firstName: string;
  role: string | null;
  authed: boolean;
};

export function Navbar() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<UserBar>({
    firstName: "",
    role: null,
    authed: false,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const authed = isAuthenticated();
    if (!authed) {
      setUser({ firstName: "", role: null, authed: false });
      return;
    }
    const firstName = getFirstName() ?? "Usuário";
    const role = getRole();
    setUser({ firstName, role: role ?? null, authed: true });
  }, [mounted]);

  const roleLabel = user.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : null;

  const handleLogin = () => router.push("/login");

  const handleLogout = () => {
    logout();
    router.push("/login");
    setTimeout(() => {
      if (typeof window !== "undefined") window.location.reload();
    }, 10);
  };

  return (
    <header className={styles.nav}>
      <div className="container">
        <div className={styles.row}>
          <Logo />

          <nav className={`${styles.actions} ${styles.actionsFlex}`}>
            <Link className="btn--outline" href="/employees">
              Employees
            </Link>

            {!mounted ? (
              <button className="btn" onClick={handleLogin}>Log in</button>
            ) : user.authed ? (
              <>
                <span className={styles.userBadge}>
                  Hi, <strong>{user.firstName}</strong>
                  {roleLabel && <> | <em className={styles.userRole}>{roleLabel}</em></>}
                </span>
                <button className="btn" onClick={handleLogout}>Log out</button>
              </>
            ) : (
              <button className="btn" onClick={handleLogin}>Log in</button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
