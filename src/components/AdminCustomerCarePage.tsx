import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Headphones, Send, X } from 'lucide-react'
import { auth } from '../lib/firebase'

type AdminCustomerCarePageProps = {
  onNavigate: (page: string) => void
}

type CustomerCareStatus =
  | 'open'
  | 'in progress'
  | 'resolved'

type CustomerCareRequest = {
  id: string
  userId: string
  customerEmail: string
  customerName: string
  orderId: string
  requestType: string
  message: string
  status: CustomerCareStatus
  createdAt: string | null
  updatedAt: string | null
}

type CustomerCareMessage = {
  id: string
  senderType: 'customer' | 'admin' | 'customer-care'
  senderName: string
  senderEmail: string
  message: string
  createdAt: string | null
}

const statusOptions: CustomerCareStatus[] = [
  'open',
  'in progress',
  'resolved',
]

function formatDate(value: string | null) {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AdminCustomerCarePage({
  onNavigate,
}: AdminCustomerCarePageProps) {
  const [requests, setRequests] = useState<CustomerCareRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(
    null,
  )
  const [statusFilter, setStatusFilter] = useState<'all' | CustomerCareStatus>(
    'all',
  )
  const [selectedRequest, setSelectedRequest] =
    useState<CustomerCareRequest | null>(null)
  const [messages, setMessages] = useState<CustomerCareMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [reply, setReply] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [messageError, setMessageError] = useState('')

  const loadRequests = async () => {
    try {
      setLoading(true)
      setError('')

      const currentUser = auth.currentUser

      if (!currentUser) {
        throw new Error('Admin authentication is required.')
      }

      const idToken = await currentUser.getIdToken()

      const response = await fetch(
        'http://localhost:4242/api/admin/customer-care/requests',
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.error || 'Unable to load Customer Care requests.',
        )
      }

      setRequests(
        Array.isArray(data.requests)
          ? data.requests
          : [],
      )
    } catch (loadError) {
      console.error(
        'Failed to load Customer Care requests:',
        loadError,
      )

      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load Customer Care requests.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadRequests()
  }, [])

  const handleStatusChange = async (
    requestId: string,
    status: CustomerCareStatus,
  ) => {
    try {
      setUpdatingRequestId(requestId)
      setError('')

      const currentUser = auth.currentUser

      if (!currentUser) {
        throw new Error('Admin authentication is required.')
      }

      const idToken = await currentUser.getIdToken()

      const response = await fetch(
        `http://localhost:4242/api/admin/customer-care/requests/${requestId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            status,
          }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.error || 'Unable to update Customer Care request.',
        )
      }

      setRequests((currentRequests) =>
        currentRequests.map((request) =>
          request.id === requestId
            ? {
                ...request,
                status,
              }
            : request,
        ),
      )
    } catch (updateError) {
      console.error(
        'Failed to update Customer Care request:',
        updateError,
      )

      setError(
        updateError instanceof Error
          ? updateError.message
          : 'Unable to update Customer Care request.',
      )
    } finally {
      setUpdatingRequestId(null)
    }
  }

  const loadMessages = async (request: CustomerCareRequest) => {
    try {
      setMessagesLoading(true)
      setMessageError('')
      setMessages([])

      const currentUser = auth.currentUser

      if (!currentUser) {
        throw new Error('Customer Care authentication is required.')
      }

      const idToken = await currentUser.getIdToken()

      const response = await fetch(
        `http://localhost:4242/api/admin/customer-care/requests/${request.id}/messages`,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.error || 'Unable to load Customer Care messages.',
        )
      }

      setMessages(
        Array.isArray(data.messages)
          ? data.messages
          : [],
      )
    } catch (loadError) {
      console.error(
        'Failed to load Customer Care messages:',
        loadError,
      )

      setMessageError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load Customer Care messages.',
      )
    } finally {
      setMessagesLoading(false)
    }
  }

  const openConversation = async (request: CustomerCareRequest) => {
    setSelectedRequest(request)
    setReply('')
    setMessageError('')
    await loadMessages(request)
  }

  const closeConversation = () => {
    setSelectedRequest(null)
    setMessages([])
    setReply('')
    setMessageError('')
  }

  const handleSendReply = async () => {
    const trimmedReply = reply.trim()

    if (!trimmedReply || !selectedRequest) {
      return
    }

    try {
      setSendingReply(true)
      setMessageError('')

      const currentUser = auth.currentUser

      if (!currentUser) {
        throw new Error('Customer Care authentication is required.')
      }

      const idToken = await currentUser.getIdToken()

      const response = await fetch(
        `http://localhost:4242/api/admin/customer-care/requests/${selectedRequest.id}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            message: trimmedReply,
          }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.error || 'Unable to send Customer Care reply.',
        )
      }

      if (data.message) {
        setMessages((currentMessages) => [
          ...currentMessages,
          data.message,
        ])
      }

      setReply('')

      setRequests((currentRequests) =>
        currentRequests.map((request) =>
          request.id === selectedRequest.id
            ? {
                ...request,
                updatedAt: new Date().toISOString(),
              }
            : request,
        ),
      )
    } catch (sendError) {
      console.error(
        'Failed to send Customer Care reply:',
        sendError,
      )

      setMessageError(
        sendError instanceof Error
          ? sendError.message
          : 'Unable to send Customer Care reply.',
      )
    } finally {
      setSendingReply(false)
    }
  }

  const filteredRequests = useMemo(() => {
    if (statusFilter === 'all') {
      return requests
    }

    return requests.filter(
      (request) => request.status === statusFilter,
    )
  }, [requests, statusFilter])

  if (selectedRequest) {
    return (
      <main className="admin-page admin-customer-care-page admin-customer-care-conversation-view">
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
            <strong>CUSTOMER CARE</strong>
          </div>

          <button
            className="admin-exit"
            onClick={() => onNavigate('admin')}
          >
            BACK TO ADMIN
          </button>
        </header>

        <section className="admin-content admin-customer-care-conversation-content">
        <div
          className="admin-customer-care-conversation-page"
          aria-label="Customer Care conversation"
        >
          <div className="admin-customer-care-chat">
            <button
              type="button"
              className="admin-customer-care-back-button"
              onClick={closeConversation}
            >
              ← BACK TO CUSTOMER CARE
            </button>

            <header className="admin-customer-care-chat-header">
              <div>
                <span>CUSTOMER CARE</span>
                <h2>{selectedRequest.customerName}</h2>
                <p>{selectedRequest.customerEmail}</p>
              </div>

              <button
                type="button"
                onClick={closeConversation}
                aria-label="Close conversation"
              >
                <X size={19} strokeWidth={1.2} />
              </button>
            </header>

            <div className="admin-customer-care-chat-context">
              <span>
                {selectedRequest.requestType
                  .replace('-', ' ')
                  .toUpperCase()}
              </span>

              <span>
                ORDER{' '}
                <strong>
                  {selectedRequest.orderId || 'NOT PROVIDED'}
                </strong>
              </span>

              <span>
                STATUS{' '}
                <strong>
                  {selectedRequest.status.toUpperCase()}
                </strong>
              </span>
            </div>

            {messageError && (
              <div className="admin-error">
                {messageError}
              </div>
            )}

            <div className="admin-customer-care-chat-messages">
              <div className="admin-customer-care-chat-message customer">
                <span>CUSTOMER</span>
                <p>{selectedRequest.message}</p>
                <small>
                  {formatDate(selectedRequest.createdAt)}
                </small>
              </div>

              {messagesLoading ? (
                <div className="admin-loading">
                  LOADING CONVERSATION...
                </div>
              ) : messages.length === 0 ? (
                <div className="admin-empty">
                  <strong>NO REPLIES YET</strong>
                  <span>
                    Send a message below to begin the conversation.
                  </span>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    className={`admin-customer-care-chat-message ${
                      message.senderType === 'customer'
                        ? 'customer'
                        : 'staff'
                    }`}
                    key={message.id}
                  >
                    <span>
                      {message.senderType === 'admin'
                        ? 'ADMIN'
                        : message.senderType === 'customer-care'
                          ? 'CUSTOMER CARE'
                          : 'CUSTOMER'}
                    </span>

                    <p>{message.message}</p>

                    <small>
                      {message.senderName || message.senderEmail}
                      {' · '}
                      {formatDate(message.createdAt)}
                    </small>
                  </div>
                ))
              )}
            </div>

            <form
              className="admin-customer-care-chat-compose"
              onSubmit={(event) => {
                event.preventDefault()
                void handleSendReply()
              }}
            >
              <textarea
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                placeholder="Write a reply to the customer..."
                rows={4}
                disabled={sendingReply}
              />

              <button
                className="admin-primary-button"
                type="submit"
                disabled={
                  sendingReply ||
                  !reply.trim()
                }
              >
                <Send size={15} strokeWidth={1.2} />
                {sendingReply
                  ? 'SENDING...'
                  : 'SEND REPLY'}
              </button>
            </form>
          </div>
        </div>
        </section>
      </main>
    )
  }

  return (
    <main className="admin-page admin-customer-care-page">
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
          <strong>CUSTOMER CARE</strong>
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
          <h1>CUSTOMER CARE</h1>
          <p>Review and manage customer support requests.</p>
        </div>

        <div className="admin-overview">
          <div className="admin-overview-card">
            <span>TOTAL</span>
            <strong>{requests.length}</strong>
            <small>Customer Care requests</small>
          </div>

          <div className="admin-overview-card">
            <span>OPEN</span>
            <strong>
              {requests.filter((request) => request.status === 'open').length}
            </strong>
            <small>Awaiting action</small>
          </div>

          <div className="admin-overview-card">
            <span>IN PROGRESS</span>
            <strong>
              {
                requests.filter(
                  (request) => request.status === 'in progress',
                ).length
              }
            </strong>
            <small>Being handled</small>
          </div>

          <div className="admin-overview-card">
            <span>RESOLVED</span>
            <strong>
              {
                requests.filter(
                  (request) => request.status === 'resolved',
                ).length
              }
            </strong>
            <small>Completed requests</small>
          </div>
        </div>

        <div className="admin-section-heading">
          <div>
            <span>CUSTOMER SUPPORT</span>
            <h2>REQUESTS</h2>
          </div>

          <Headphones size={19} strokeWidth={1.2} />
        </div>

        <div className="admin-customer-care-filter">
          <label htmlFor="customer-care-status-filter">
            FILTER BY STATUS
          </label>

          <select
            id="customer-care-status-filter"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as 'all' | CustomerCareStatus,
              )
            }
          >
            <option value="all">ALL REQUESTS</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="admin-error">
            {error}
          </div>
        )}

        {loading ? (
          <div className="admin-loading">
            LOADING CUSTOMER CARE REQUESTS...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="admin-empty">
            <Headphones size={22} strokeWidth={1.2} />
            <strong>NO CUSTOMER CARE REQUESTS</strong>
            <span>
              Requests submitted through THAANE Concierge will appear here.
            </span>
          </div>
        ) : (
          <div className="admin-customer-care-list">
            {filteredRequests.map((request) => (
              <article
                className="admin-customer-care-card"
                key={request.id}
              >
                <div className="admin-customer-care-card-header">
                  <div>
                    <span>
                      {request.requestType.replace('-', ' ').toUpperCase()}
                    </span>
                    <h3>{request.customerName}</h3>
                    <p>{request.customerEmail}</p>
                  </div>

                  <div className="admin-customer-care-status">
                    <label htmlFor={`care-status-${request.id}`}>
                      STATUS
                    </label>

                    <select
                      id={`care-status-${request.id}`}
                      value={request.status}
                      disabled={updatingRequestId === request.id}
                      onChange={(event) =>
                        void handleStatusChange(
                          request.id,
                          event.target.value as CustomerCareStatus,
                        )
                      }
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="admin-customer-care-message">
                  <span>MESSAGE</span>
                  <p>{request.message}</p>
                </div>

                <div className="admin-customer-care-meta">
                  <span>
                    ORDER{' '}
                    <strong>
                      {request.orderId || 'NOT PROVIDED'}
                    </strong>
                  </span>

                  <span>
                    RECEIVED{' '}
                    <strong>{formatDate(request.createdAt)}</strong>
                  </span>
                </div>

                <button
                  className="admin-primary-button"
                  type="button"
                  onClick={() => void openConversation(request)}
                >
                  OPEN CONVERSATION
                </button>
              </article>
            ))}
          </div>
        )}

      </section>
    </main>
  )
}
