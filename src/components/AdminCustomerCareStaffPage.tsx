import { useEffect, useState } from 'react'
import { ArrowLeft, UserPlus, Users, X } from 'lucide-react'
import { auth } from '../lib/firebase'

type AdminCustomerCareStaffPageProps = {
  onNavigate: (page: string) => void
}

type CustomerCareStaff = {
  uid: string
  email: string
  displayName: string
  role: string
  active: boolean
  createdAt: string | null
  updatedAt: string | null
}

export default function AdminCustomerCareStaffPage({
  onNavigate,
}: AdminCustomerCareStaffPageProps) {
  const [staff, setStaff] = useState<CustomerCareStaff[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')

  const loadStaff = async () => {
    try {
      setLoading(true)
      setError('')

      const currentUser = auth.currentUser

      if (!currentUser) {
        throw new Error('Admin authentication is required.')
      }

      const idToken = await currentUser.getIdToken()

      const response = await fetch(
        'http://localhost:4242/api/admin/customer-care/staff',
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.error || 'Unable to load Customer Care employees.',
        )
      }

      setStaff(Array.isArray(data.staff) ? data.staff : [])
    } catch (loadError) {
      console.error('Failed to load Customer Care staff:', loadError)

      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load Customer Care employees.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadStaff()
  }, [])

  const handleCreateEmployee = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setFormError('')
    setFormSuccess('')

    try {
      setCreating(true)

      const currentUser = auth.currentUser

      if (!currentUser) {
        throw new Error('Admin authentication is required.')
      }

      const idToken = await currentUser.getIdToken()

      const response = await fetch(
        'http://localhost:4242/api/admin/customer-care/staff',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            displayName: displayName.trim(),
            email: email.trim(),
          }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.error || 'Unable to create Customer Care employee.',
        )
      }

      setFormSuccess('Customer Care employee created successfully.')
      setDisplayName('')
      setEmail('')
      setShowAddForm(false)
      await loadStaff()
    } catch (createError) {
      console.error(
        'Failed to create Customer Care employee:',
        createError,
      )

      setFormError(
        createError instanceof Error
          ? createError.message
          : 'Unable to create Customer Care employee.',
      )
    } finally {
      setCreating(false)
    }
  }

  return (
    <main className="admin-page admin-customer-care-staff-page">
      <header className="admin-header">
        <button
          className="admin-logo"
          onClick={() => onNavigate('home')}
          aria-label="THAANE home"
        >
          <img src="/thaane-logo-black.png" alt="THAANE" />
        </button>

        <div className="admin-header-title">
          <span>THAANE</span>
          <strong>CUSTOMER CARE STAFF</strong>
        </div>

        <button
          className="admin-exit"
          onClick={() => onNavigate('admin')}
        >
          BACK TO ADMIN
        </button>
      </header>

      <section className="admin-content">
        <button
          className="admin-back-button"
          type="button"
          onClick={() => onNavigate('admin')}
        >
          <ArrowLeft size={16} strokeWidth={1.2} />
          ADMIN DASHBOARD
        </button>

        <div className="admin-intro">
          <span>THAANE MANAGEMENT</span>
          <h1>EMPLOYEES</h1>
          <p>Manage Customer Care employees and support access.</p>
        </div>

        <div className="admin-section-heading">
          <div>
            <span>CUSTOMER CARE</span>
            <h2>SUPPORT TEAM</h2>
          </div>

          <Users size={19} strokeWidth={1.2} />
        </div>

        {showAddForm ? (
          <form
            className="admin-customer-care-staff-form"
            onSubmit={handleCreateEmployee}
          >
            <div className="admin-customer-care-staff-form-header">
              <div>
                <span>GOOGLE ACCESS</span>
                <h3>ADD EMPLOYEE</h3>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false)
                  setFormError('')
                }}
                aria-label="Close add employee form"
              >
                <X size={18} strokeWidth={1.2} />
              </button>
            </div>

            <label>
              <span>EMPLOYEE NAME</span>
              <input
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Full name"
                required
                disabled={creating}
              />
            </label>

            <label>
              <span>EMAIL</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="employee@thaane.com"
                required
                disabled={creating}
              />
            </label>

            {formError && (
              <div className="admin-error">
                {formError}
              </div>
            )}

            <button
              className="admin-primary-button"
              type="submit"
              disabled={creating}
            >
              {creating ? 'CREATING EMPLOYEE...' : 'CREATE EMPLOYEE'}
            </button>
          </form>
        ) : (
          <button
            className="admin-section-card"
            type="button"
            onClick={() => {
              setFormSuccess('')
              setFormError('')
              setShowAddForm(true)
            }}
          >
            <UserPlus size={21} strokeWidth={1.2} />

            <div>
              <strong>ADD EMPLOYEE</strong>
              <span>
                Authorize a Google account for Customer Care access.
                The employee will sign in using THAANE's existing Google login.
              </span>
            </div>

            <span className="admin-section-status">
              ADD
            </span>
          </button>
        )}

        {formSuccess && (
          <div className="admin-success">
            {formSuccess}
          </div>
        )}

        {error && (
          <div className="admin-error">
            {error}
          </div>
        )}

        {loading ? (
          <div className="admin-loading">
            LOADING CUSTOMER CARE EMPLOYEES...
          </div>
        ) : staff.length === 0 ? (
          <div className="admin-empty">
            <Users size={22} strokeWidth={1.2} />
            <strong>NO CUSTOMER CARE EMPLOYEES</strong>
            <span>
              Employees created from the Admin Dashboard will appear here.
            </span>
          </div>
        ) : (
          <div className="admin-customer-care-list">
            {staff.map((employee) => (
              <article
                className="admin-customer-care-card"
                key={employee.uid}
              >
                <div className="admin-customer-care-card-header">
                  <div>
                    <span>{employee.role.toUpperCase()}</span>
                    <h3>{employee.displayName}</h3>
                    <p>{employee.email}</p>
                  </div>

                  <div className="admin-customer-care-status">
                    <label>STATUS</label>
                    <strong>
                      {employee.active ? 'ACTIVE' : 'INACTIVE'}
                    </strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
