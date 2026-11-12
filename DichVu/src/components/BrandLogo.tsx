import React from "react";

interface BrandLogoProps {
  brandName?: string | null;
  className?: string;
  size?: number;
}

export function normalizeBrandName(name?: string | null): string {
  if (!name) return "default";
  const lower = name.toLowerCase().trim();
  if (lower.includes("openai") || lower.includes("chatgpt") || lower.includes("gpt")) return "openai";
  if (lower.includes("claude") || lower.includes("anthropic")) return "claude";
  if (lower.includes("cursor")) return "cursor";
  if (lower.includes("codex")) return "codex";
  if (lower.includes("gemini") || lower.includes("google")) return "gemini";
  if (lower.includes("deepseek")) return "deepseek";
  if (lower.includes("capcut")) return "capcut";
  if (lower.includes("office") || lower.includes("365") || lower.includes("microsoft")) return "microsoft";
  if (lower.includes("windows") || lower.includes("win")) return "windows";
  if (lower.includes("canva")) return "canva";
  if (lower.includes("adobe") || lower.includes("photoshop") || lower.includes("ps")) return "adobe";
  if (lower.includes("meitu")) return "meitu";
  if (lower.includes("figma")) return "figma";
  if (lower.includes("grok") || lower.includes("xai")) return "grok";
  if (lower.includes("veo")) return "veo";
  if (lower.includes("gmail") || lower.includes("mail")) return "mail";
  if (lower.includes("locket")) return "locket";
  if (lower.includes("telegram")) return "telegram";
  if (lower.includes("github")) return "github";
  if (lower.includes("netflix")) return "netflix";
  if (lower.includes("youtube")) return "youtube";
  if (lower.includes("spotify")) return "spotify";
  if (lower.includes("tiktok") || lower.includes("douyin")) return "tiktok";
  if (lower.includes("facebook") || lower.includes("fb")) return "facebook";
  if (lower.includes("instagram") || lower.includes("ig")) return "instagram";
  if (lower.includes("duolingo")) return "duolingo";
  if (lower.includes("xingtu") || lower.includes("醒图") || lower.includes("tinh tu")) return "xingtu";
  if (lower.includes("quizlet")) return "quizlet";
  if (lower.includes("photoroom")) return "photoroom";
  if (lower.includes("suno")) return "suno";
  if (lower.includes("hma")) return "hma";
  if (lower.includes("kling")) return "kling";
  if (lower.includes("muse")) return "muse";
  if (lower.includes("nordvpn") || lower.includes("vpn")) return "nordvpn";
  return "default";
}

export default function BrandLogo({ brandName, className = "w-4 h-4", size = 16 }: BrandLogoProps) {
  const brandKey = normalizeBrandName(brandName);

  switch (brandKey) {
    case "openai":
    case "codex":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          fillRule="evenodd"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <path d="M9.205 8.658v-2.26c0-.19.072-.333.238-.428l4.543-2.616c.619-.357 1.356-.523 2.117-.523 2.854 0 4.662 2.212 4.662 4.566 0 .167 0 .357-.024.547l-4.71-2.759a.797.797 0 00-.856 0l-5.97 3.473zm10.609 8.8V12.06c0-.333-.143-.57-.429-.737l-5.97-3.473 1.95-1.118a.433.433 0 01.476 0l4.543 2.617c1.309.76 2.189 2.378 2.189 3.948 0 1.808-1.07 3.473-2.76 4.163zM7.802 12.703l-1.95-1.142c-.167-.095-.239-.238-.239-.428V5.899c0-2.545 1.95-4.472 4.591-4.472 1 0 1.927.333 2.712.928L8.23 5.067c-.285.166-.428.404-.428.737v6.898zM12 15.128l-2.795-1.57v-3.33L12 8.658l2.795 1.57v3.33L12 15.128zm1.796 7.23c-1 0-1.927-.332-2.712-.927l4.686-2.712c.285-.166.428-.404.428-.737v-6.898l1.974 1.142c.167.095.238.238.238.428v5.233c0 2.545-1.974 4.472-4.614 4.472zm-5.637-5.303l-4.544-2.617c-1.308-.761-2.188-2.378-2.188-3.948A4.482 4.482 0 014.21 6.327v5.423c0 .333.143.571.428.738l5.947 3.449-1.95 1.118a.432.432 0 01-.476 0zm-.262 3.9c-2.688 0-4.662-2.021-4.662-4.519 0-.19.024-.38.047-.57l4.686 2.71c.286.167.571.167.856 0l5.97-3.448v2.26c0 .19-.07.333-.237.428l-4.543 2.616c-.619.357-1.356.523-2.117.523zm5.899 2.83a5.947 5.947 0 005.827-4.756C22.287 18.339 24 15.84 24 13.296c0-1.665-.713-3.282-1.998-4.448.119-.5.19-.999.19-1.498 0-3.401-2.759-5.947-5.946-5.947-.642 0-1.26.095-1.88.31A5.962 5.962 0 0010.205 0a5.947 5.947 0 00-5.827 4.757C1.713 5.447 0 7.945 0 10.49c0 1.666.713 3.283 1.998 4.448-.119.5-.19 1-.19 1.499 0 3.401 2.759 5.946 5.946 5.946.642 0 1.26-.095 1.88-.309a5.96 5.96 0 004.162 1.713z" />
        </svg>
      );

    case "claude":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* Authentic Anthropic Claude Sunburst Asterisk */}
          <path
            d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z"
            fill="#D97757"
          />
        </svg>
      );

    case "cursor":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          fillRule="evenodd"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* Authentic Cursor 3D Isometric Cube */}
          <path d="M22.106 5.68L12.5.135a.998.998 0 00-.998 0L1.893 5.68a.84.84 0 00-.419.726v11.186c0 .3.16.577.42.727l9.607 5.547a.999.999 0 00.998 0l9.608-5.547a.84.84 0 00.42-.727V6.407a.84.84 0 00-.42-.726zm-.603 1.176L12.228 22.92c-.063.108-.228.064-.228-.061V12.34a.59.59 0 00-.295-.51l-9.11-5.26c-.107-.062-.063-.228.062-.228h18.55c.264 0 .428.286.296.514z" />
        </svg>
      );

    case "gemini":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* Authentic Google Gemini Star */}
          <path
            d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z"
            fill="#3186FF"
          />
        </svg>
      );

    case "deepseek":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* Authentic DeepSeek Whale */}
          <path
            d="M23.748 4.482c-.254-.124-.364.113-.512.234-.051.039-.094.09-.137.136-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.156-.708-.311-.955-.65-.172-.241-.219-.51-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.093.172.187.129.323-.082.28-.18.552-.266.833-.055.179-.137.217-.329.14a5.526 5.526 0 01-1.736-1.18c-.857-.828-1.631-1.742-2.597-2.458a11.365 11.365 0 00-.689-.471c-.985-.957.13-1.743.388-1.836.27-.098.093-.432-.779-.428-.872.004-1.67.295-2.687.684a3.055 3.055 0 01-.465.137 9.597 9.597 0 00-2.883-.102c-1.885.21-3.39 1.102-4.497 2.623C.082 8.606-.231 10.684.152 12.85c.403 2.284 1.569 4.175 3.36 5.653 1.858 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.133-.284 4.994-1.86.47.234.962.327 1.78.397.63.059 1.236-.03 1.705-.128.735-.156.684-.837.419-.961-2.155-1.004-1.682-.595-2.113-.926 1.096-1.296 2.746-2.642 3.392-7.003.05-.347.007-.565 0-.845-.004-.17.035-.237.23-.256a4.173 4.173 0 001.545-.475c1.396-.763 1.96-2.015 2.093-3.517.02-.23-.004-.467-.247-.588zM11.581 18c-2.089-1.642-3.102-2.183-3.52-2.16-.392.024-.321.471-.235.763.09.288.207.486.371.739.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.167-1.361-.802-2.5-1.86-3.301-3.307-.774-1.393-1.224-2.887-1.298-4.482-.02-.386.093-.522.477-.592a4.696 4.696 0 011.529-.039c2.132.312 3.946 1.265 5.468 2.774.868.86 1.525 1.887 2.202 2.891.72 1.066 1.494 2.082 2.48 2.914.348.292.625.514.891.677-.802.09-2.14.11-3.054-.614zm1-6.44a.306.306 0 01.415-.287.302.302 0 01.2.288.306.306 0 01-.31.307.303.303 0 01-.304-.308zm3.11 1.596c-.2.081-.399.151-.59.16a1.245 1.245 0 01-.798-.254c-.274-.23-.47-.358-.552-.758a1.73 1.73 0 01.016-.588c.07-.327-.008-.537-.239-.727-.187-.156-.426-.199-.688-.199a.559.559 0 01-.254-.078c-.11-.054-.2-.19-.114-.358.028-.054.16-.186.192-.21.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.391.451.462.576.685.914.176.265.336.537.445.848.067.195-.019.354-.25.452z"
            fill="#4D6BFE"
          />
        </svg>
      );

    case "capcut":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          fillRule="evenodd"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* Authentic CapCut Logo */}
          <path d="M24.189 6.442V2.671l-4.535 2.383V4.91c.002-1.505-1.078-2.411-2.638-2.411H2.64C.993 2.5 0 3.407 0 4.91V8.72L6.354 12 0 15.316v3.8C0 20.595 1 21.5 2.64 21.5h14.373c1.56 0 2.639-.907 2.639-2.382v-.197l4.536 2.409v-3.828L13.64 12 24.19 6.443zM9.982 13.873l7.797 4.083H2.157l7.825-4.083zm7.741-7.828l-7.742 4.057-7.825-4.057h15.567z" />
        </svg>
      );

    case "microsoft":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
        >
          <rect x="3" y="3" width="8.5" height="8.5" rx="1" />
          <rect x="12.5" y="3" width="8.5" height="8.5" rx="1" />
          <rect x="3" y="12.5" width="8.5" height="8.5" rx="1" />
          <rect x="12.5" y="12.5" width="8.5" height="8.5" rx="1" />
        </svg>
      );

    case "canva":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M15 9.5a4 4 0 1 0 0 5" />
        </svg>
      );

    case "locket":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <rect x="3" y="8" width="18" height="13" rx="3" />
          <path d="M7 8V6a5 5 0 0 1 10 0v2" />
          <path d="M12 13v3" />
        </svg>
      );

    case "telegram":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
        >
          <path d="M21.5 4.5l-19 7.3c-1.3.5-1.3 1.3-.2 1.6l4.9 1.5 11.3-7.1c.5-.3 1-.1.6.2l-9.2 8.3v4.1c0 .6.4.8.8.4l2.5-2.4 5.2 3.8c1 .5 1.7.2 2-1l3.3-15.5c.3-1.4-.5-2-1.4-1.2z" />
        </svg>
      );

    case "netflix":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`text-red-600 ${className}`}
        >
          <path d="M4 2h4.5l5.5 14.5V2H18v20h-4.5L8 7.5V22H4V2z" />
        </svg>
      );

    case "youtube":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`text-red-600 ${className}`}
        >
          <path d="M23.5 6.2c-.3-1-.9-1.8-1.9-2.1C19.9 3.5 12 3.5 12 3.5s-7.9 0-9.6.6c-1 .3-1.6 1.1-1.9 2.1C0 7.9 0 12 0 12s0 4.1.5 5.8c.3 1 .9 1.8 1.9 2.1 1.7.6 9.6.6 9.6.6s7.9 0 9.6-.6c1-.3 1.6-1.1 1.9-2.1.5-1.7.5-5.8.5-5.8s0-4.1-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z" />
        </svg>
      );

    case "spotify":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`text-emerald-500 ${className}`}
        >
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.6 14.4c-.2.3-.5.4-.8.2-2.3-1.4-5.2-1.7-8.6-.9-.3.1-.7-.1-.8-.4-.1-.3.1-.7.4-.8 3.7-.8 6.9-.5 9.5 1.1.3.2.4.5.3.8zm1.2-2.7c-.2.4-.7.5-1.1.2-2.6-1.6-6.6-2.1-9.7-1.1-.4.1-.9-.1-1-.5-.1-.4.1-.9.5-1 3.5-1.1 7.9-.5 10.9 1.3.4.3.5.7.4 1.1zm.1-2.8C14.7 9 8.7 8.8 5.3 9.8c-.5.2-1.1-.1-1.2-.7-.2-.5.1-1.1.7-1.2 4-1.2 10.6-1 14.4 1.3.5.3.6.9.3 1.4-.3.5-.9.6-1.6.3z" />
        </svg>
      );

    case "tiktok":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
        >
          <path d="M19.5 7.4c-1.4-.1-2.6-.7-3.5-1.7V15c0 3.3-2.7 6-6 6s-6-2.7-6-6 2.7-6 6-6c.3 0 .7 0 1 .1v3.2c-.3-.1-.7-.1-1-.1-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3V2h3.3c.3 2 1.8 3.6 3.8 3.9v1.5z" />
        </svg>
      );

    case "facebook":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`text-blue-600 ${className}`}
        >
          <path d="M24 12c0-6.6-5.4-12-12-12S0 5.4 0 12c0 6 4.4 11 10.1 11.9v-8.4H7.1V12h3V9.3c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.8V12h3.4l-.5 3.5h-2.9v8.4C19.6 23 24 18 24 12z" />
        </svg>
      );

    case "instagram":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-pink-500 ${className}`}
        >
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      );

    case "duolingo":
      return (
        <svg
          width={size}
          height={size}
          viewBox="-130 -115 260 230"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* Authentic Duolingo Owl Mascot (Official Brand Vector) */}
          <ellipse cx="0" cy="0" rx="112" ry="105" fill="#58CC02" />
          <path d="M-65,25 Q0,75 65,25 Q85,-35 45,-65 Q0,-80 -45,-65 Q-85,-35 -65,25 Z" fill="#78C800" />
          <path d="M-110,-10 C-135,15 -125,60 -95,75 C-90,50 -95,15 -110,-10 Z" fill="#46A302" />
          <path d="M110,-10 C135,15 125,60 95,75 C90,50 95,15 110,-10 Z" fill="#46A302" />
          <ellipse cx="-44" cy="-18" rx="34" ry="34" fill="#FFFFFF" />
          <circle cx="-38" cy="-18" r="18" fill="#4B4B4B" />
          <circle cx="-33" cy="-22" r="7" fill="#FFFFFF" />
          <ellipse cx="44" cy="-18" rx="34" ry="34" fill="#FFFFFF" />
          <circle cx="38" cy="-18" r="18" fill="#4B4B4B" />
          <circle cx="43" cy="-22" r="7" fill="#FFFFFF" />
          <polygon points="-16,-6 16,-6 0,22" fill="#FF9600" />
          <polygon points="-12,-6 12,-6 0,16" fill="#FFC800" />
          <ellipse cx="-35" cy="102" rx="18" ry="10" fill="#FF9600" />
          <ellipse cx="35" cy="102" rx="18" ry="10" fill="#FF9600" />
        </svg>
      );

    case "adobe":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* Authentic Official Adobe Corporate Logo */}
          <rect width="24" height="24" rx="4.5" fill="#FA0F00" />
          <path
            d="M13.966 22.624l-1.69-4.281H8.122l3.892-9.144 5.662 13.425zM8.884 1.376H0v21.248zm15.116 0h-8.884L24 22.624Z"
            fill="#FFFFFF"
            transform="translate(3, 3) scale(0.75)"
          />
        </svg>
      );

    case "windows":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <path d="M2.5 4.5L10.5 3.4V11.2H2.5V4.5ZM2.5 12.8H10.5V20.6L2.5 19.5V12.8ZM11.8 3.2L21.5 1.8V11.2H11.8V3.2ZM11.8 12.8H21.5V22.2L11.8 20.8V12.8Z" fill="#0078D7" />
        </svg>
      );

    case "meitu":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <circle cx="12" cy="12" r="10" fill="#FF4D79" />
          <path d="M7 16V8l5 4.5L17 8v8" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case "grok":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );

    case "figma":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <path d="M8 24C10.2091 24 12 22.2091 12 20V16H8C5.79086 16 4 17.7909 4 20C4 22.2091 5.79086 24 8 24Z" fill="#0ACF83"/>
          <path d="M4 12C4 9.79086 5.79086 8 8 8H12V16H8C5.79086 16 4 14.2091 4 12Z" fill="#A259FF"/>
          <path d="M4 4C4 1.79086 5.79086 0 8 0H12V8H8C5.79086 8 4 6.20914 4 4Z" fill="#F24E1E"/>
          <path d="M12 0H16C18.2091 0 20 1.79086 20 4C20 6.20914 18.2091 8 16 8H12V0Z" fill="#FF7262"/>
          <path d="M20 12C20 14.2091 18.2091 16 16 16C13.7909 16 12 14.2091 12 12C12 9.79086 13.7909 8 16 8C18.2091 8 20 9.79086 20 12Z" fill="#1ABCFE"/>
        </svg>
      );

    case "veo":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <circle cx="12" cy="12" r="10" fill="#2563EB" />
          <path d="M9.5 7.5L16.5 12L9.5 16.5V7.5Z" fill="#FFFFFF" />
        </svg>
      );

    case "mail":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <path d="M2 5.5V18.5C2 19.3 2.7 20 3.5 20H6V11.5L12 16L18 11.5V20H20.5C21.3 20 22 19.3 22 18.5V5.5C22 4.4 20.7 3.8 19.8 4.4L12 10.2L4.2 4.4C3.3 3.8 2 4.4 2 5.5Z" fill="#EA4335" />
          <path d="M18 20H20.5C21.3 20 22 19.3 22 18.5V9.5L18 12.5V20Z" fill="#4285F4" />
          <path d="M2 9.5V18.5C2 19.3 2.7 20 3.5 20H6V12.5L2 9.5Z" fill="#34A853" />
        </svg>
      );

    case "xingtu":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <rect x="2" y="5" width="20" height="15" rx="4" stroke="#FF2A85" strokeWidth="2" />
          <circle cx="12" cy="12.5" r="4.5" stroke="#FF6584" strokeWidth="2" />
          <circle cx="17.5" cy="8" r="1.2" fill="#FFB199" />
          <path d="M19 3 Q19 5 21 5 Q19 5 19 7 Q19 5 17 5 Q19 5 19 3 Z" fill="#FFE082" />
        </svg>
      );

    case "quizlet":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* Authentic Quizlet Official Q Logo */}
          <rect width="24" height="24" rx="5" fill="#4257B2" />
          <path
            d="M12.779.025a11.789 11.789 0 0 0-5.338.896A11.829 11.829 0 0 0 3.058 4.11 11.928 11.928 0 0 0 .427 14.363a11.92 11.92 0 0 0 2.3 4.921 11.842 11.842 0 0 0 4.24 3.378 11.783 11.783 0 0 0 10.533-.226.327.327 0 0 1 .331.018 9.136 9.136 0 0 0 5.197 1.545.332.332 0 0 0 .332-.332v-4.038a.334.334 0 0 0-.276-.331 4.732 4.732 0 0 1-1.106-.319.329.329 0 0 1-.191-.352.33.33 0 0 1 .05-.133 11.943 11.943 0 0 0 .772-11.871 11.87 11.87 0 0 0-4.042-4.628A11.793 11.793 0 0 0 12.765.018l.013.007h.001ZM4.843 11.898a7.24 7.24 0 0 1 1.205-4.005 7.18 7.18 0 0 1 3.215-2.657 7.133 7.133 0 0 1 7.815 1.558 7.239 7.239 0 0 1 1.555 7.854 7.202 7.202 0 0 1-2.643 3.234 7.147 7.147 0 0 1-9.049-.896 7.228 7.228 0 0 1-2.103-5.089l.005.001Z"
            fill="#3CCFCF"
            transform="translate(2.4, 2.4) scale(0.8)"
          />
        </svg>
      );

    case "photoroom":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <rect x="3" y="3" width="11" height="15" rx="3" stroke="#9333EA" strokeWidth="2" />
          <rect x="9.5" y="6.5" width="11.5" height="14.5" rx="3" fill="#9333EA" fillOpacity="0.25" stroke="#EC4899" strokeWidth="1.8" />
          <path d="M19 2 Q19 4 21 4 Q19 4 19 6 Q19 4 17 4 Q19 4 19 2 Z" fill="#F472B6" />
        </svg>
      );

    case "nordvpn":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* Authentic NordVPN Official Mountain Vector */}
          <rect width="24" height="24" rx="5" fill="#001C3D" />
          <path
            d="M2.2838 21.5414A11.9866 11.9866 0 010 14.4832C0 7.8418 5.3727 2.4586 12 2.4586c6.6279 0 12 5.3832 12 12.0246a11.9853 11.9853 0 01-2.2838 7.0582l-5.7636-9.3783-.5565.9419.5645 2.6186L12 8.9338l-2.45 4.1447.5707 2.6451-2.0764-3.5555-5.7605 9.3733z"
            fill="#4687FF"
            transform="translate(2.4, 2.4) scale(0.8)"
          />
        </svg>
      );

    case "suno":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* Authentic Suno AI Soundwave Vector */}
          <rect width="24" height="24" rx="5" fill="#0D0907" />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M105.733 61c0-24.705-12.517-44.733-27.958-44.733S49.817 36.295 49.817 61h-33.55c0 24.706 12.517 44.733 27.958 44.733S72.183 85.705 72.183 61z"
            fill="#FF5400"
            transform="translate(4, 4) scale(0.131)"
          />
        </svg>
      );

    case "hma":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z" fill="#00D2FF" fillOpacity="0.2" stroke="#00D2FF" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="12" cy="10" r="2.5" fill="#00D2FF" />
          <path d="M12 12.5v4" stroke="#00D2FF" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case "kling":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <rect x="2" y="4" width="20" height="16" rx="4" stroke="#F59E0B" strokeWidth="2" />
          <polygon points="10,8 16,12 10,16" fill="#F59E0B" />
        </svg>
      );

    case "muse":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <circle cx="12" cy="12" r="9" stroke="#A855F7" strokeWidth="2" />
          <circle cx="12" cy="12" r="4" fill="#A855F7" />
        </svg>
      );

    default:
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      );
  }
}
