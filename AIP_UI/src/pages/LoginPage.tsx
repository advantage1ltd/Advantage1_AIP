import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Eye, EyeOff, Mail, Lock, Users, Settings, MapPin, Shield } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { usePageAccess } from '@/contexts/PageAccessContext'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/config/api'
import { useToast } from '@/hooks/use-toast'

interface LoginError {
	type: 'credentials' | 'network' | 'server' | 'validation'
	message: string
}

// Remove the roleRedirect function since we handle redirection inline now

const getErrorMessage = (
	error: LoginError
): {
	title: string
	message: string
} => {
	switch (error.type) {
		case 'credentials':
			return {
				title: 'Authentication Failed',
				message: error.message,
			}
		case 'validation':
			return {
				title: 'Invalid Input',
				message: error.message,
			}
		default:
			return {
				title: 'Error',
				message: error.message,
			}
	}
}

export default function LoginPage() {
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [showPassword, setShowPassword] = useState(false)
	const [rememberMe, setRememberMe] = useState(false)
	const [error, setError] = useState<LoginError | null>(null)
	const [loading, setLoading] = useState(false)
	const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false)
	const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
	const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)
	const [forgotPasswordError, setForgotPasswordError] = useState<string | null>(null)
	const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false)
	const navigate = useNavigate()
	const { setCurrentRole } = usePageAccess()
	const { login } = useAuth()
	const { toast } = useToast()

	const validateForm = (): boolean => {
		if (!username.trim()) {
			setError({
				type: 'validation',
				message: 'Username is required',
			})
			return false
		}
		if (!password.trim()) {
			setError({
				type: 'validation',
				message: 'Password is required',
			})
			return false
		}
		return true
	}

	const handleTogglePasswordVisibility = () => {
		setShowPassword((prev) => !prev)
	}

	const handleForgotPasswordOpen = () => {
		setForgotPasswordOpen(true)
		setForgotPasswordEmail('')
		setForgotPasswordError(null)
		setForgotPasswordSuccess(false)
	}

	const handleForgotPasswordClose = () => {
		setForgotPasswordOpen(false)
		setForgotPasswordEmail('')
		setForgotPasswordError(null)
		setForgotPasswordSuccess(false)
	}

	const validateEmail = (email: string): boolean => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		return emailRegex.test(email)
	}

	const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setForgotPasswordError(null)
		setForgotPasswordSuccess(false)

		// Validate email
		if (!forgotPasswordEmail.trim()) {
			setForgotPasswordError('Email is required')
			return
		}

		if (!validateEmail(forgotPasswordEmail)) {
			setForgotPasswordError('Please enter a valid email address')
			return
		}

		setForgotPasswordLoading(true)

		try {
			const response = await api.post('/Auth/forgot-password', {
				email: forgotPasswordEmail.trim(),
			})

			if (response.data.success) {
				setForgotPasswordSuccess(true)
				toast({
					title: 'Password reset email sent',
					description: 'If the email exists in our system, you will receive a password reset link.',
				})
				// Auto-close after 3 seconds
				setTimeout(() => {
					handleForgotPasswordClose()
				}, 3000)
			} else {
				setForgotPasswordError(response.data.message || 'Failed to send password reset email')
			}
		} catch (err: any) {
			console.error('❌ Forgot password error:', err)
			const errorMessage =
				err.response?.data?.message ||
				err.message ||
				'An error occurred while processing your request. Please try again.'
			setForgotPasswordError(errorMessage)
		} finally {
			setForgotPasswordLoading(false)
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError(null)
		console.log('🔒 Starting login process...', { username })

		if (!validateForm()) {
			console.log('❌ Form validation failed')
			return
		}

		setLoading(true)
		try {
			const loggedInUser = await login(username, password)

			console.log('✅ Login successful:', {
				username: loggedInUser.username,
				role: loggedInUser.role,
				timestamp: new Date().toISOString(),
			})

			// Set the page access role - use role if pageAccessRole is not available
			const roleToSet = loggedInUser.role
			console.log('🔑 Setting role for page access:', roleToSet)
			console.log('🔍 Full user object from login:', loggedInUser)

			// Set role (don't await - let it load in background)
			setCurrentRole(roleToSet).catch((err) => {
				console.warn('⚠️ [LoginPage] Error setting role:', err)
			})

			// All users now go to /dashboard
			const redirectPath = '/dashboard'
			console.log('🔄 Redirecting to:', redirectPath)

			// Use replace to prevent going back to login page
			navigate(redirectPath, { replace: true })
		} catch (err) {
			console.error('❌ Login error:', err)
			setError({
				type: 'credentials',
				message: err instanceof Error ? err.message : 'An error occurred during login',
			})
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="relative min-h-screen overflow-hidden">
			{/* Background Image */}
			<div
				className="absolute inset-0 bg-cover bg-center bg-no-repeat"
				style={{ backgroundImage: 'url("/Login-bg.png")' }}
				aria-hidden="true"
			/>
			
			{/* Subtle Overlay for better readability */}
			<div className="absolute inset-0 bg-black/20" aria-hidden="true" />

			{/* Digital Network Overlay on Left Side */}
			<div className="absolute inset-0 pointer-events-none z-[5]" aria-hidden="true">
				<div className="relative w-full h-full">
					{/* Glowing Network Lines */}
					<svg className="absolute left-0 top-0 w-1/2 h-full opacity-40" style={{ filter: 'blur(0.5px)' }}>
						<defs>
							<linearGradient id="networkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
								<stop offset="0%" stopColor="#60a5fa" stopOpacity="0.6" />
								<stop offset="50%" stopColor="#3b82f6" stopOpacity="0.4" />
								<stop offset="100%" stopColor="#2563eb" stopOpacity="0.3" />
							</linearGradient>
						</defs>
						{/* Network connections */}
						<line x1="15%" y1="25%" x2="35%" y2="45%" stroke="url(#networkGradient)" strokeWidth="1.5" />
						<line x1="20%" y1="40%" x2="40%" y2="55%" stroke="url(#networkGradient)" strokeWidth="1.5" />
						<line x1="25%" y1="30%" x2="45%" y2="50%" stroke="url(#networkGradient)" strokeWidth="1.5" />
						<line x1="30%" y1="50%" x2="50%" y2="65%" stroke="url(#networkGradient)" strokeWidth="1.5" />
						<line x1="10%" y1="35%" x2="30%" y2="60%" stroke="url(#networkGradient)" strokeWidth="1.5" />
					</svg>
					
					{/* Floating Security Icons - Subtle */}
					<div className="absolute top-[28%] left-[18%] text-blue-400/20" style={{ animationDelay: '0s' }}>
						<Users className="h-6 w-6" />
					</div>
					<div className="absolute top-[35%] left-[25%] text-blue-400/15" style={{ animationDelay: '0.5s' }}>
						<Settings className="h-5 w-5" />
					</div>
					<div className="absolute top-[45%] left-[22%] text-blue-400/18" style={{ animationDelay: '1s' }}>
						<Shield className="h-6 w-6" />
					</div>
					<div className="absolute top-[55%] left-[32%] text-blue-400/12" style={{ animationDelay: '1.5s' }}>
						<MapPin className="h-5 w-5" />
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="relative z-10 min-h-screen flex flex-col lg:flex-row">
				{/* Left Side - Branding (Positioned at Top) */}
				<div className="flex-1 flex flex-col justify-start lg:justify-start pt-8 lg:pt-16 px-6 lg:px-12 xl:px-16">
					<div className="max-w-2xl">
						{/* Logo - Larger with better contrast */}
						<div className="mb-8 lg:mb-10">
							<div className="inline-block bg-white/10 backdrop-blur-sm rounded-lg p-3 lg:p-4 border border-white/20 shadow-lg">
								<img
									src="/Advantage One.png"
									alt="Advantage One Security"
									className="h-20 sm:h-24 lg:h-32 xl:h-36 w-auto object-contain drop-shadow-lg"
								/>
							</div>
						</div>

						{/* Product Title - Bigger and Bolder */}
						<h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-[1.05] mb-6 tracking-tight" style={{ textShadow: '2px 2px 8px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 0, 0, 0.3)' }}>
							Incident Management
							<br />
							System
						</h2>
						
						{/* Tagline - Better contrast */}
						<p className="text-lg sm:text-xl lg:text-2xl text-white font-medium max-w-md leading-relaxed drop-shadow-md">
							Secure access to your security management portal
						</p>
					</div>
				</div>

				{/* Right Side - Login Form (Moved slightly left for better balance) */}
				<div className="flex-1 flex items-center justify-center px-6 lg:px-8 xl:px-12 py-12 lg:py-0 lg:pr-16">
					<div className="w-full max-w-md lg:mr-0 xl:mr-8">
						{/* Login Card */}
						<div className="bg-white/95 backdrop-blur-md rounded-xl border border-white/20 shadow-2xl p-6 sm:p-8">
							{/* Login Title */}
							<div className="mb-6 sm:mb-8">
								<h3 className="text-2xl sm:text-3xl font-semibold text-gray-900 text-center">
									Log in
								</h3>
								<p className="text-sm text-gray-600 text-center mt-2">
									Enter your credentials to continue
								</p>
							</div>

							{/* Error Alert */}
							{error && (
								<Alert variant="destructive" className="mb-6">
									<h3 className="font-medium">{getErrorMessage(error).title}</h3>
									<p className="text-sm">{getErrorMessage(error).message}</p>
								</Alert>
							)}

							{/* Login Form */}
							<form className="space-y-5" onSubmit={handleSubmit}>
								{/* Email/Username Field */}
								<div className="space-y-2">
									<div className="relative">
										<Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
										<Input
											id="username"
											name="username"
											type="text"
											autoComplete="username"
											placeholder="Email"
											value={username}
											onChange={(e) => setUsername(e.target.value)}
											className="w-full pl-10 h-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
											disabled={loading}
										/>
									</div>
								</div>

								{/* Password Field */}
								<div className="space-y-2">
									<div className="relative">
										<Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
										<Input
											id="password"
											name="password"
											type={showPassword ? 'text' : 'password'}
											autoComplete="current-password"
											placeholder="Password"
											value={password}
											onChange={(e) => setPassword(e.target.value)}
											className="w-full pl-10 pr-10 h-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
											disabled={loading}
										/>
										<button
											type="button"
											onClick={handleTogglePasswordVisibility}
											className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
											aria-label={showPassword ? 'Hide password' : 'Show password'}
											disabled={loading}
										>
											{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
										</button>
									</div>
								</div>

								{/* Remember Me and Forgot Password */}
								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-2">
										<Checkbox
											id="remember"
											checked={rememberMe}
											onCheckedChange={(checked) => setRememberMe(checked === true)}
											className="border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
											disabled={loading}
										/>
										<label
											htmlFor="remember"
											className="text-sm font-medium text-gray-700 cursor-pointer select-none"
										>
											Remember me
										</label>
									</div>
									<button
										type="button"
										className="text-sm text-blue-600 hover:text-blue-700 transition-colors underline"
										onClick={handleForgotPasswordOpen}
										disabled={loading}
									>
										Forgot password?
									</button>
								</div>

								{/* Login Button */}
								<Button
									type="submit"
									className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium text-base shadow-lg shadow-blue-600/30 transition-all"
									disabled={loading}
								>
									{loading ? (
										<div className="flex items-center justify-center gap-2">
											<div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
											Signing in...
										</div>
									) : (
										'Log In'
									)}
								</Button>
							</form>
						</div>
					</div>
				</div>
			</div>

			{/* Forgot Password Dialog */}
			<Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Reset Password</DialogTitle>
						<DialogDescription>
							Enter your email address and we'll send you a link to reset your password.
						</DialogDescription>
					</DialogHeader>

					{forgotPasswordSuccess ? (
						<div className="space-y-4 py-4">
							<div className="rounded-lg bg-green-50 border border-green-200 p-4">
								<div className="flex items-start gap-3">
									<div className="flex-shrink-0">
										<Mail className="h-5 w-5 text-green-600" />
									</div>
									<div className="flex-1">
										<h4 className="text-sm font-medium text-green-900 mb-1">
											Password reset email sent
										</h4>
										<p className="text-sm text-green-700">
											If the email address <strong>{forgotPasswordEmail}</strong> exists in our system,
											you will receive a password reset link shortly.
										</p>
									</div>
								</div>
							</div>
							<DialogFooter>
								<Button onClick={handleForgotPasswordClose} className="w-full sm:w-auto">
									Close
								</Button>
							</DialogFooter>
						</div>
					) : (
						<form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
							<div className="space-y-2">
								<label htmlFor="forgot-password-email" className="text-sm font-medium text-gray-700">
									Email Address
								</label>
								<div className="relative">
									<Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
									<Input
										id="forgot-password-email"
										type="email"
										placeholder="Enter your email"
										value={forgotPasswordEmail}
										onChange={(e) => setForgotPasswordEmail(e.target.value)}
										className="pl-10"
										disabled={forgotPasswordLoading}
										autoFocus
									/>
								</div>
								{forgotPasswordError && (
									<Alert variant="destructive" className="py-2">
										<p className="text-sm">{forgotPasswordError}</p>
									</Alert>
								)}
							</div>

							<DialogFooter className="gap-2 sm:gap-0">
								<Button
									type="button"
									variant="outline"
									onClick={handleForgotPasswordClose}
									disabled={forgotPasswordLoading}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={forgotPasswordLoading}>
									{forgotPasswordLoading ? (
										<div className="flex items-center gap-2">
											<div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
											Sending...
										</div>
									) : (
										'Send Reset Link'
									)}
								</Button>
							</DialogFooter>
						</form>
					)}
				</DialogContent>
			</Dialog>
		</div>
	)
}