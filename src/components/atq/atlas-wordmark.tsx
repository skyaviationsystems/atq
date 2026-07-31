import Image from "next/image";
import Link from "next/link";
import { cx } from "@/utils/cx";

interface AtlasWordmarkProps {
    compact?: boolean;
    className?: string;
}

export function AtlasWordmark({ compact = false, className }: AtlasWordmarkProps) {
    return (
        <Link
            href="/operations"
            aria-label="Atlas Air Training and Qualification home"
            className={cx("group flex min-w-0 items-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-white/80", className)}
        >
            <span className={cx("min-w-0", compact ? "w-14" : "w-[184px]")}>
                <span className={cx("relative block overflow-hidden", compact ? "h-8 w-14" : "h-8 w-[184px]")}>
                    <Image
                        src="/atlas-air-logo-reverse.png"
                        alt="Atlas Air"
                        width={500}
                        height={500}
                        priority
                        className={cx(
                            "absolute top-1/2 h-auto max-w-none -translate-y-1/2 mix-blend-screen brightness-0 invert",
                            compact ? "-left-[52px] w-40" : "-left-1 w-[190px]",
                        )}
                    />
                </span>
                {!compact && <span className="block truncate pl-1 text-[9px] font-semibold tracking-[0.16em] text-blue-100">TRAINING &amp; QUALIFICATION</span>}
            </span>
        </Link>
    );
}
