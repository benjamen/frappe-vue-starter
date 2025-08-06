import { io } from "socket.io-client"

let socket = null
export function initSocket() {
	const host = window.location.hostname
	
	// Handle site name properly for different environments
	let siteName = window.site_name
	
	// If site_name is not set or contains Jinja template, use default
	if (!siteName || siteName.includes('{{') || siteName.includes('}}')) {
		siteName = 'home.localhost'
	}
	
	// Socket.io configuration for Frappe
	const socketPort = 9000
	const protocol = "http" // Use http for development
	
	// Correct socket.io URL format for Frappe
	const url = `${protocol}://${host}:${socketPort}`
	
	console.log('[Socket] Connecting to:', url)
	console.log('[Socket] Site name:', siteName)

	socket = io(url, {
		withCredentials: true,
		reconnectionAttempts: 5,
		reconnection: true,
		reconnectionDelay: 1000,
		// Pass site name as query parameter or in auth
		query: {
			site: siteName
		}
	})
	
	socket.on('connect', () => {
		console.log('[Socket] Connected successfully')
	})
	
	socket.on('connect_error', (error) => {
		console.warn('[Socket] Connection failed:', error)
		// For development, socket connection failures are often not critical
	})
	
	return socket
}