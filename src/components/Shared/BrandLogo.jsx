export const LOGO_URL = "/logo.webp";

export default function BrandLogo({ size = 50, className = "", onClick = null }) {
  return (
    <a
      href="https://snippo.com/"
      className={className}
      style={{ display: "inline-flex", alignItems: "center", lineHeight: 0, cursor: "pointer", textDecoration: "none" }}
      onClick={onClick || undefined}
    >
      <img
        src="/logo.webp"
        alt="Snippo Entertainment"
        className="brand-logo-img"
        style={{ height: size, width: "auto" }}
      />
    </a>
  );
}
