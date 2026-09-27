import { User } from 'firebase/auth'

const ADMIN_EMAILS = [
  'princevenkatesh879@gmail.com',
]

export function isAdmin(user: User | null): boolean {
  if (!user?.email) {
    return false
  }

  return ADMIN_EMAILS.includes(user.email.toLowerCase())
}
