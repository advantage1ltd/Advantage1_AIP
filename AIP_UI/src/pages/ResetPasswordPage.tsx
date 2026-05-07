import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Lock, Mail, CheckCircle } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { api } from '@/config/api'
import { useToast } from '@/hooks/use-toast'

export default function ResetPasswordPage() {
	const [searchParams] = useSearchParams()
	const navigate = useNavigate()
	const { toast } = useToast()

	const [token, setToken] = useState<string>('')
	const [email, setEmail] = useState<string>('')
	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirmPassword, setShowConfirmPassword] = useState(false)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState(false)

	useEffect(() => {
		// Extract token and email from URL parameters
		const tokenParam = searchParams.get('token')
		const emailParam = searchParams.get('email')

		if (!tokenParam || !emailParam) {
			setError('Invalid or missing reset link. Please request a new password reset.')
			return
		}

		// Decode the parameters
		setToken(decodeURIComponent(tokenParam))
		setEmail(decodeURIComponent(emailParam))
	}, [searchParams])

	const validatePassword = (): boolean => {
		if (!password.trim()) {
			setError('Password is required')
			return false
		}

		if (password.length < 8) {
			setError('Password must be at least 8 characters long')
			return false
		}

		if (password.length > 100) {
			setError('Password must be less than 100 characters')
			return false
		}

		if (password !== confirmPassword) {
			setError('Passwords do not match')
			return false
		}

		return true
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError(null)

		if (!validatePassword()) {
			return
		}

		if (!token || !email) {
			setError('Invalid reset link. Please request a new password reset.')
			return
		}

		setLoading(true)

		try {
			const response = await api.post('/Auth/reset-password', {
				Token: token,
				Email: email,
				NewPassword: password,
			})

			if (response.data.success) {
				setSuccess(true)
				toast({
					title: 'Password reset successful',
					description: 'Your password has been reset successfully. You can now log in with your new password.',
				})

				// Redirect to login after 3 seconds
				setTimeout(() => {
					navigate('/login', { replace: true })
				}, 3000)
			} else {
				setError(response.data.message || 'Failed to reset password')
			}
		} catch (err: any) {
			console.error('❌ Reset password error:', err)
			const errorMessage =
				err.response?.data?.message ||
				err.response?.data?.errors?.join(', ') ||
				err.message ||
				'An error occurred while resetting your password. Please try again.'
			setError(errorMessage)
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
			<div className="w-full max-w-md">
				<div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8">
					{/* Header */}
					<div className="text-center mb-6">
						<div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
							<Lock className="h-6 w-6 text-blue-600" />
						</div>
						<h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Your Password</h1>
						<p className="text-sm text-gray-600">
							Enter your new password below
						</p>
					</div>

					{/* Success State */}
					{success ? (
						<div className="space-y-4">
							<div className="rounded-lg bg-green-50 border border-green-200 p-4">
								<div className="flex items-start gap-3">
									<CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
									<div className="flex-1">
										<h4 className="text-sm font-medium text-green-900 mb-1">
											Password reset successful!
										</h4>
										<p className="text-sm text-green-700">
											Your password has been reset successfully. You will be redirected to the login page shortly.
										</p>
									</div>
								</div>
							</div>
							<Button
								onClick={() => navigate('/login', { replace: true })}
								className="w-full bg-blue-600 hover:bg-blue-700"
							>
								Go to Login
							</Button>
						</div>
					) : (
						<form onSubmit={handleSubmit} className="space-y-5">
							{/* Email Display (Read-only) */}
							<div className="space-y-2">
								<label htmlFor="email" className="text-sm font-medium text-gray-700">
									Email Address
								</label>
								<div className="relative">
									<Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
									<Input
										id="email"
										type="email"
										value={email}
										disabled
										className="pl-10 bg-gray-50 cursor-not-allowed"
									/>
								</div>
							</div>

							{/* New Password */}
							<div className="space-y-2">
								<label htmlFor="password" className="text-sm font-medium text-gray-700">
									New Password
								</label>
								<div className="relative">
									<Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
									<Input
										id="password"
										name="password"
										type={showPassword ? 'text' : 'password'}
										placeholder="Enter new password"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										className="w-full pl-10 pr-10"
										disabled={loading || !token || !email}
										autoFocus
									/>
									<button
										type="button"
										onClick={() => setShowPassword((prev) => !prev)}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
										aria-label={showPassword ? 'Hide password' : 'Show password'}
										disabled={loading}
									>
										{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
									</button>
								</div>
								<p className="text-xs text-gray-500">Password must be at least 8 characters long</p>
							</div>

							{/* Confirm Password */}
							<div className="space-y-2">
								<label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
									Confirm New Password
								</label>
								<div className="relative">
									<Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
									<Input
										id="confirmPassword"
										name="confirmPassword"
										type={showConfirmPassword ? 'text' : 'password'}
										placeholder="Confirm new password"
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										className="w-full pl-10 pr-10"
										disabled={loading || !token || !email}
									/>
									<button
										type="button"
										onClick={() => setShowConfirmPassword((prev) => !prev)}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
										aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
										disabled={loading}
									>
										{showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
									</button>
								</div>
							</div>

							{/* Error Alert */}
							{error && (
								<Alert variant="destructive">
									<p className="text-sm">{error}</p>
								</Alert>
							)}

							{/* Submit Button */}
							<Button
								type="submit"
								className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
								disabled={loading || !token || !email}
							>
								{loading ? (
									<div className="flex items-center justify-center gap-2">
										<div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
										Resetting Password...
									</div>
								) : (
									'Reset Password'
								)}
							</Button>

							{/* Back to Login Link */}
							<div className="text-center pt-2">
								<button
									type="button"
									onClick={() => navigate('/login')}
									className="text-sm text-blue-600 hover:text-blue-700 transition-colors underline"
									disabled={loading}
								>
									Back to Login
								</button>
							</div>
						</form>
					)}
				</div>
			</div>
		</div>
	)
}
