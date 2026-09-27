const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const Razorpay = require('razorpay')
const { cert, getApps, initializeApp } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')
const { getFirestore } = require('firebase-admin/firestore')

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4242

app.use(cors())
app.use(express.json())

const firebaseAdminApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert(
          require('./thaane-firebase-adminsdk.json'),
        ),
      })

const adminDb = getFirestore(firebaseAdminApp)
const adminAuth = getAuth(firebaseAdminApp)

const razorpay =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      })
    : null

// THAANE product prices in INR.
// The server, not the browser, determines the payable amount.
const products = {
  'dress-001': 8900,
  'top-001': 4500,
  'blouse-001': 5200,
  'coord-001': 7800,
  'kurta-001': 6200,
  'trouser-001': 5800,
  'saree-001': 12500,
  'bag-001': 6900,
  'jewellery-001': 3900,
  'footwear-001': 7200,
  'scarf-001': 3200,
}

async function requireAdmin(req, res, next) {
  try {
    const authorization = req.headers.authorization || ''

    if (!authorization.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
      })
    }

    const idToken = authorization.slice('Bearer '.length).trim()

    if (!idToken) {
      return res.status(401).json({
        error: 'Authentication required',
      })
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken)

    if (
      decodedToken.email?.toLowerCase() !==
      'princevenkatesh879@gmail.com'
    ) {
      return res.status(403).json({
        error: 'Admin access required',
      })
    }

    req.adminUser = decodedToken
    return next()
  } catch (error) {
    console.error('Admin authentication failed:', error)

    return res.status(401).json({
      error: 'Invalid authentication token',
    })
  }
}

async function requireCustomerCare(req, res, next) {
  try {
    const authorization = req.headers.authorization || ''

    if (!authorization.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
      })
    }

    const idToken = authorization.slice('Bearer '.length).trim()

    if (!idToken) {
      return res.status(401).json({
        error: 'Authentication required',
      })
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const email = decodedToken.email?.toLowerCase()

    console.log('Customer Care login check:', {
      uid: decodedToken.uid,
      email,
      emailVerified: decodedToken.email_verified,
    })

    if (email === 'princevenkatesh879@gmail.com') {
      req.customerCareUser = decodedToken
      req.customerCareRole = 'admin'
      return next()
    }

    if (!email) {
      return res.status(403).json({
        error: 'Customer Care access required',
      })
    }

    const staffSnapshot = await adminDb
      .collection('customerCareStaff')
      .where('email', '==', email)
      .where('active', '==', true)
      .limit(1)
      .get()

    if (staffSnapshot.empty) {
      return res.status(403).json({
        error: 'Customer Care access required',
      })
    }

    req.customerCareUser = decodedToken
    req.customerCareRole = 'customer-care'

    return next()
  } catch (error) {
    console.error(
      'Customer Care authentication failed:',
      error,
    )

    return res.status(401).json({
      error: 'Invalid authentication token',
    })
  }
}

app.get(
  '/api/customer-care/access',
  requireCustomerCare,
  async (req, res) => {
    return res.json({
      authorized: true,
      role: req.customerCareRole || 'customer-care',
      email: req.customerCareUser?.email || '',
    })
  },
)

app.get('/api/admin/customers', requireAdmin, async (_req, res) => {
  try {
    const listUsersResult = []
    let nextPageToken

    do {
      const result = await adminAuth.listUsers(1000, nextPageToken)
      listUsersResult.push(...result.users)
      nextPageToken = result.pageToken
    } while (nextPageToken)

    const customers = listUsersResult.map((customer) => ({
      uid: customer.uid,
      email: customer.email || '',
      displayName: customer.displayName || '',
      phoneNumber: customer.phoneNumber || '',
      photoURL: customer.photoURL || '',
      disabled: customer.disabled,
      emailVerified: customer.emailVerified,
      createdAt: customer.metadata.creationTime || null,
      lastSignInAt: customer.metadata.lastSignInTime || null,
    }))

    return res.json({
      customers,
      count: customers.length,
    })
  } catch (error) {
    console.error('Failed to load admin customers:', error)

    return res.status(500).json({
      error: 'Unable to load customers',
    })
  }
})


app.get(
  '/api/admin/customer-care/staff',
  requireAdmin,
  async (_req, res) => {
    try {
      const snapshot = await adminDb
        .collection('customerCareStaff')
        .orderBy('createdAt', 'desc')
        .get()

      const staff = snapshot.docs.map((document) => {
        const data = document.data()

        return {
          uid: data.uid || document.id,
          email: data.email || '',
          displayName: data.displayName || '',
          role: data.role || 'customer-care',
          active: data.active !== false,
          createdAt:
            data.createdAt?.toDate?.()?.toISOString() || null,
          updatedAt:
            data.updatedAt?.toDate?.()?.toISOString() || null,
        }
      })

      return res.json({
        staff,
        count: staff.length,
      })
    } catch (error) {
      console.error(
        'Failed to load Customer Care staff:',
        error,
      )

      return res.status(500).json({
        error: 'Unable to load Customer Care staff.',
      })
    }
  },
)

app.post(
  '/api/admin/customer-care/staff',
  requireAdmin,
  async (req, res) => {
    try {
      const {
        email,
        displayName = '',
      } = req.body || {}

      const normalizedEmail =
        typeof email === 'string'
          ? email.trim().toLowerCase()
          : ''

      if (!normalizedEmail) {
        return res.status(400).json({
          error: 'Employee Google email is required.',
        })
      }

      const normalizedDisplayName =
        typeof displayName === 'string'
          ? displayName.trim()
          : ''

      const existingStaff = await adminDb
        .collection('customerCareStaff')
        .where('email', '==', normalizedEmail)
        .limit(1)
        .get()

      if (!existingStaff.empty) {
        return res.status(409).json({
          error: 'A Customer Care employee with this Google email already exists.',
        })
      }

      const staffRef = adminDb
        .collection('customerCareStaff')
        .doc(normalizedEmail)

      await staffRef.set({
        uid: null,
        email: normalizedEmail,
        displayName:
          normalizedDisplayName || normalizedEmail,
        role: 'customer-care',
        active: true,
        createdAt: require('firebase-admin/firestore')
          .FieldValue.serverTimestamp(),
        updatedAt: require('firebase-admin/firestore')
          .FieldValue.serverTimestamp(),
      })

      return res.status(201).json({
        success: true,
        employee: {
          uid: null,
          email: normalizedEmail,
          displayName:
            normalizedDisplayName || normalizedEmail,
          role: 'customer-care',
          active: true,
        },
      })
    } catch (error) {
      console.error(
        'Customer Care employee authorization failed:',
        error,
      )

      return res.status(500).json({
        error: 'Unable to authorize Customer Care employee.',
      })
    }
  },
)

app.get(
  '/api/customer-care/me',
  async (req, res) => {
    try {
      const authorization = req.headers.authorization || ''

      if (!authorization.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Authentication required',
        })
      }

      const idToken = authorization.slice('Bearer '.length).trim()

      if (!idToken) {
        return res.status(401).json({
          error: 'Authentication required',
        })
      }

      const decodedToken = await adminAuth.verifyIdToken(idToken)
      const email = decodedToken.email?.trim().toLowerCase()

      if (!email) {
        return res.status(403).json({
          error: 'A verified Google email is required.',
        })
      }

      const snapshot = await adminDb
        .collection('customerCareStaff')
        .where('email', '==', email)
        .limit(1)
        .get()

      if (snapshot.empty) {
        return res.status(403).json({
          error: 'Customer Care access is not authorized.',
        })
      }

      const document = snapshot.docs[0]
      const data = document.data()

      if (data.active !== true) {
        return res.status(403).json({
          error: 'Customer Care employee access is inactive.',
        })
      }

      if (!data.uid || data.uid !== decodedToken.uid) {
        await document.ref.update({
          uid: decodedToken.uid,
          updatedAt: require('firebase-admin/firestore')
            .FieldValue.serverTimestamp(),
        })
      }

      return res.json({
        authorized: true,
        employee: {
          uid: decodedToken.uid,
          email,
          displayName:
            data.displayName ||
            decodedToken.name ||
            email,
          role: data.role || 'customer-care',
          active: true,
        },
      })
    } catch (error) {
      console.error(
        'Customer Care authorization check failed:',
        error,
      )

      return res.status(401).json({
        error: 'Unable to verify Customer Care access.',
      })
    }
  },
)

app.post('/api/customer-care/requests', async (req, res) => {
  try {
    const authorization = req.headers.authorization || ''

    if (!authorization.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
      })
    }

    const idToken = authorization.slice('Bearer '.length).trim()

    if (!idToken) {
      return res.status(401).json({
        error: 'Authentication required',
      })
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken)

    const {
      requestType = 'general',
      message,
      orderId = '',
    } = req.body || {}

    if (
      typeof message !== 'string' ||
      !message.trim()
    ) {
      return res.status(400).json({
        error: 'Customer Care message is required.',
      })
    }

    const allowedRequestTypes = [
      'general',
      'order',
      'shipping',
      'returns',
      'exchanges',
      'payment',
      'other',
    ]

    const normalizedRequestType =
      typeof requestType === 'string' &&
      allowedRequestTypes.includes(requestType)
        ? requestType
        : 'general'

    const customerName =
      decodedToken.name ||
      decodedToken.email ||
      'THAANE Customer'

    const requestReference = await adminDb
      .collection('customerCareRequests')
      .add({
        userId: decodedToken.uid,
        customerEmail: decodedToken.email || '',
        customerName,
        orderId:
          typeof orderId === 'string'
            ? orderId.trim()
            : '',
        requestType: normalizedRequestType,
        message: message.trim(),
        status: 'open',
        createdAt: require('firebase-admin/firestore')
          .FieldValue.serverTimestamp(),
        updatedAt: require('firebase-admin/firestore')
          .FieldValue.serverTimestamp(),
      })

    return res.status(201).json({
      success: true,
      requestId: requestReference.id,
      status: 'open',
    })
  } catch (error) {
    console.error(
      'Customer Care request creation failed:',
      error,
    )

    return res.status(500).json({
      error: 'Unable to create Customer Care request.',
    })
  }
})



app.get(
  '/api/customer-care/requests/:requestId/messages',
  async (req, res) => {
    try {
      const authorization = req.headers.authorization || ''

      if (!authorization.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Authentication required',
        })
      }

      const idToken = authorization.slice('Bearer '.length).trim()

      if (!idToken) {
        return res.status(401).json({
          error: 'Authentication required',
        })
      }

      const decodedToken = await adminAuth.verifyIdToken(idToken)
      const { requestId } = req.params

      const requestReference = adminDb
        .collection('customerCareRequests')
        .doc(requestId)

      const requestSnapshot = await requestReference.get()

      if (!requestSnapshot.exists) {
        return res.status(404).json({
          error: 'Customer Care request not found.',
        })
      }

      const requestData = requestSnapshot.data()

      if (requestData.userId !== decodedToken.uid) {
        return res.status(403).json({
          error: 'You do not have access to this Customer Care conversation.',
        })
      }

      const snapshot = await requestReference
        .collection('messages')
        .orderBy('createdAt', 'asc')
        .get()

      const initialMessage = {
        id: `request-${requestId}`,
        senderType: 'customer',
        senderName:
          requestData.customerName ||
          decodedToken.name ||
          decodedToken.email ||
          'THAANE Customer',
        senderEmail:
          requestData.customerEmail ||
          decodedToken.email ||
          '',
        message: requestData.message || '',
        createdAt:
          requestData.createdAt?.toDate?.()?.toISOString() || null,
      }

      const replies = snapshot.docs.map((document) => {
        const data = document.data()

        return {
          id: document.id,
          senderType: data.senderType || 'customer',
          senderName: data.senderName || '',
          senderEmail: data.senderEmail || '',
          message: data.message || '',
          createdAt:
            data.createdAt?.toDate?.()?.toISOString() || null,
        }
      })

      const allMessages = [
        initialMessage,
        ...replies,
      ]

      console.log(
        '[CUSTOMER CARE] Customer message fetch:',
        JSON.stringify({
          requestId,
          userId: decodedToken.uid,
          storedMessageCount: snapshot.size,
          returnedMessageCount: allMessages.length,
          messages: allMessages.map((message) => ({
            id: message.id,
            senderType: message.senderType,
            message: message.message,
          })),
        }),
      )

      return res.json({
        requestId,
        status: requestData.status || 'open',
        messages: allMessages,
      })
    } catch (error) {
      console.error(
        'Failed to load customer Customer Care messages:',
        error,
      )

      return res.status(500).json({
        error: 'Unable to load Customer Care messages.',
      })
    }
  },
)

app.get(
  '/api/admin/customer-care/requests/:requestId/messages',
  requireCustomerCare,
  async (req, res) => {
    try {
      const { requestId } = req.params

      const snapshot = await adminDb
        .collection('customerCareRequests')
        .doc(requestId)
        .collection('messages')
        .orderBy('createdAt', 'asc')
        .get()

      const messages = snapshot.docs.map((document) => {
        const data = document.data()

        return {
          id: document.id,
          senderType: data.senderType || 'customer',
          senderName: data.senderName || '',
          senderEmail: data.senderEmail || '',
          message: data.message || '',
          createdAt:
            data.createdAt?.toDate?.()?.toISOString() || null,
        }
      })

      return res.json({
        requestId,
        messages,
      })
    } catch (error) {
      console.error(
        'Failed to load Customer Care messages:',
        error,
      )

      return res.status(500).json({
        error: 'Unable to load Customer Care messages.',
      })
    }
  },
)

app.post(
  '/api/admin/customer-care/requests/:requestId/messages',
  requireCustomerCare,
  async (req, res) => {
    try {
      const { requestId } = req.params
      const { message } = req.body || {}

      if (
        typeof message !== 'string' ||
        !message.trim()
      ) {
        return res.status(400).json({
          error: 'Customer Care reply is required.',
        })
      }

      const requestReference = adminDb
        .collection('customerCareRequests')
        .doc(requestId)

      const requestSnapshot = await requestReference.get()

      if (!requestSnapshot.exists) {
        return res.status(404).json({
          error: 'Customer Care request not found.',
        })
      }

      const sender = req.customerCareUser || {}

      const messageReference = await requestReference
        .collection('messages')
        .add({
          senderType:
            req.customerCareRole === 'admin'
              ? 'admin'
              : 'customer-care',
          senderName:
            sender.name ||
            sender.email ||
            'THAANE Customer Care',
          senderEmail: sender.email || '',
          message: message.trim(),
          createdAt: require('firebase-admin/firestore')
            .FieldValue.serverTimestamp(),
        })

      await requestReference.update({
        updatedAt: require('firebase-admin/firestore')
          .FieldValue.serverTimestamp(),
      })

      return res.status(201).json({
        success: true,
        message: {
          id: messageReference.id,
          senderType:
            req.customerCareRole === 'admin'
              ? 'admin'
              : 'customer-care',
          senderName:
            sender.name ||
            sender.email ||
            'THAANE Customer Care',
          senderEmail: sender.email || '',
          message: message.trim(),
        },
      })
    } catch (error) {
      console.error(
        'Failed to send Customer Care reply:',
        error,
      )

      return res.status(500).json({
        error: 'Unable to send Customer Care reply.',
      })
    }
  },
)

app.get(
  '/api/admin/customer-care/requests',
  requireCustomerCare,
  async (_req, res) => {
    try {
      const snapshot = await adminDb
        .collection('customerCareRequests')
        .orderBy('createdAt', 'desc')
        .get()

      const requests = snapshot.docs.map((document) => {
        const data = document.data()

        return {
          id: document.id,
          userId: data.userId || '',
          customerEmail: data.customerEmail || '',
          customerName: data.customerName || 'THAANE Customer',
          orderId: data.orderId || '',
          requestType: data.requestType || 'general',
          message: data.message || '',
          status: data.status || 'open',
          createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
        }
      })

      return res.json({
        requests,
        count: requests.length,
      })
    } catch (error) {
      console.error(
        'Failed to load Customer Care requests:',
        error,
      )

      return res.status(500).json({
        error: 'Unable to load Customer Care requests.',
      })
    }
  },
)

app.patch(
  '/api/admin/customer-care/requests/:requestId',
  requireCustomerCare,
  async (req, res) => {
    try {
      const { requestId } = req.params
      const { status } = req.body || {}

      const allowedStatuses = [
        'open',
        'in progress',
        'resolved',
      ]

      if (
        typeof status !== 'string' ||
        !allowedStatuses.includes(status)
      ) {
        return res.status(400).json({
          error: 'Invalid Customer Care status.',
        })
      }

      const requestReference = adminDb
        .collection('customerCareRequests')
        .doc(requestId)

      const requestSnapshot = await requestReference.get()

      if (!requestSnapshot.exists) {
        return res.status(404).json({
          error: 'Customer Care request not found.',
        })
      }

      await requestReference.update({
        status,
        updatedAt: require('firebase-admin/firestore')
          .FieldValue.serverTimestamp(),
      })

      return res.json({
        success: true,
        requestId,
        status,
      })
    } catch (error) {
      console.error(
        'Failed to update Customer Care request:',
        error,
      )

      return res.status(500).json({
        error: 'Unable to update Customer Care request.',
      })
    }
  },
)

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'THAANE payments',
    razorpayConfigured: Boolean(razorpay),
  })
})

app.post('/api/create-order', async (req, res) => {
  if (!razorpay) {
    return res.status(503).json({
      error: 'Razorpay is not configured yet.',
    })
  }

  try {
    const authorization = req.headers.authorization || ''

    if (!authorization.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required.',
      })
    }

    const idToken = authorization.slice('Bearer '.length).trim()

    if (!idToken) {
      return res.status(401).json({
        error: 'Authentication required.',
      })
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken)

    const {
      items,
      currency = 'INR',
      customerName = '',
      customerEmail = '',
      address,
    } = req.body || {}

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'Your bag is empty.',
      })
    }

    if (currency !== 'INR') {
      return res.status(400).json({
        error: 'Only INR orders are supported.',
      })
    }

    if (!address || typeof address !== 'object') {
      return res.status(400).json({
        error: 'Delivery address is missing.',
      })
    }

    let total = 0
    const trustedItems = []

    for (const item of items) {
      const price = products[item.productId]
      const quantity = Number(item.quantity)

      if (!price || !Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({
          error: 'Invalid product or quantity.',
        })
      }

      total += price * quantity

      trustedItems.push({
        productId: String(item.productId),
        productName: String(item.productName ?? ''),
        quantity,
        size: String(item.size ?? ''),
        color: String(item.color ?? ''),
      })
    }

    const order = await razorpay.orders.create({
      amount: total * 100,
      currency: 'INR',
      receipt: `thaane_${Date.now()}`,
    })

    await adminDb
      .collection('pendingCheckouts')
      .doc(order.id)
      .set({
        razorpayOrderId: order.id,
        userId: decodedToken.uid,
        customerEmail: decodedToken.email || String(customerEmail || ''),
        customerName:
          String(customerName || '').trim() ||
          decodedToken.name ||
          decodedToken.email ||
          'THAANE Customer',
        items: trustedItems,
        address: {
          fullName: String(address.fullName ?? ''),
          phone: String(address.phone ?? ''),
          addressLine1: String(address.addressLine1 ?? ''),
          addressLine2: String(address.addressLine2 ?? ''),
          city: String(address.city ?? ''),
          state: String(address.state ?? ''),
          postalCode: String(address.postalCode ?? ''),
          country: String(address.country ?? 'India'),
        },
        subtotal: total,
        shipping: 0,
        total,
        currency: 'INR',
        status: 'created',
        createdAt: require('firebase-admin/firestore').FieldValue.serverTimestamp(),
        updatedAt: require('firebase-admin/firestore').FieldValue.serverTimestamp(),
      })

    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    })
  } catch (error) {
    console.error('Razorpay order creation failed:', error)

    res.status(500).json({
      error: 'Unable to create payment order.',
    })
  }
})

app.post('/api/verify-payment', async (req, res) => {
  try {
    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(503).json({
        error: 'Razorpay is not configured yet.',
      })
    }

    const authorization = req.headers.authorization || ''

    if (!authorization.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required.',
      })
    }

    const idToken = authorization.slice('Bearer '.length).trim()

    if (!idToken) {
      return res.status(401).json({
        error: 'Authentication required.',
      })
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken)

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body || {}

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        error: 'Missing payment verification details.',
      })
    }

    const pendingReference = adminDb
      .collection('pendingCheckouts')
      .doc(razorpay_order_id)

    const pendingSnapshot = await pendingReference.get()

    if (!pendingSnapshot.exists) {
      return res.status(404).json({
        verified: false,
        error: 'Checkout session not found or expired.',
      })
    }

    const pendingCheckout = pendingSnapshot.data()

    if (pendingCheckout.userId !== decodedToken.uid) {
      return res.status(403).json({
        verified: false,
        error: 'This payment does not belong to the signed-in customer.',
      })
    }

    const crypto = require('crypto')

    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    const suppliedSignature = String(razorpay_signature)

    const generatedBuffer = Buffer.from(generatedSignature, 'utf8')
    const suppliedBuffer = Buffer.from(suppliedSignature, 'utf8')

    if (
      generatedBuffer.length !== suppliedBuffer.length ||
      !crypto.timingSafeEqual(generatedBuffer, suppliedBuffer)
    ) {
      return res.status(400).json({
        verified: false,
        error: 'Payment verification failed.',
      })
    }

    const razorpayOrder = await razorpay.orders.fetch(razorpay_order_id)

    if (
      !razorpayOrder ||
      Number(razorpayOrder.amount) !== Number(pendingCheckout.total) * 100 ||
      razorpayOrder.currency !== 'INR'
    ) {
      return res.status(400).json({
        verified: false,
        error: 'Payment order amount does not match the checkout.',
      })
    }

    const razorpayPayment = await razorpay.payments.fetch(
      razorpay_payment_id,
    )

    if (
      !razorpayPayment ||
      razorpayPayment.order_id !== razorpay_order_id ||
      Number(razorpayPayment.amount) !== Number(pendingCheckout.total) * 100 ||
      razorpayPayment.currency !== 'INR'
    ) {
      return res.status(400).json({
        verified: false,
        error: 'Payment details do not match the checkout.',
      })
    }

    if (razorpayPayment.status !== 'captured') {
      return res.status(400).json({
        verified: false,
        error: 'Payment has not been captured yet.',
      })
    }

    const orderReference = adminDb
      .collection('orders')
      .doc(razorpay_order_id)

    const orderResult = await adminDb.runTransaction(async (transaction) => {
      const existingOrderSnapshot = await transaction.get(orderReference)

      if (existingOrderSnapshot.exists) {
        const existingOrder = existingOrderSnapshot.data()

        if (
          existingOrder.razorpayPaymentId &&
          existingOrder.razorpayPaymentId !== razorpay_payment_id
        ) {
          throw new Error('This Razorpay order has already been processed.')
        }

        transaction.set(
          pendingReference,
          {
            status: 'paid',
            updatedAt: require('firebase-admin/firestore')
              .FieldValue.serverTimestamp(),
          },
          { merge: true },
        )

        return {
          created: false,
          paymentId:
            existingOrder.razorpayPaymentId || razorpay_payment_id,
        }
      }

      const trustedItems = Array.isArray(pendingCheckout.items)
        ? pendingCheckout.items.map((item) => ({
            productId: String(item.productId),
            productName: String(item.productName ?? ''),
            quantity: Number(item.quantity),
            price: products[item.productId],
            size: String(item.size ?? ''),
            color: String(item.color ?? ''),
          }))
        : []

      if (trustedItems.length === 0) {
        throw new Error('Checkout items are missing.')
      }

      transaction.create(orderReference, {
        userId: pendingCheckout.userId,
        customerEmail: pendingCheckout.customerEmail || '',
        customerName:
          String(pendingCheckout.customerName || '').trim() ||
          'THAANE Customer',
        items: trustedItems,
        address: {
          fullName: String(pendingCheckout.address?.fullName ?? ''),
          phone: String(pendingCheckout.address?.phone ?? ''),
          addressLine1: String(
            pendingCheckout.address?.addressLine1 ?? '',
          ),
          addressLine2: String(
            pendingCheckout.address?.addressLine2 ?? '',
          ),
          city: String(pendingCheckout.address?.city ?? ''),
          state: String(pendingCheckout.address?.state ?? ''),
          postalCode: String(
            pendingCheckout.address?.postalCode ?? '',
          ),
          country: String(
            pendingCheckout.address?.country ?? 'India',
          ),
        },
        subtotal: Number(pendingCheckout.total),
        shipping: Number(pendingCheckout.shipping || 0),
        total: Number(pendingCheckout.total),
        currency: 'INR',
        paymentMethod: 'RAZORPAY',
        paymentStatus: 'paid',
        orderStatus: 'confirmed',
        trackingNumber: '',
        trackingCarrier: '',
        estimatedDelivery: '',
        trackingUrl: '',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        createdAt: require('firebase-admin/firestore')
          .FieldValue.serverTimestamp(),
        updatedAt: require('firebase-admin/firestore')
          .FieldValue.serverTimestamp(),
      })

      transaction.set(
        pendingReference,
        {
          status: 'paid',
          razorpayPaymentId: razorpay_payment_id,
          updatedAt: require('firebase-admin/firestore')
            .FieldValue.serverTimestamp(),
        },
        { merge: true },
      )

      return {
        created: true,
        paymentId: razorpay_payment_id,
      }
    })

    return res.json({
      verified: true,
      paymentId: orderResult.paymentId,
      orderId: orderReference.id,
      alreadyProcessed: !orderResult.created,
    })
  } catch (error) {
    console.error('Payment verification failed:', error)

    if (
      error instanceof Error &&
      error.message === 'This Razorpay order has already been processed.'
    ) {
      return res.status(409).json({
        verified: false,
        error: error.message,
      })
    }

    return res.status(500).json({
      verified: false,
      error: 'Unable to verify payment.',
    })
  }
})

app.listen(PORT, () => {
  console.log(`THAANE payment server running on http://localhost:${PORT}`)
})
