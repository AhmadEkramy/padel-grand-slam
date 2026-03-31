import { Instagram, Facebook, Phone } from "lucide-react";

const socialLinks = [
  {
    name: "Instagram",
    icon: Instagram,
    href: "https://www.instagram.com/_ahmedekramy?igsh=MXJmY2ljdjZzenZiMw%3D%3D",
  },
  {
    name: "Facebook",
    icon: Facebook,
    href: "https://www.facebook.com/ahmed.ekramy.343411?rdid=wUo4IeqIuEvUNzfF&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F16iD6otQMv%2F#",
  },
  {
    name: "WhatsApp",
    icon: Phone,
    href: "https://wa.me/201094543689",
  },
];

export default function Footer() {
  return (
    <footer className="relative bg-[hsl(220,30%,10%)] border-t border-white/10 overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[hsl(248,100%,6%)] to-transparent opacity-50 pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-12 pb-8 text-center">
        {/* Author Info */}
        <h3 className="font-heading text-xl md:text-2xl font-bold text-white mb-1">
          Website by Ahmed Ekramy
        </h3>
        <p className="text-white/50 text-sm md:text-base mb-8 tracking-wide">
          Computer Engineer
        </p>

        {/* Social Icons */}
        <div className="flex items-center justify-center gap-10 md:gap-14 mb-8">
          {socialLinks.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center gap-2"
              >
                <span className="flex items-center justify-center w-14 h-14 rounded-full border-2 border-sky-400/40 text-sky-400 transition-all duration-300 group-hover:border-sky-400 group-hover:bg-sky-400/10 group-hover:scale-110 group-hover:shadow-[0_0_20px_hsl(197_73%_40%/0.35)]">
                  <Icon className="w-6 h-6" />
                </span>
                <span className="text-sky-400/80 text-xs font-medium tracking-wide group-hover:text-sky-300 transition-colors duration-300">
                  {link.name}
                </span>
              </a>
            );
          })}
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/15 to-transparent mb-6" />

        {/* Copyright */}
        <p className="text-white/35 text-xs md:text-sm">
          © {new Date().getFullYear()} Grand Slam. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
