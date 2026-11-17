import jwt from 'jsonwebtoken'
import { User } from './models.js'

export async function requireAuth(request, response, next) {
  const authorization = request.headers.authorization
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : ''
  if (!token) return response.status(401).json({ message: 'Sign in to continue.' })

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(payload.sub).select('_id role name email')
    if (!user) return response.status(401).json({ message: 'Your session is no longer valid.' })
    request.user = user
    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return response.status(401).json({ message: 'Your session has expired. Please sign in again.' })
    }
    next(error)
  }
}

export function requireEditor(request, response, next) {
  if (!request.user || !['admin', 'editor'].includes(request.user.role)) {
    return response.status(403).json({ message: 'Editor access is required.' })
  }
  next()
}
