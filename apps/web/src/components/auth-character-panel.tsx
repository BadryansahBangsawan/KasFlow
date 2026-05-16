import { Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Position = {
	faceX: number;
	faceY: number;
	bodySkew: number;
};

type AuthCharacterPanelProps = {
	isTyping: boolean;
	showPassword: boolean;
	hasPassword: boolean;
};

function Pupil({
	size = 12,
	maxDistance = 5,
	pupilColor = "#2D2D2D",
	forceLookX,
	forceLookY,
}: {
	size?: number;
	maxDistance?: number;
	pupilColor?: string;
	forceLookX?: number;
	forceLookY?: number;
}) {
	const [mouseX, setMouseX] = useState(0);
	const [mouseY, setMouseY] = useState(0);
	const pupilRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleMouseMove = (event: MouseEvent) => {
			setMouseX(event.clientX);
			setMouseY(event.clientY);
		};

		window.addEventListener("mousemove", handleMouseMove);
		return () => window.removeEventListener("mousemove", handleMouseMove);
	}, []);

	const calculatePupilPosition = () => {
		if (!pupilRef.current) {
			return { x: 0, y: 0 };
		}

		if (forceLookX !== undefined && forceLookY !== undefined) {
			return { x: forceLookX, y: forceLookY };
		}

		const pupil = pupilRef.current.getBoundingClientRect();
		const pupilCenterX = pupil.left + pupil.width / 2;
		const pupilCenterY = pupil.top + pupil.height / 2;
		const deltaX = mouseX - pupilCenterX;
		const deltaY = mouseY - pupilCenterY;
		const distance = Math.min(
			Math.sqrt(deltaX ** 2 + deltaY ** 2),
			maxDistance,
		);
		const angle = Math.atan2(deltaY, deltaX);

		return {
			x: Math.cos(angle) * distance,
			y: Math.sin(angle) * distance,
		};
	};

	const pupilPosition = calculatePupilPosition();

	return (
		<div
			ref={pupilRef}
			className="rounded-full"
			style={{
				width: `${size}px`,
				height: `${size}px`,
				backgroundColor: pupilColor,
				transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
				transition: "transform 0.1s ease-out",
			}}
		/>
	);
}

function EyeBall({
	size = 48,
	pupilSize = 16,
	maxDistance = 10,
	eyeColor = "white",
	pupilColor = "#2D2D2D",
	isBlinking = false,
	forceLookX,
	forceLookY,
}: {
	size?: number;
	pupilSize?: number;
	maxDistance?: number;
	eyeColor?: string;
	pupilColor?: string;
	isBlinking?: boolean;
	forceLookX?: number;
	forceLookY?: number;
}) {
	const [mouseX, setMouseX] = useState(0);
	const [mouseY, setMouseY] = useState(0);
	const eyeRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleMouseMove = (event: MouseEvent) => {
			setMouseX(event.clientX);
			setMouseY(event.clientY);
		};

		window.addEventListener("mousemove", handleMouseMove);
		return () => window.removeEventListener("mousemove", handleMouseMove);
	}, []);

	const calculatePupilPosition = () => {
		if (!eyeRef.current) {
			return { x: 0, y: 0 };
		}

		if (forceLookX !== undefined && forceLookY !== undefined) {
			return { x: forceLookX, y: forceLookY };
		}

		const eye = eyeRef.current.getBoundingClientRect();
		const eyeCenterX = eye.left + eye.width / 2;
		const eyeCenterY = eye.top + eye.height / 2;
		const deltaX = mouseX - eyeCenterX;
		const deltaY = mouseY - eyeCenterY;
		const distance = Math.min(
			Math.sqrt(deltaX ** 2 + deltaY ** 2),
			maxDistance,
		);
		const angle = Math.atan2(deltaY, deltaX);

		return {
			x: Math.cos(angle) * distance,
			y: Math.sin(angle) * distance,
		};
	};

	const pupilPosition = calculatePupilPosition();

	return (
		<div
			ref={eyeRef}
			className="flex items-center justify-center rounded-full transition-all duration-150"
			style={{
				width: `${size}px`,
				height: isBlinking ? "2px" : `${size}px`,
				backgroundColor: eyeColor,
				overflow: "hidden",
			}}
		>
			{!isBlinking && (
				<div
					className="rounded-full"
					style={{
						width: `${pupilSize}px`,
						height: `${pupilSize}px`,
						backgroundColor: pupilColor,
						transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
						transition: "transform 0.1s ease-out",
					}}
				/>
			)}
		</div>
	);
}

export function AuthCharacterPanel({
	isTyping,
	showPassword,
	hasPassword,
}: AuthCharacterPanelProps) {
	const [mouseX, setMouseX] = useState(0);
	const [mouseY, setMouseY] = useState(0);
	const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
	const [isBlackBlinking, setIsBlackBlinking] = useState(false);
	const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
	const [isPurplePeeking, setIsPurplePeeking] = useState(false);
	const purpleRef = useRef<HTMLDivElement>(null);
	const blackRef = useRef<HTMLDivElement>(null);
	const yellowRef = useRef<HTMLDivElement>(null);
	const orangeRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleMouseMove = (event: MouseEvent) => {
			setMouseX(event.clientX);
			setMouseY(event.clientY);
		};

		window.addEventListener("mousemove", handleMouseMove);
		return () => window.removeEventListener("mousemove", handleMouseMove);
	}, []);

	useEffect(() => {
		const scheduleBlink = () => {
			const blinkTimeout = window.setTimeout(
				() => {
					setIsPurpleBlinking(true);
					window.setTimeout(() => {
						setIsPurpleBlinking(false);
						scheduleBlink();
					}, 150);
				},
				Math.random() * 4000 + 3000,
			);

			return blinkTimeout;
		};

		const timeout = scheduleBlink();
		return () => window.clearTimeout(timeout);
	}, []);

	useEffect(() => {
		const scheduleBlink = () => {
			const blinkTimeout = window.setTimeout(
				() => {
					setIsBlackBlinking(true);
					window.setTimeout(() => {
						setIsBlackBlinking(false);
						scheduleBlink();
					}, 150);
				},
				Math.random() * 4000 + 3000,
			);

			return blinkTimeout;
		};

		const timeout = scheduleBlink();
		return () => window.clearTimeout(timeout);
	}, []);

	useEffect(() => {
		if (!isTyping) {
			setIsLookingAtEachOther(false);
			return;
		}

		setIsLookingAtEachOther(true);
		const timer = window.setTimeout(() => setIsLookingAtEachOther(false), 800);
		return () => window.clearTimeout(timer);
	}, [isTyping]);

	useEffect(() => {
		if (!hasPassword || !showPassword) {
			setIsPurplePeeking(false);
			return;
		}

		const timer = window.setTimeout(
			() => {
				setIsPurplePeeking(true);
				window.setTimeout(() => setIsPurplePeeking(false), 800);
			},
			Math.random() * 3000 + 1500,
		);

		return () => window.clearTimeout(timer);
	}, [hasPassword, showPassword, isPurplePeeking]);

	const calculatePosition = (
		ref: React.RefObject<HTMLDivElement | null>,
	): Position => {
		if (!ref.current) {
			return { faceX: 0, faceY: 0, bodySkew: 0 };
		}

		const rect = ref.current.getBoundingClientRect();
		const centerX = rect.left + rect.width / 2;
		const centerY = rect.top + rect.height / 3;
		const deltaX = mouseX - centerX;
		const deltaY = mouseY - centerY;

		return {
			faceX: Math.max(-15, Math.min(15, deltaX / 20)),
			faceY: Math.max(-10, Math.min(10, deltaY / 30)),
			bodySkew: Math.max(-6, Math.min(6, -deltaX / 120)),
		};
	};

	const purplePos = calculatePosition(purpleRef);
	const blackPos = calculatePosition(blackRef);
	const yellowPos = calculatePosition(yellowRef);
	const orangePos = calculatePosition(orangeRef);
	const isPasswordVisible = hasPassword && showPassword;
	const isPasswordHidden = hasPassword && !showPassword;

	return (
		<aside className="relative hidden min-h-[calc(100svh-4rem)] overflow-hidden border-r bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
			<div className="relative z-20 flex items-center gap-2 font-semibold text-lg">
				<div className="flex size-9 items-center justify-center rounded-xl bg-white/10">
					<Sparkles className="size-4" />
				</div>
				<span>KasFlow</span>
			</div>

			<div className="relative z-20 space-y-8">
				<div>
					<p className="font-medium text-sm text-white/60">
						Secure statement analysis
					</p>
					<h2 className="mt-3 max-w-xl font-bold text-4xl leading-tight">
						Karakter ini ikut memperhatikan saat kamu mulai masuk.
					</h2>
				</div>

				<div className="relative flex h-[430px] items-end justify-center">
					<div className="relative" style={{ width: "550px", height: "400px" }}>
						<div
							ref={purpleRef}
							className="absolute bottom-0 transition-all duration-700 ease-in-out"
							style={{
								left: "70px",
								width: "180px",
								height: isTyping || isPasswordHidden ? "440px" : "400px",
								backgroundColor: "#6C3FF5",
								borderRadius: "22px 22px 0 0",
								zIndex: 1,
								transform: isPasswordVisible
									? "skewX(0deg)"
									: isTyping || isPasswordHidden
										? `skewX(${purplePos.bodySkew - 12}deg) translateX(40px)`
										: `skewX(${purplePos.bodySkew}deg)`,
								transformOrigin: "bottom center",
							}}
						>
							<div
								className="absolute flex gap-8 transition-all duration-700 ease-in-out"
								style={{
									left: isPasswordVisible
										? "20px"
										: isLookingAtEachOther
											? "55px"
											: `${45 + purplePos.faceX}px`,
									top: isPasswordVisible
										? "35px"
										: isLookingAtEachOther
											? "65px"
											: `${40 + purplePos.faceY}px`,
								}}
							>
								{[0, 1].map((eye) => (
									<EyeBall
										key={eye}
										size={18}
										pupilSize={7}
										maxDistance={5}
										isBlinking={isPurpleBlinking}
										forceLookX={
											isPasswordVisible
												? isPurplePeeking
													? 4
													: -4
												: isLookingAtEachOther
													? 3
													: undefined
										}
										forceLookY={
											isPasswordVisible
												? isPurplePeeking
													? 5
													: -4
												: isLookingAtEachOther
													? 4
													: undefined
										}
									/>
								))}
							</div>
						</div>

						<div
							ref={blackRef}
							className="absolute bottom-0 transition-all duration-700 ease-in-out"
							style={{
								left: "240px",
								width: "120px",
								height: "310px",
								backgroundColor: "#2D2D2D",
								borderRadius: "18px 18px 0 0",
								zIndex: 2,
								transform: isPasswordVisible
									? "skewX(0deg)"
									: isLookingAtEachOther
										? `skewX(${blackPos.bodySkew * 1.5 + 10}deg) translateX(20px)`
										: isTyping || isPasswordHidden
											? `skewX(${blackPos.bodySkew * 1.5}deg)`
											: `skewX(${blackPos.bodySkew}deg)`,
								transformOrigin: "bottom center",
							}}
						>
							<div
								className="absolute flex gap-6 transition-all duration-700 ease-in-out"
								style={{
									left: isPasswordVisible
										? "10px"
										: isLookingAtEachOther
											? "32px"
											: `${26 + blackPos.faceX}px`,
									top: isPasswordVisible
										? "28px"
										: isLookingAtEachOther
											? "12px"
											: `${32 + blackPos.faceY}px`,
								}}
							>
								{[0, 1].map((eye) => (
									<EyeBall
										key={eye}
										size={16}
										pupilSize={6}
										maxDistance={4}
										isBlinking={isBlackBlinking}
										forceLookX={
											isPasswordVisible
												? -4
												: isLookingAtEachOther
													? 0
													: undefined
										}
										forceLookY={
											isPasswordVisible
												? -4
												: isLookingAtEachOther
													? -4
													: undefined
										}
									/>
								))}
							</div>
						</div>

						<div
							ref={orangeRef}
							className="absolute bottom-0 transition-all duration-700 ease-in-out"
							style={{
								left: "0px",
								width: "240px",
								height: "200px",
								zIndex: 3,
								backgroundColor: "#FF9B6B",
								borderRadius: "120px 120px 0 0",
								transform: isPasswordVisible
									? "skewX(0deg)"
									: `skewX(${orangePos.bodySkew}deg)`,
								transformOrigin: "bottom center",
							}}
						>
							<div
								className="absolute flex gap-8 transition-all duration-200 ease-out"
								style={{
									left: isPasswordVisible
										? "50px"
										: `${82 + orangePos.faceX}px`,
									top: isPasswordVisible ? "85px" : `${90 + orangePos.faceY}px`,
								}}
							>
								{[0, 1].map((eye) => (
									<Pupil
										key={eye}
										forceLookX={isPasswordVisible ? -5 : undefined}
										forceLookY={isPasswordVisible ? -4 : undefined}
									/>
								))}
							</div>
						</div>

						<div
							ref={yellowRef}
							className="absolute bottom-0 transition-all duration-700 ease-in-out"
							style={{
								left: "310px",
								width: "140px",
								height: "230px",
								backgroundColor: "#E8D754",
								borderRadius: "70px 70px 0 0",
								zIndex: 4,
								transform: isPasswordVisible
									? "skewX(0deg)"
									: `skewX(${yellowPos.bodySkew}deg)`,
								transformOrigin: "bottom center",
							}}
						>
							<div
								className="absolute flex gap-6 transition-all duration-200 ease-out"
								style={{
									left: isPasswordVisible
										? "20px"
										: `${52 + yellowPos.faceX}px`,
									top: isPasswordVisible ? "35px" : `${40 + yellowPos.faceY}px`,
								}}
							>
								{[0, 1].map((eye) => (
									<Pupil
										key={eye}
										forceLookX={isPasswordVisible ? -5 : undefined}
										forceLookY={isPasswordVisible ? -4 : undefined}
									/>
								))}
							</div>
							<div
								className="absolute h-[4px] w-20 rounded-full bg-[#2D2D2D] transition-all duration-200 ease-out"
								style={{
									left: isPasswordVisible
										? "10px"
										: `${40 + yellowPos.faceX}px`,
									top: isPasswordVisible ? "88px" : `${88 + yellowPos.faceY}px`,
								}}
							/>
						</div>
					</div>
				</div>
			</div>

			<div className="relative z-20 text-sm text-white/55">
				KasFlow membaca laporan bulanan, bukan meminta akses langsung ke
				rekening.
			</div>
		</aside>
	);
}
