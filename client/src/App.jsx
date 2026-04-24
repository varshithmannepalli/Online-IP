import React, { useEffect, useMemo, useState } from 'react';

const emptyForm = {
  name: '',
  email: '',
  password: '',
  skills: ''
};

const statusOptions = ['All', 'Applied', 'Selected'];

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('oip-user') || 'null');
  } catch {
    return null;
  }
}

function App() {
  const [page, setPage] = useState('home');
  const [user, setUser] = useState(readStoredUser);
  const [signUpForm, setSignUpForm] = useState(emptyForm);
  const [internships, setInternships] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [profileFilter, setProfileFilter] = useState({ status: 'All', domain: 'All' });

  useEffect(() => {
    localStorage.setItem('oip-user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    if (page === 'apply') {
      loadInternships();
    }
    if (page === 'profile' && user) {
      loadProfile(profileFilter);
    }
  }, [page, user]);

  useEffect(() => {
    if (page === 'profile' && user) {
      loadProfile(profileFilter);
    }
  }, [profileFilter.status, profileFilter.domain]);

  async function api(path, options) {
    const response = await fetch(path, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong');
    }
    return data;
  }

  async function loadInternships() {
    setLoading(true);
    setMessage('');
    try {
      const data = await api('/internships');
      setInternships(data.internships || []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadProfile(filters) {
    setLoading(true);
    setMessage('');
    try {
      const query = new URLSearchParams();
      if (filters.status && filters.status !== 'All') query.set('status', filters.status);
      if (filters.domain && filters.domain !== 'All') query.set('domain', filters.domain);
      const data = await api(`/profile/${user.UserID}${query.toString() ? `?${query.toString()}` : ''}`);
      setProfileData(data);
    } catch (error) {
      setProfileData(null);
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const data = await api('/signup', {
        method: 'POST',
        body: JSON.stringify(signUpForm)
      });
      setUser(data.user);
      setSignUpForm(emptyForm);
      setPage('profile');
      setProfileFilter({ status: 'All', domain: 'All' });
      setMessage('Signup completed successfully.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleApply(internshipId) {
    if (!user) {
      setMessage('Please sign in first.');
      setPage('signup');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      await api('/apply', {
        method: 'POST',
        body: JSON.stringify({ userId: user.UserID, internshipId })
      });
      setMessage('Application submitted.');
      if (page === 'profile') {
        loadProfile(profileFilter);
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    if (!profileData) return { total: 0, selected: 0 };
    return {
      total: profileData.applications.length,
      selected: profileData.applications.filter((item) => item.Status === 'Selected').length
    };
  }, [profileData]);

  const domains = useMemo(() => {
    const list = internships.length ? internships : profileData?.internships || [];
    return ['All', ...new Set(list.map((item) => item.Domain))];
  }, [internships, profileData]);

  return (
    <div className="shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">Student project</p>
          <h1>Online Internship Platform</h1>
          <p className="sidebar-note">A small MERN-style app using Excel as the data store.</p>
        </div>

        <nav className="nav-cards">
          {[
            ['home', 'Home'],
            ['signup', 'Sign In'],
            ['apply', 'Apply Internships'],
            ['profile', 'Profile']
          ].map(([key, label]) => (
            <button key={key} className={page === key ? 'nav-card active' : 'nav-card'} onClick={() => setPage(key)}>
              <span>{label}</span>
              <small>{key === 'home' ? 'Dashboard' : key === 'signup' ? 'Create account' : key === 'apply' ? 'Browse openings' : 'Track applications'}</small>
            </button>
          ))}
        </nav>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Excel backed</p>
            <h2>Simple internship tracking for students</h2>
          </div>
          <div className="user-chip">
            <span>{user ? user.Name : 'Guest'}</span>
            <small>{user ? user.Email : 'Not signed in'}</small>
          </div>
        </header>

        {message ? <div className="alert">{message}</div> : null}

        {page === 'home' && (
          <section className="dashboard">
            <div className="hero-card">
              <h3>Manage internships without a database server</h3>
              <p>Users, internships, and applications are stored in separate Excel sheets and linked using IDs.</p>
              <div className="hero-actions">
                <button onClick={() => setPage('signup')}>Get started</button>
                <button className="ghost" onClick={() => setPage('apply')}>Browse internships</button>
              </div>
            </div>

            <div className="card-grid">
              {[
                ['Create account', 'Stores student info in the Users sheet.'],
                ['Apply fast', 'Writes application records to the Applications sheet.'],
                ['Profile view', 'Shows selected and applied internships together.']
              ].map(([title, text]) => (
                <article key={title} className="info-card">
                  <h4>{title}</h4>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {page === 'signup' && (
          <section className="panel">
            <div className="panel-head">
              <div>
                <h3>Sign In / Create Account</h3>
                <p>New users are added to the Users sheet. Duplicate emails are blocked.</p>
              </div>
            </div>
            <form className="form" onSubmit={handleSignUp}>
              <label>
                Full name
                <input value={signUpForm.name} onChange={(e) => setSignUpForm({ ...signUpForm, name: e.target.value })} required />
              </label>
              <label>
                Email
                <input type="email" value={signUpForm.email} onChange={(e) => setSignUpForm({ ...signUpForm, email: e.target.value })} required />
              </label>
              <label>
                Password
                <input type="password" value={signUpForm.password} onChange={(e) => setSignUpForm({ ...signUpForm, password: e.target.value })} required />
              </label>
              <label>
                Skills
                <input value={signUpForm.skills} onChange={(e) => setSignUpForm({ ...signUpForm, skills: e.target.value })} placeholder="HTML, React, Excel" />
              </label>
              <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save user'}</button>
            </form>
          </section>
        )}

        {page === 'apply' && (
          <section className="panel">
            <div className="panel-head">
              <div>
                <h3>Internships</h3>
                <p>Click apply to create a new application row in the Applications sheet.</p>
              </div>
              <span className="pill">{internships.length} openings</span>
            </div>
            <div className="list-grid">
              {loading && !internships.length ? <div className="muted">Loading internships...</div> : null}
              {internships.map((item) => (
                <article key={item.InternshipID} className="internship-card">
                  <div>
                    <p className="card-meta">{item.Company} • {item.Location}</p>
                    <h4>{item.Title}</h4>
                    <p>{item.Description}</p>
                  </div>
                  <div className="card-footer">
                    <span>{item.Domain}</span>
                    <strong>{item.Stipend}</strong>
                  </div>
                  <button onClick={() => handleApply(item.InternshipID)}>Apply now</button>
                </article>
              ))}
            </div>
          </section>
        )}

        {page === 'profile' && (
          <section className="panel">
            <div className="panel-head profile-head">
              <div>
                <h3>Profile</h3>
                <p>Details are fetched from Users and Applications, then joined with Internship records.</p>
              </div>
              <div className="stats">
                <div>
                  <strong>{stats.total}</strong>
                  <span>Applications</span>
                </div>
                <div>
                  <strong>{stats.selected}</strong>
                  <span>Selected</span>
                </div>
              </div>
            </div>

            {!user ? (
              <div className="muted">Sign in first to view your profile.</div>
            ) : (
              <>
                <div className="filter-row">
                  <label>
                    Status
                    <select value={profileFilter.status} onChange={(e) => setProfileFilter({ ...profileFilter, status: e.target.value })}>
                      {statusOptions.map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </label>
                  <label>
                    Domain
                    <select value={profileFilter.domain} onChange={(e) => setProfileFilter({ ...profileFilter, domain: e.target.value })}>
                      {domains.map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </label>
                </div>

                <div className="profile-box">
                  <div>
                    <p className="card-meta">Student details</p>
                    <h4>{user.Name}</h4>
                    <p>{user.Email}</p>
                    <small>{user.Skills || 'No skills added'}</small>
                  </div>
                </div>

                <div className="two-col">
                  <div>
                    <h4 className="section-title">Applied internships</h4>
                    <div className="profile-list">
                      {(profileData?.applications || []).filter((item) => item.Status === 'Applied').map((item) => (
                        <article key={item.ApplicationID} className="application-row">
                          <div>
                            <strong>{item.Title}</strong>
                            <p>{item.Company} • {item.Domain} • {item.Location}</p>
                          </div>
                          <span className="status applied">Applied</span>
                        </article>
                      ))}
                      {profileData && !profileData.applications.filter((item) => item.Status === 'Applied').length ? <div className="muted">No applied internships found.</div> : null}
                    </div>
                  </div>

                  <div>
                    <h4 className="section-title">Selected internships</h4>
                    <div className="profile-list">
                      {(profileData?.applications || []).filter((item) => item.Status === 'Selected').map((item) => (
                        <article key={item.ApplicationID} className="application-row">
                          <div>
                            <strong>{item.Title}</strong>
                            <p>{item.Company} • {item.Domain} • {item.Location}</p>
                          </div>
                          <span className="status selected">Selected</span>
                        </article>
                      ))}
                      {profileData && !profileData.applications.filter((item) => item.Status === 'Selected').length ? <div className="muted">No selected internships yet.</div> : null}
                    </div>
                  </div>
                </div>
              </>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
