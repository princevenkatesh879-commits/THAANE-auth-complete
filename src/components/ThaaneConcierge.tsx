import { useEffect, useRef, useState } from 'react'
import {
  ArrowUp,
  Headphones,
  Package,
  RotateCcw,
  Truck,
  X,
} from 'lucide-react'
import { subscribeToUserOrders, type Order } from '../lib/orders'

type ThaaneConciergeProps = {
  userName?: string | null
  userEmail?: string | null
  userId?: string | null
  onNavigate?: (page: string) => void
}

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  orderId?: string
  trackingUrl?: string
  actionLabel?: string
  actionPage?: string
}

type CustomerCareRequestType =
  | 'general'
  | 'order'
  | 'shipping'
  | 'returns'
  | 'exchanges'
  | 'payment'
  | 'other'

const quickActions = [
  {
    label: 'MY ORDERS',
    icon: Package,
    prompt: 'What are my orders?',
  },
  {
    label: 'TRACK MY LATEST ORDER',
    icon: Truck,
    prompt: 'Where is my latest order?',
  },
  {
    label: 'SHIPPING & DELIVERY',
    icon: Truck,
    prompt: 'What is your shipping and delivery policy?',
  },
  {
    label: 'RETURNS & EXCHANGES',
    icon: RotateCcw,
    prompt: 'What is your return policy?',
  },
  {
    label: 'CONTACT THAANE',
    icon: Headphones,
    prompt: 'I would like to contact THAANE.',
  },
]

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export default function ThaaneConcierge({
  userName,
  userEmail,
  userId,
  onNavigate,
}: ThaaneConciergeProps) {
  const signedIn = Boolean(userEmail && userId)
  const [orders, setOrders] = useState<Order[]>([])
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [showCustomerCareForm, setShowCustomerCareForm] = useState(false)
  const [customerCareType, setCustomerCareType] =
    useState<CustomerCareRequestType>('general')
  const [customerCareMessage, setCustomerCareMessage] = useState('')
  const [customerCareOrderId, setCustomerCareOrderId] = useState('')
  const [customerCareSubmitting, setCustomerCareSubmitting] =
    useState(false)
  const [customerCareError, setCustomerCareError] = useState('')
  const [customerCareSuccess, setCustomerCareSuccess] = useState(false)
  const [customerCareRequestId, setCustomerCareRequestId] =
    useState<string | null>(() => {
      if (typeof window === 'undefined') {
        return null
      }

      return window.localStorage.getItem(
        'thaane-customer-care-request-id',
      )
    })
  const messagesContainerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!userId) {
      setOrders([])
      return
    }

    return subscribeToUserOrders(userId, setOrders)
  }, [userId])

  useEffect(() => {
    setMessages([
      {
        id: createMessageId(),
        role: 'assistant',
        text: signedIn
          ? `Welcome back${userName ? `, ${userName}` : ''}. How may I assist you today?`
          : 'Welcome to THAANE. How may I assist you today? Sign in for personalized order assistance.',
      },
    ])
  }, [signedIn, userName])

  useEffect(() => {
    if (!open || !customerCareRequestId || !signedIn) {
      return
    }

    let cancelled = false

    const loadCustomerCareMessages = async () => {
      try {
        const currentUser = await import('../lib/firebase').then(
          ({ auth }) => auth.currentUser,
        )

        if (!currentUser) {
          return
        }

        const idToken = await currentUser.getIdToken()

        const response = await fetch(
          `http://localhost:4242/api/customer-care/requests/${customerCareRequestId}/messages`,
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          },
        )

        const data = await response.json()

        if (!response.ok || cancelled) {
          console.error(
            'Customer Care message polling failed:',
            response.status,
            data,
          )

          if (!cancelled && response.status !== 404) {
            setCustomerCareError(
              data?.error ||
                `Unable to load Customer Care messages (${response.status}).`,
            )
          }

          return
        }

        if (data?.status === 'resolved') {
          setCustomerCareRequestId(null)
          window.localStorage.removeItem(
            'thaane-customer-care-request-id',
          )
          setCustomerCareSuccess(false)
          setShowCustomerCareForm(false)
          setCustomerCareError('')
          setMessages([
            {
              id: createMessageId(),
              role: 'assistant',
              text: signedIn
                ? `Welcome back${userName ? `, ${userName}` : ''}. How may I assist you today?`
                : 'Welcome to THAANE. How may I assist you today? Sign in for personalized order assistance.',
            },
          ])
          return
        }

        if (!Array.isArray(data?.messages)) {
          console.error(
            'Customer Care endpoint returned invalid messages:',
            data,
          )
          return
        }

        const conversationMessages: ChatMessage[] =
          data.messages.map(
            (message: {
              id: string
              senderType?: string
              message?: string
            }) => ({
              id: `customer-care-${message.id}`,
              role:
                message.senderType === 'customer'
                  ? 'user'
                  : 'assistant',
              text: message.message || '',
            }),
          )

        setMessages((current) => {
          const welcomeMessage = current[0]

          const nonConversationMessages = current.filter(
            (message) =>
              !message.id.startsWith('customer-care-'),
          )

          return [
            welcomeMessage,
            ...conversationMessages,
            ...nonConversationMessages.slice(1),
          ]
        })
      } catch (error) {
        console.error(
          'Failed to load Customer Care conversation:',
          error,
        )
      }
    }

    void loadCustomerCareMessages()

    const interval = window.setInterval(() => {
      void loadCustomerCareMessages()
    }, 5000)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [open, customerCareRequestId, signedIn])

  useEffect(() => {
    if (!open) return

    const container = messagesContainerRef.current
    if (!container) return

    requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      })
    })
  }, [messages, open])


  const latestOrder = orders[0]

  const buildAssistantResponse = (question: string): ChatMessage => {
    const normalized = question.toLowerCase().trim()

    const asksOrders =
      normalized.includes('my order') ||
      normalized.includes('my orders') ||
      normalized.includes('recent order') ||
      normalized.includes('recent orders') ||
      normalized.includes('order history')

    const asksTracking =
      normalized.includes('track') ||
      normalized.includes('where is') ||
      normalized.includes('shipment') ||
      normalized.includes('delivery status') ||
      normalized.includes('latest order')

    const asksShipping =
      normalized.includes('shipping') ||
      normalized.includes('delivery time') ||
      normalized.includes('how long') ||
      normalized.includes('deliver') ||
      normalized.includes('arrive')

    const asksReturns =
      normalized.includes('return') ||
      normalized.includes('exchange') ||
      normalized.includes('refund')

    const asksCancellation =
      normalized.includes('cancel') ||
      normalized.includes('cancellation')

    const asksStatus =
      normalized.includes('order status') ||
      normalized.includes('order confirmed') ||
      normalized.includes('is my order confirmed') ||
      normalized.includes('has my order been confirmed') ||
      normalized.includes('is my order processing') ||
      normalized.includes('is my order shipped') ||
      normalized.includes('is my order delivered')

    const asksContact =
      normalized.includes('contact') ||
      normalized.includes('customer care') ||
      normalized.includes('support') ||
      normalized.includes('help me')

    const isGreeting =
      normalized === 'hi' ||
      normalized === 'hello' ||
      normalized === 'hey' ||
      normalized.includes('good morning') ||
      normalized.includes('good afternoon') ||
      normalized.includes('good evening')

    if (
      (
        asksReturns ||
        asksCancellation ||
        asksOrders ||
        asksTracking ||
        asksShipping ||
        asksStatus
      ) &&
      !signedIn
    ) {
      return {
        id: createMessageId(),
        role: 'assistant',
        text: asksReturns
          ? 'I can help with returns and exchanges. Please sign in to your THAANE account so I can check your order information and guide you through the applicable process.'
          : asksCancellation
            ? 'I can help with cancellation information. Please sign in to your THAANE account so I can check your order information and guide you through the applicable process.'
            : 'I can help with order and delivery information. Please sign in to your THAANE account so I can securely access your orders.',
      }
    }

    if ((asksTracking || asksStatus) && signedIn) {
      if (!latestOrder) {
        return {
          id: createMessageId(),
          role: 'assistant',
          text: 'I could not find an order on your account yet. Once you place an order, I can help you with its delivery status and tracking details.',
        }
      }

      const status = latestOrder.orderStatus.toLowerCase()
      const statusText =
        status.charAt(0).toUpperCase() + status.slice(1)

      let text = `Of course${userName ? `, ${userName}` : ''}. Your latest order #${latestOrder.id
        .slice(-6)
        .toUpperCase()} is currently ${statusText}.`

      if (latestOrder.items.length > 0) {
        text += ` You ordered ${latestOrder.items.length} item${latestOrder.items.length === 1 ? '' : 's'} for ₹${latestOrder.total.toLocaleString('en-IN')}.`
      }

      if (latestOrder.estimatedDelivery) {
        text += ` The estimated delivery is ${latestOrder.estimatedDelivery}.`
      }

      if (latestOrder.trackingCarrier) {
        text += ` The carrier is ${latestOrder.trackingCarrier}.`
      }

      if (latestOrder.trackingNumber) {
        text += ` Your tracking number is ${latestOrder.trackingNumber}.`
      }

      text += ' Is there anything else I can help you with?'

      return {
        id: createMessageId(),
        role: 'assistant',
        text,
        orderId: latestOrder.id,
        trackingUrl: latestOrder.trackingUrl || undefined,
      }
    }

    if (
      asksOrders &&
      !asksReturns &&
      !asksTracking &&
      !asksShipping &&
      signedIn
    ) {
      if (orders.length === 0) {
        return {
          id: createMessageId(),
          role: 'assistant',
          text: 'I could not find any orders on your account yet. Once you place an order, I can help you view its status, delivery information, and tracking details.',
        }
      }

      const orderSummary = orders
        .slice(0, 3)
        .map((order) => {
          const status =
            order.orderStatus.charAt(0).toUpperCase() +
            order.orderStatus.slice(1)

          return `Order #${order.id
            .slice(-6)
            .toUpperCase()} — ${status} — ₹${order.total.toLocaleString('en-IN')}`
        })
        .join('\n')

      return {
        id: createMessageId(),
        role: 'assistant',
        text: `Certainly${userName ? `, ${userName}` : ''}. Here are your recent orders:\n\n${orderSummary}\n\nWould you like me to show you the tracking details for your latest order?`,
      }
    }

    if (asksShipping) {
      if (signedIn && latestOrder && (normalized.includes('my order') || normalized.includes('my delivery') || normalized.includes('arrive'))) {
        const status =
          latestOrder.orderStatus.charAt(0).toUpperCase() +
          latestOrder.orderStatus.slice(1)

        let text = `For your latest order #${latestOrder.id.slice(-6).toUpperCase()}, the current status is ${status}.`

        if (latestOrder.estimatedDelivery) {
          text += ` The estimated delivery is ${latestOrder.estimatedDelivery}.`
        } else {
          text += ' An estimated delivery date is not available yet.'
        }

        if (latestOrder.trackingCarrier) {
          text += ` The carrier is ${latestOrder.trackingCarrier}.`
        }

        text += ' You can also view the full shipping information below.'

        return {
          id: createMessageId(),
          role: 'assistant',
          text,
          trackingUrl: latestOrder.trackingUrl || undefined,
          actionLabel: 'VIEW SHIPPING & DELIVERY',
          actionPage: 'shipping',
        }
      }

      return {
        id: createMessageId(),
        role: 'assistant',
        text: 'Orders are carefully prepared after purchase. Processing and dispatch timelines are confirmed with your order information and may vary during high-demand periods. Delivery timelines depend on the destination and courier service. Once your order has been dispatched, available shipment information will be provided to you.',
        actionLabel: 'VIEW SHIPPING & DELIVERY',
        actionPage: 'shipping',
      }
    }

    if (asksCancellation) {
      if (signedIn && latestOrder) {
        return {
          id: createMessageId(),
          role: 'assistant',
          text: `I can help with your latest order #${latestOrder.id.slice(-6).toUpperCase()}. Cancellation availability depends on the order status and the applicable THAANE cancellation conditions. If cancellation is accepted and a refund applies, Customer Care will provide the applicable refund information and process details.`,
          actionLabel: 'VIEW CANCELLATION POLICY',
          actionPage: 'cancellation',
        }
      }

      return {
        id: createMessageId(),
        role: 'assistant',
        text: 'Cancellation availability depends on the order status and the applicable THAANE cancellation conditions. Where a cancellation is accepted and a refund applies, Customer Care will provide the applicable refund information and process details.',
        actionLabel: 'VIEW CANCELLATION POLICY',
        actionPage: 'cancellation',
      }
    }

    if (asksReturns) {
      if (signedIn && latestOrder) {
        return {
          id: createMessageId(),
          role: 'assistant',
          text: `I can help with your latest order #${latestOrder.id.slice(-6).toUpperCase()}. Return requests must follow the conditions applicable to the purchased product. Items should be kept in their original condition, with applicable packaging, tags and accessories intact. Where an exchange is available, Customer Care will guide you through the applicable process and product availability. Eligibility for a specific return cannot be determined from the order record alone.`,
          actionLabel: 'VIEW RETURNS & EXCHANGES',
          actionPage: 'returns',
        }
      }

      return {
        id: createMessageId(),
        role: 'assistant',
        text: 'I can help with returns and exchanges. Return requests must follow the conditions applicable to the purchased product. Items should be kept in their original condition, with applicable packaging, tags and accessories intact. Where an exchange is available, Customer Care will guide you through the applicable process and product availability.',
        actionLabel: 'VIEW RETURNS & EXCHANGES',
        actionPage: 'returns',
      }
    }

    if (asksContact) {
      return {
        id: createMessageId(),
        role: 'assistant',
        text: signedIn
          ? 'Of course. THAANE Customer Care is here to assist with orders, delivery, returns, exchanges, and other questions. You can send a Customer Care request below and our team can follow up with you.'
          : 'Of course. THAANE Customer Care is here to assist with orders, delivery, returns, exchanges, and other questions. Please sign in to your THAANE account before sending a Customer Care request.',
      }
    }

    if (isGreeting) {
      return {
        id: createMessageId(),
        role: 'assistant',
        text: signedIn
          ? `Hello${userName ? `, ${userName}` : ''}. It is lovely to have you back at THAANE. How may I assist you today?`
          : 'Hello and welcome to THAANE. How may I assist you today?',
      }
    }

    return {
      id: createMessageId(),
      role: 'assistant',
      text: signedIn
        ? `I would be happy to help${userName ? `, ${userName}` : ''}. You can ask me about your orders, delivery tracking, shipping, returns, exchanges, or contacting THAANE Customer Care.`
        : 'I would be happy to help. You can ask me about shipping, returns, exchanges, or contacting THAANE. Sign in if you would like personalized order assistance.',
    }
  }

  const submitCustomerCareRequest = async () => {
    if (!signedIn || !userEmail || !userId) {
      setCustomerCareError(
        'Please sign in to your THAANE account before contacting Customer Care.',
      )
      return
    }

    const trimmedMessage = customerCareMessage.trim()

    if (!trimmedMessage) {
      setCustomerCareError('Please tell us how we can help.')
      return
    }

    try {
      setCustomerCareSubmitting(true)
      setCustomerCareError('')
      setCustomerCareSuccess(false)

      const currentUser = await import('../lib/firebase').then(
        ({ auth }) => auth.currentUser,
      )

      if (!currentUser) {
        throw new Error('Please sign in again before contacting Customer Care.')
      }

      const idToken = await currentUser.getIdToken()

      const response = await fetch(
        'http://localhost:4242/api/customer-care/requests',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            requestType: customerCareType,
            message: trimmedMessage,
            orderId: customerCareOrderId.trim(),
          }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.error || 'Unable to send your Customer Care request.',
        )
      }

      if (typeof data?.requestId !== 'string' || !data.requestId) {
        throw new Error(
          'Customer Care request was created, but no conversation ID was returned.',
        )
      }

      setCustomerCareRequestId(data.requestId)
      window.localStorage.setItem(
        'thaane-customer-care-request-id',
        data.requestId,
      )
      setCustomerCareSuccess(true)
      setShowCustomerCareForm(false)
      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: 'assistant',
          text: 'Your Customer Care request has been received. Our team will follow up with you.',
        },
      ])
      setCustomerCareMessage('')
      setCustomerCareOrderId('')
    } catch (error) {
      console.error('Customer Care request failed:', error)
      setCustomerCareError(
        error instanceof Error
          ? error.message
          : 'Unable to send your Customer Care request.',
      )
    } finally {
      setCustomerCareSubmitting(false)
    }
  }

  const sendMessage = (text: string) => {
    const trimmed = text.trim()

    if (!trimmed) {
      return
    }

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: 'user',
      text: trimmed,
    }

    const assistantMessage = buildAssistantResponse(trimmed)

    setMessages((current) => [
      ...current,
      userMessage,
      assistantMessage,
    ])
    setInput('')
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    sendMessage(input)
  }

  const handleQuickAction = (prompt: string) => {
    sendMessage(prompt)
  }

  return (
    <>
      <button
        type="button"
        className={`thaane-concierge-launcher${open ? ' is-open' : ''}`}
        onClick={() => setOpen(true)}
        aria-label="Open THAANE Concierge"
      >
        <span>THAANE CONCIERGE</span>
        <Headphones size={15} strokeWidth={1.25} />
      </button>

      {open && (
        <div className="thaane-concierge-shell">
          <div className="thaane-concierge-panel">
            <header className="thaane-concierge-header">
              <div>
                <span className="thaane-concierge-eyebrow">
                  PERSONAL ASSISTANCE
                </span>
                <strong>THAANE CONCIERGE</strong>
              </div>

              <div className="thaane-concierge-header-actions">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close concierge"
                >
                  <X size={15} strokeWidth={1.2} />
                </button>
              </div>
            </header>

            <div className="thaane-concierge-body">
              <div ref={messagesContainerRef} className="thaane-concierge-messages">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`thaane-concierge-message ${
                      message.role === 'user'
                        ? 'is-user'
                        : 'is-assistant'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <span className="thaane-concierge-message-mark">
                        T
                      </span>
                    )}

                    <div className="thaane-concierge-message-content">
                      <div className="thaane-concierge-message-bubble">
                        {message.text.split('\n').map((line, index) => (
                          <span key={`${message.id}-${index}`}>
                            {line}
                            {index < message.text.split('\n').length - 1 && (
                              <br />
                            )}
                          </span>
                        ))}
                      </div>

                      {message.trackingUrl && (
                        <a
                          href={message.trackingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="thaane-concierge-track-link"
                        >
                          TRACK SHIPMENT
                        </a>
                      )}

                      {message.actionLabel && message.actionPage && (
                        <button
                          type="button"
                          className="thaane-concierge-response-action"
                          onClick={() => {
                            onNavigate?.(message.actionPage!)
                            setOpen(false)
                          }}
                        >
                          {message.actionLabel}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              {showCustomerCareForm && (
                <div className="thaane-concierge-message is-assistant">
                  <span className="thaane-concierge-message-mark">
                    T
                  </span>

                  <div className="thaane-concierge-message-content">
                    <div className="thaane-concierge-customer-care">
                      <div>
                        <strong>CONTACT THAANE CUSTOMER CARE</strong>
                        <span>
                          Send your request securely to the THAANE team.
                        </span>
                      </div>

                      {!signedIn ? (
                        <p>
                          Please sign in to your THAANE account to contact
                          Customer Care.
                        </p>
                      ) : (
                        <>
                          <label>
                            REQUEST TYPE
                            <select
                              value={customerCareType}
                              onChange={(event) =>
                                setCustomerCareType(
                                  event.target.value as CustomerCareRequestType,
                                )
                              }
                              disabled={customerCareSubmitting}
                            >
                              <option value="general">General</option>
                              <option value="order">Order</option>
                              <option value="shipping">Shipping</option>
                              <option value="returns">Returns</option>
                              <option value="exchanges">Exchanges</option>
                              <option value="payment">Payment</option>
                              <option value="other">Other</option>
                            </select>
                          </label>

                          <label>
                            ORDER NUMBER (OPTIONAL)
                            <input
                              type="text"
                              value={customerCareOrderId}
                              onChange={(event) =>
                                setCustomerCareOrderId(event.target.value)
                              }
                              placeholder="e.g. THAANE order number"
                              disabled={customerCareSubmitting}
                            />
                          </label>

                          <label>
                            HOW MAY WE HELP?
                            <textarea
                              value={customerCareMessage}
                              onChange={(event) =>
                                setCustomerCareMessage(event.target.value)
                              }
                              placeholder="Tell us how we can help..."
                              rows={4}
                              disabled={customerCareSubmitting}
                            />
                          </label>

                          {customerCareError && (
                            <p className="thaane-concierge-customer-care-error">
                              {customerCareError}
                            </p>
                          )}

                          {customerCareSuccess && (
                            <p className="thaane-concierge-customer-care-success">
                              Your Customer Care request has been received. Our
                              team will follow up with you.
                            </p>
                          )}

                          <button
                            type="button"
                            onClick={() => void submitCustomerCareRequest()}
                            disabled={
                              customerCareSubmitting ||
                              !customerCareMessage.trim()
                            }
                          >
                            {customerCareSubmitting
                              ? 'SENDING...'
                              : 'SEND TO CUSTOMER CARE'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              </div>

              <div className="thaane-concierge-suggestions">
                {quickActions.map((item) => {
                  const Icon = item.icon

                  return (
                    <button
                      type="button"
                      key={item.label}
                      onClick={() => {
                        if (item.label === 'CONTACT THAANE') {
                          sendMessage(item.prompt)
                          setShowCustomerCareForm(true)
                          setCustomerCareError('')
                          setCustomerCareSuccess(false)
                          return
                        }

                        handleQuickAction(item.prompt)
                      }}
                    >
                      <Icon size={14} strokeWidth={1.2} />
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <form
              className="thaane-concierge-input"
              onSubmit={handleSubmit}
            >
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="ASK THAANE ANYTHING..."
                aria-label="Message THAANE Concierge"
              />

              <button
                type="submit"
                aria-label="Send message"
                disabled={!input.trim()}
              >
                <ArrowUp size={15} strokeWidth={1.2} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
