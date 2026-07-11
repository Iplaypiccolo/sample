import React from "react";

export interface AvatarData {
  skinColor: string;
  eyeShape: string;
  mouthShape: string;
  hairStyle: string;
  hairColor: string;
  faceShape: string;
  clothes: string;
}

export const SKIN_COLORS = [
  { value: "#ffd1b3", label: "밝은 피부" },
  { value: "#e0a98c", label: "보통 피부" },
  { value: "#b37a5d", label: "그을린 피부" },
  { value: "#82533c", label: "어두운 피부" }
];

export const FACE_SHAPES = [
  { value: "oval", label: "달걀형" },
  { value: "round", label: "둥근형" },
  { value: "square", label: "각진형" }
];

export const EYE_SHAPES = [
  { value: "normal", label: "초롱초롱" },
  { value: "happy", label: "웃는 눈" },
  { value: "cool", label: "날카로운 눈" },
  { value: "wink", label: "윙크" }
];

export const MOUTH_SHAPES = [
  { value: "smile", label: "미소" },
  { value: "grin", label: "기쁜 웃음" },
  { value: "surprised", label: "놀람" },
  { value: "neutral", label: "단호함" }
];

export const HAIR_STYLES = [
  { value: "short", label: "숏컷" },
  { value: "bob", label: "단발머리" },
  { value: "long", label: "긴 머리" },
  { value: "curly", label: "곱슬머리" },
  { value: "mohawk", label: "모히칸" },
  { value: "none", label: "대머리" }
];

export const HAIR_COLORS = [
  { value: "#171717", label: "블랙" },
  { value: "#78350f", label: "브라운" },
  { value: "#ca8a04", label: "골드" },
  { value: "#b91c1c", label: "레드" },
  { value: "#1e1b4b", label: "네이비" }
];

export const CLOTHES_COLORS = [
  { value: "#b91c1c", label: "레드 후드" },
  { value: "#1d4ed8", label: "블루 셔츠" },
  { value: "#15803d", label: "그린 티" },
  { value: "#a21caf", label: "퍼플 슈트" },
  { value: "#ca8a04", label: "옐로 니트" }
];

interface Props {
  avatar: AvatarData;
  sizeClass?: string;
}

export const AvatarRenderer: React.FC<Props> = ({ avatar, sizeClass = "w-24 h-24" }) => {
  const { skinColor, eyeShape, mouthShape, hairStyle, hairColor, faceShape, clothes } = avatar;

  // Render Face Shape Path
  const getFacePath = () => {
    switch (faceShape) {
      case "round":
        return <path d="M25,45 Q50,15 75,45 Q75,72 50,78 Q25,72 25,45 Z" fill={skinColor} />;
      case "square":
        return <path d="M25,40 Q50,15 75,40 L73,68 Q50,82 27,68 Z" fill={skinColor} />;
      case "oval":
      default:
        return <path d="M25,45 Q50,10 75,45 Q75,75 50,82 Q25,75 25,45 Z" fill={skinColor} />;
    }
  };

  // Render Ears
  const renderEars = () => (
    <>
      <circle cx="21" cy="48" r="5" fill={skinColor} />
      <circle cx="79" cy="48" r="5" fill={skinColor} />
    </>
  );

  // Render Eyes
  const renderEyes = () => {
    switch (eyeShape) {
      case "happy":
        return (
          <>
            <path d="M35,46 Q40,40 45,46" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M55,46 Q60,40 65,46" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" fill="none" />
          </>
        );
      case "cool":
        return (
          <>
            <path d="M34,42 L46,45" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
            <rect x="36" y="45" width="8" height="4" rx="1" fill="#1e293b" />
            <path d="M54,45 L66,42" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
            <rect x="56" y="45" width="8" height="4" rx="1" fill="#1e293b" />
          </>
        );
      case "wink":
        return (
          <>
            <circle cx="40" cy="46" r="3.5" fill="#1e293b" />
            <circle cx="39" cy="45" r="1" fill="white" />
            <path d="M55,46 Q60,42 65,46" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" fill="none" />
          </>
        );
      case "normal":
      default:
        return (
          <>
            <circle cx="40" cy="46" r="4" fill="#1e293b" />
            <circle cx="38.5" cy="44.5" r="1.2" fill="white" />
            <circle cx="60" cy="46" r="4" fill="#1e293b" />
            <circle cx="58.5" cy="44.5" r="1.2" fill="white" />
          </>
        );
    }
  };

  // Render Mouth
  const renderMouth = () => {
    switch (mouthShape) {
      case "grin":
        return <path d="M42,60 Q50,72 58,60 Z" fill="#b91c1c" stroke="#1e293b" strokeWidth="1" />;
      case "surprised":
        return <circle cx="50" cy="62" r="3.5" fill="#475569" />;
      case "neutral":
        return <line x1="44" y1="62" x2="56" y2="62" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />;
      case "smile":
      default:
        return <path d="M43,58 Q50,65 57,58" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" fill="none" />;
    }
  };

  // Render Hair
  const renderHair = () => {
    switch (hairStyle) {
      case "short":
        return (
          <>
            <path d="M22,40 Q50,10 78,40 Q82,25 70,18 Q50,10 30,18 Q18,25 22,40 Z" fill={hairColor} />
            {/* Bangs */}
            <path d="M24,38 L30,42 L36,36 L43,42 L50,35 L57,42 L64,36 L70,42 L76,38 L72,30 L28,30 Z" fill={hairColor} />
          </>
        );
      case "bob":
        return (
          <>
            {/* Back Hair */}
            <path d="M20,40 L20,58 Q20,62 25,62 L30,62 L30,40 Z" fill={hairColor} />
            <path d="M80,40 L80,58 Q80,62 75,62 L70,62 L70,40 Z" fill={hairColor} />
            {/* Front & Cap */}
            <path d="M22,40 Q50,12 78,40 Q75,20 50,18 Q25,20 22,40 Z" fill={hairColor} />
            <path d="M22,40 Q50,30 78,40 Q70,28 50,28 Q30,28 22,40 Z" fill={hairColor} />
          </>
        );
      case "long":
        return (
          <>
            {/* Cascading Back Hair */}
            <path d="M21,38 C16,45 15,65 18,80 C21,80 25,80 26,70 C27,55 27,45 27,38 Z" fill={hairColor} />
            <path d="M79,38 C84,45 85,65 82,80 C79,80 75,80 74,70 C73,55 73,45 73,38 Z" fill={hairColor} />
            {/* Front dome */}
            <path d="M22,40 Q50,10 78,40 Q75,18 50,16 Q25,18 22,40 Z" fill={hairColor} />
            <path d="M22,38 Q35,32 50,38 Q65,32 78,38 L76,30 L24,30 Z" fill={hairColor} />
          </>
        );
      case "curly":
        return (
          <g fill={hairColor}>
            {/* Curly clouds */}
            <circle cx="28" cy="30" r="10" />
            <circle cx="40" cy="22" r="11" />
            <circle cx="52" cy="20" r="11" />
            <circle cx="64" cy="22" r="11" />
            <circle cx="72" cy="30" r="10" />
            <circle cx="22" cy="40" r="8" />
            <circle cx="78" cy="40" r="8" />
            {/* Overlap */}
            <path d="M26,38 Q50,25 74,38 Q60,30 50,30 Q40,30 26,38 Z" />
          </g>
        );
      case "mohawk":
        return (
          <path d="M44,22 Q50,0 56,22 L54,32 L46,32 Z" fill={hairColor} />
        );
      case "none":
      default:
        return null;
    }
  };

  // Render Clothes
  const renderClothes = () => {
    return (
      <g>
        {/* Main Body shoulders */}
        <path d="M15,82 C22,72 32,70 50,72 C68,70 78,72 85,82 L88,100 L12,100 Z" fill={clothes} />
        {/* Collar V-Neck */}
        <path d="M42,72 L50,84 L58,72 Z" fill={skinColor} />
        {/* Inner shadow/details */}
        <path d="M40,73 L50,85 L60,73" stroke="rgba(0,0,0,0.15)" strokeWidth="2.5" fill="none" />
      </g>
    );
  };

  return (
    <div className={`relative ${sizeClass} select-none shrink-0`}>
      <svg viewBox="0 0 100 100" className="w-full h-full rounded-full border-2 border-slate-700 bg-slate-900 shadow-lg overflow-hidden">
        {/* Background ambient lighting */}
        <radialGradient id="bg-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="100%" stopColor="#0f172a" />
        </radialGradient>
        <rect width="100" height="100" fill="url(#bg-glow)" />

        {/* Ears */}
        {renderEars()}

        {/* Face Shape */}
        {getFacePath()}

        {/* Eyes */}
        {renderEyes()}

        {/* Mouth */}
        {renderMouth()}

        {/* Hair */}
        {renderHair()}

        {/* Clothes */}
        {renderClothes()}
      </svg>
    </div>
  );
};
