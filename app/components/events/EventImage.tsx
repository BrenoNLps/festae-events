import { Ticket } from "lucide-react";

export function EventImage({
  src,
  alt,
  iconSize = "h-10 w-10",
}: {
  src?: string;
  alt: string;
  iconSize?: string;
}) {
  if (src) return <img src={src} alt={alt} className="w-full h-full object-cover" />;
  return (
    <div className="w-full h-full flex items-center justify-center">
      <Ticket className={`${iconSize} text-purple-300`} />
    </div>
  );
}
