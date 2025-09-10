'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const authRaw = localStorage.getItem('authUser');
    if (authRaw) router.replace('/');
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password || (mode === 'signup' && !name)) {
      setError('Zəhmət olmasa bütün xanaları doldurun.');
      return;
    }

    try {
      setLoading(true);
      if (mode === 'signup') {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Qeydiyyat alınmadı');
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(loginData.error || 'Giriş alınmadı');
        localStorage.setItem('authToken', loginData.token);
        localStorage.setItem('authUser', JSON.stringify(loginData.user));
        router.replace('/');
      } else {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Giriş alınmadı');
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('authUser', JSON.stringify(data.user));
        router.replace('/');
      }
    } catch (err: any) {
      setError(err.message || 'Xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.tabs}>
          <button className={`${styles.tabButton} ${mode === 'login' ? styles.tabButtonActive : ''}`} onClick={() => setMode('login')}>Giriş</button>
          <button className={`${styles.tabButton} ${mode === 'signup' ? styles.tabButtonActive : ''}`} onClick={() => setMode('signup')}>Qeydiyyat</button>
        </div>
        <h1 className={styles.title}>{mode === 'login' ? 'Yenidən xoş gəldiniz' : 'Hesab yaradın'}</h1>
        <p className={styles.subtitle}>Davam etmək üçün məlumatlarınızı daxil edin.</p>
        {error && <div className={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit} className={styles.form}>
          {mode === 'signup' && (
            <div>
              <label className={styles.label}>Ad</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className={styles.input} placeholder="Adınız" />
            </div>
          )}
          <div>
            <label className={styles.label}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={styles.input} placeholder="mail@example.com" />
          </div>
          <div>
            <label className={styles.label}>Şifrə</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={styles.input} placeholder="••••••••" />
          </div>
          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? 'Gözləyin...' : mode === 'login' ? 'Daxil ol' : 'Qeydiyyatdan keç'}
          </button>
        </form>
        <div className={styles.helper}>
          {mode === 'login' ? (
            <span>Hesabınız yoxdur? <button onClick={() => setMode('signup')} className={styles.link}>Qeydiyyat</button></span>
          ) : (
            <span>Artıq hesabınız var? <button onClick={() => setMode('login')} className={styles.link}>Giriş</button></span>
          )}
        </div>
      </div>
    </div>
  );
}


