import basketballLogo from "@/assets/basketballtoplogo.png";
import { cn } from "@/lib/utils";

interface TabletopLogoProps {
  className?: string;
}

export function TabletopLogo({ className }: TabletopLogoProps) {
  return (
    <h1
      className={cn(
        "flex items-center text-4xl font-black leading-none tracking-widest select-none",
        className,
      )}
    >
      <span>TABLET</span>
      <img
        src={basketballLogo}
        alt="O"
        className="h-[1.1em] w-[1.1em] object-contain ml-[0.02em] mr-[0.07em]"
      />
      {/* letter-spacing:0 removes the trailing space that shifts the title right */}
      <span className="[letter-spacing:0]">P</span>
    </h1>
  );
}
