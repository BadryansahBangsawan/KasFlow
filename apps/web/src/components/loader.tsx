import TetrisLoading from "@KasFlow/ui/components/tetris-loader";

export default function Loader() {
	return (
		<div className="flex h-full items-center justify-center pt-8">
			<TetrisLoading size="sm" loadingText="Memuat..." />
		</div>
	);
}
