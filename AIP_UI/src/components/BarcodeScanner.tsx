import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType, Result } from '@zxing/library';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertTriangle, Camera, Loader2, SwitchCamera } from 'lucide-react';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

/**
 * Calculate EAN-13 check digit
 */
const calculateEAN13CheckDigit = (digits: string): number => {
	if (digits.length !== 12) return 0;
	
	let sum = 0;
	for (let i = 0; i < 12; i++) {
		const digit = parseInt(digits[i], 10);
		sum += (i % 2 === 0) ? digit : digit * 3;
	}
	
	const remainder = sum % 10;
	return remainder === 0 ? 0 : 10 - remainder;
};

/**
 * Correct EAN-13 check digit if needed
 */
const correctEAN13CheckDigit = (barcode: string): string => {
	// Only process EAN-13 barcodes (13 digits)
	if (!/^\d{13}$/.test(barcode)) {
		return barcode;
	}
	
	const baseDigits = barcode.slice(0, 12);
	const currentCheckDigit = parseInt(barcode[12], 10);
	const correctCheckDigit = calculateEAN13CheckDigit(baseDigits);
	
	// If check digit is incorrect, correct it
	if (currentCheckDigit !== correctCheckDigit) {
		const corrected = baseDigits + correctCheckDigit;
		console.log(`[BarcodeScanner] Check digit corrected: ${barcode} → ${corrected}`);
		return corrected;
	}
	
	return barcode;
};

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ isOpen, onClose, onScan }) => {
	const videoRef = useRef<HTMLVideoElement>(null);
	const [error, setError] = useState<string>('');
	const [isLoading, setIsLoading] = useState(false);
	const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
	const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
	const [resolutionWarning, setResolutionWarning] = useState<string>('');
	const [diagnostics, setDiagnostics] = useState<string>('');
	const readerRef = useRef<BrowserMultiFormatReader | null>(null);
	const controlsRef = useRef<IScannerControls | null>(null);

	useEffect(() => {
		const hints = new Map();
		hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8]);

		readerRef.current = new BrowserMultiFormatReader(hints);

		if (isOpen) {
			initializeScanner();
		}

		return () => {
			stopScanning();
		};
	}, [isOpen]);

	const initializeScanner = async () => {
		try {
			setIsLoading(true);
			setError('');
			setResolutionWarning('');
			setDiagnostics('');

			if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
				throw new Error('Camera access is not supported in this browser. Please try using a modern browser like Chrome, Firefox, or Edge.');
			}

			try {
				const stream = await navigator.mediaDevices.getUserMedia({ video: true });
				stream.getTracks().forEach(track => track.stop());
			} catch (permissionErr) {
				const domError = permissionErr as DOMException;
				if (domError.name === 'NotAllowedError') {
					throw new Error(
						'Camera access was denied. To enable camera access:\n' +
							"1. Click the camera icon in your browser's address bar\n" +
							"2. Select 'Allow' to enable camera access\n" +
							"3. Refresh the page and try again"
					);
				}
				if (domError.name === 'NotFoundError') {
					throw new Error('No camera was found on your device. Please ensure you have a working camera connected.');
				}
				throw new Error(`Camera error: ${domError.message}`);
			}

			const videoDevices = await BrowserMultiFormatReader.listVideoInputDevices();
			setAvailableDevices(videoDevices);

			if (videoDevices.length === 0) {
				throw new Error('No camera devices found. Please ensure you have a working camera connected.');
			}

			const defaultDevice =
				videoDevices.find(device => device.label?.toLowerCase().includes('back')) ||
				videoDevices.find(device => device.label?.toLowerCase().includes('rear')) ||
				videoDevices[0];

			if (!defaultDevice) {
				throw new Error('Failed to select a camera device. Please refresh and try again.');
			}

			setSelectedDeviceId(defaultDevice.deviceId);
			await startScanning(defaultDevice.deviceId);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to access camera';
			setError(errorMessage);
			console.error('Camera initialization error:', err);
		} finally {
			setIsLoading(false);
		}
	};

	const startScanning = async (deviceId: string) => {
		if (!readerRef.current || !videoRef.current) return;

		try {
			setIsLoading(true);
			setError('');
			setResolutionWarning('');
			setDiagnostics('');

			const constraints: MediaStreamConstraints = {
				video: {
					deviceId: { exact: deviceId },
					facingMode: { ideal: 'environment' },
					width: { ideal: 1920 },
					height: { ideal: 1080 }
				}
			};

			controlsRef.current?.stop();
			controlsRef.current = await readerRef.current.decodeFromConstraints(constraints, videoRef.current, (result: Result | null, decodeError?: Error) => {
				if (result) {
					const barcode = result.getText();
					if (barcode) {
						// Correct check digit if needed (for EAN-13)
						const correctedBarcode = correctEAN13CheckDigit(barcode);
						onScan(correctedBarcode);
						handleClose();
					}
				}
				// Filter out NotFoundException - it's expected when no barcode is detected in a frame
				if (decodeError) {
					const errorName = decodeError.name || '';
					const errorMessage = decodeError.message || '';
					const isNotFoundException = 
						errorName.includes('NotFound') || 
						errorMessage.includes('No MultiFormat Readers') ||
						errorMessage.includes('not found');
					
					if (!isNotFoundException) {
						console.error('Scanning error:', decodeError);
					}
				}
			});

			setTimeout(() => {
				const track = videoRef.current?.srcObject instanceof MediaStream ? videoRef.current.srcObject.getVideoTracks()[0] : null;
				if (!track) {
					return;
				}
				const settings = track.getSettings();
				const resolution = `${settings.width || '?'} x ${settings.height || '?'}`;
				const deviceLabel = availableDevices.find(device => device.deviceId === deviceId)?.label || 'unknown camera';
				setDiagnostics(`Camera: ${deviceLabel} • Resolution: ${resolution}`);
				if ((settings.width ?? 0) < 1280 || (settings.height ?? 0) < 720) {
					setResolutionWarning(
						`Detected resolution ${resolution}. Increase camera resolution to at least 1280×720 or move the barcode closer so it fills most of the frame.`
					);
				}
			}, 1200);
		} catch (err) {
			setError('Failed to start scanning. Please try again.');
			console.error('Scanning error:', err);
		} finally {
			setIsLoading(false);
		}
	};

	const handleDeviceChange = async (deviceId: string) => {
		if (!deviceId) {
			return;
		}
		setSelectedDeviceId(deviceId);
		await startScanning(deviceId);
	};

	const handleClose = () => {
		stopScanning();
		onClose();
	};

	const stopScanning = () => {
		controlsRef.current?.stop();
		controlsRef.current = null;
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-[640px]">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Camera className="h-5 w-5" />
						Scan Barcode
					</DialogTitle>
					<DialogDescription>Position the barcode within the camera view to scan</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{availableDevices.length > 1 && (
						<div className="flex items-center gap-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="flex items-center gap-2"
								onClick={() => {
									const currentIndex = availableDevices.findIndex(d => d.deviceId === selectedDeviceId);
									const nextIndex = (currentIndex + 1) % availableDevices.length;
									handleDeviceChange(availableDevices[nextIndex].deviceId);
								}}
							>
								<SwitchCamera className="h-4 w-4" />
								Switch Camera
							</Button>
						</div>
					)}

					<div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
						{isLoading && (
							<div className="absolute inset-0 flex items-center justify-center bg-black/60">
								<Loader2 className="h-8 w-8 animate-spin text-white" />
							</div>
						)}
						<video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
						<div className="pointer-events-none absolute inset-4 rounded-lg border-2 border-white/25">
							<div className="absolute inset-x-10 top-1/3 h-1/3 border-2 border-blue-500/60">
								<div className="absolute inset-0 flex items-center justify-center">
									<div className="h-0.5 w-3/4 animate-pulse bg-blue-400/50" />
								</div>
							</div>
						</div>
					</div>

					{error && (
						<div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
							<p className="font-medium">Camera Issue</p>
							<p className="whitespace-pre-line">{error}</p>
							{error.includes('Camera access was denied') && (
								<div className="mt-2 flex justify-end">
									<Button
										type="button"
										size="sm"
										onClick={() => {
											setError('');
											initializeScanner();
										}}
									>
										Try Again
									</Button>
								</div>
							)}
						</div>
					)}

					{resolutionWarning && (
						<div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
							<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
							<div>
								<p className="font-medium">Low Resolution Detected</p>
								<p>{resolutionWarning}</p>
							</div>
						</div>
					)}

					{diagnostics && <p className="text-xs text-muted-foreground">{diagnostics}</p>}

					<div className="text-sm text-gray-600">
						<p className="font-medium">Tips for reliable scans:</p>
						<ul className="list-disc space-y-1 pl-4">
							<li>Fill at least half the frame width with the barcode</li>
							<li>Keep the barcode horizontal and steady within the guide</li>
							<li>Use bright, indirect lighting to avoid glare</li>
							<li>Move closer or farther if your webcam has fixed focus (ideal 30–70cm)</li>
							<li>Prefer rear/environment cameras on mobile devices</li>
						</ul>
					</div>
				</div>

				<DialogFooter>
					<Button type="button" variant="outline" onClick={handleClose}>
						Cancel
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default BarcodeScanner;