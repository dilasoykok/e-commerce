type Props = {
  className?: string;
  /** Aynı sayfada birden fazla logo olduğunda gradient id'leri çakışmasın */
  id: string;
};

export default function Logo({ className, id }: Props) {
  const gradientId = `logoWood${id}`;
  const font = "'Inter Variable', Inter, ui-sans-serif, system-ui, sans-serif";

  return (
    <svg viewBox="0 0 216 52" className={className} role="img" aria-label="Soykök Ticaret" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c99a5f" />
          <stop offset="1" stopColor="#8a5726" />
        </linearGradient>
      </defs>
      {/* S işareti: arkada koyu gölge, önde ahşap yüz */}
      <path d="M12 7h34v11H23v6h23v27H12V40h23v-6H12z" fill="#5e3b1b" />
      <path d="M8 3h34v11H19v6h23v27H8V36h23v-6H8z" fill={`url(#${gradientId})`} />
      <g fill="currentColor">
        <text x="58" y="31" fontSize="30" fontWeight="700" textLength="152" lengthAdjust="spacingAndGlyphs" fontFamily={font}>
          SOYKÖK
        </text>
        <text x="62" y="47" fontSize="9" fontWeight="500" textLength="128" lengthAdjust="spacing" fontFamily={font}>
          TİCARET
        </text>
      </g>
    </svg>
  );
}
