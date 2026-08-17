
interface PlaceholderProps {
  title: string;
  description: string;
}

export const PlaceholderPage = ({ title, description }: PlaceholderProps) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
    <div className="w-16 h-16 rounded-2xl bg-[#0EA5A0]/10 flex items-center justify-center mb-4">
      <span className="text-2xl">🚧</span>
    </div>
    <h2 className="text-lg font-bold text-[#1B2B4B] mb-1">{title}</h2>
    <p className="text-sm text-gray-400 max-w-xs">{description}</p>
  </div>
);
