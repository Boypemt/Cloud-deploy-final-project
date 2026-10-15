import { useState } from "react";
import type { Category } from "../api/products";
export default function ProductArt({
  name,
  category,
  imageUrl,
}: {
  name: string;
  category: Category;
  imageUrl?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (imageUrl && /^https?:\/\//i.test(imageUrl) && !failed)
    return (
      <img
        className="product-image"
        src={imageUrl}
        alt={name}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  const lower = name.toLowerCase();
  return (
    <svg
      viewBox="0 0 280 210"
      className="product-art"
      role="img"
      aria-label={`${name} illustration`}
    >
      <ellipse cx="140" cy="180" rx="66" ry="10" fill="#24123c" opacity=".08" />
      {category === "stationery" ? (
        lower.includes("pen") ? (
          <g transform="rotate(-25 140 105)">
            {[102, 132, 162].map((x, i) => (
              <g key={x}>
                <rect
                  x={x}
                  y="35"
                  width="14"
                  height="122"
                  rx="6"
                  fill={["#66518f", "#8c83bd", "#b7abd4"][i]}
                />
                <path d={`M${x} 157h14l-7 22z`} fill="#d1b99e" />
                <path d={`M${x + 5} 172h4l-2 7z`} fill="#3f365b" />
                <rect
                  x={x + 2}
                  y="43"
                  width="10"
                  height="30"
                  rx="3"
                  fill="#eee9f3"
                />
                <path d={`M${x + 11} 44v35`} stroke="#a99bbd" strokeWidth="3" />
              </g>
            ))}
          </g>
        ) : (
          <g transform="rotate(-13 140 105)">
            <rect
              x="84"
              y="29"
              width="113"
              height="150"
              rx="7"
              fill="#b0a376"
            />
            <rect
              x="78"
              y="24"
              width="113"
              height="150"
              rx="6"
              fill="#d6caa5"
            />
            <path d="M91 24v150" stroke="#a79b74" strokeWidth="3" />
            <rect x="110" y="54" width="59" height="38" rx="2" fill="#f7f1df" />
            <text
              x="139"
              y="70"
              textAnchor="middle"
              fontSize="8"
              fill="#66593d"
              fontFamily="sans-serif"
            >
              CAMPUS
            </text>
            <text
              x="139"
              y="82"
              textAnchor="middle"
              fontSize="6"
              fill="#66593d"
              fontFamily="sans-serif"
            >
              NOTES & IDEAS
            </text>
            <path d="M154 150h22" stroke="#9f9066" strokeWidth="2" />
          </g>
        )
      ) : category === "clothing" ? (
        <g>
          <path
            d="M114 43q26-20 52 0l18 14 39 62-28 18-17-27v66H99v-66l-17 27-28-18 39-62z"
            fill="#8976b0"
          />
          <path d="M114 43q26 48 52 0l-6-11q-20-15-40 0z" fill="#655084" />
          <path
            d="M115 44q25 32 49 0"
            fill="none"
            stroke="#b2a0d0"
            strokeWidth="4"
          />
          <path d="M127 60v37m26-37v37" stroke="#e6dff0" strokeWidth="2" />
          <path d="M119 139h39l10 23h-59z" fill="#79649f" />
          <text
            x="139"
            y="119"
            textAnchor="middle"
            fontSize="14"
            fill="#f0e9f6"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            CAMT
          </text>
          <path d="M100 171h77" stroke="#69548c" strokeWidth="7" />
        </g>
      ) : category === "food" ? (
        lower.includes("tea") ? (
          <g>
            <path d="M108 65h66l-8 111h-50z" fill="#d49a60" />
            <path d="M108 68h66l-2 17h-63z" fill="#eed3ac" />
            <rect x="104" y="57" width="74" height="12" rx="5" fill="#eee9e2" />
            <path d="M145 57l9-36" stroke="#8d729f" strokeWidth="7" />
            <ellipse cx="141" cy="173" rx="24" ry="4" fill="#b77c47" />
            <rect
              x="117"
              y="97"
              width="46"
              height="44"
              rx="20"
              fill="#f3e4cc"
            />
            <text
              x="140"
              y="122"
              textAnchor="middle"
              fontSize="10"
              fill="#88603e"
              fontFamily="sans-serif"
            >
              milk tea
            </text>
            <path
              d="M118 75l5 93"
              stroke="#f8ddb7"
              strokeWidth="4"
              opacity=".5"
            />
          </g>
        ) : (
          <g>
            <path d="M86 62h108l-12 108H98z" fill="#d5956c" />
            <ellipse cx="140" cy="62" rx="54" ry="17" fill="#ead7ac" />
            <ellipse cx="140" cy="62" rx="44" ry="10" fill="#d2ad6d" />
            <path
              d="M110 60q20-13 35 0t30 0M104 65q20-13 35 0t30 0"
              fill="none"
              stroke="#f9df9a"
              strokeWidth="3"
            />
            <rect x="111" y="96" width="58" height="43" rx="3" fill="#f6e5bf" />
            <text
              x="140"
              y="114"
              textAnchor="middle"
              fontSize="9"
              fill="#9f6247"
              fontFamily="sans-serif"
            >
              CAMPUS
            </text>
            <text
              x="140"
              y="128"
              textAnchor="middle"
              fontSize="10"
              fill="#9f6247"
              fontFamily="sans-serif"
            >
              NOODLES
            </text>
          </g>
        )
      ) : category === "electronics" ? (
        lower.includes("mouse") ? (
          <g transform="rotate(-20 140 105)">
            <rect
              x="97"
              y="39"
              width="85"
              height="133"
              rx="42"
              fill="#ddd8e7"
            />
            <path d="M99 99h81M140 40v59" stroke="#b9b0ca" strokeWidth="2" />
            <rect x="135" y="60" width="10" height="24" rx="5" fill="#88759f" />
            <path
              d="M111 115q-7 29 9 41"
              fill="none"
              stroke="#f9f6fb"
              strokeWidth="5"
            />
          </g>
        ) : (
          <g>
            <path
              d="M106 60c-67 10-62 103 18 103 81 0 94-98 27-100-54-1-59 76-8 76 38 0 52-48 23-65"
              fill="none"
              stroke="#c6c1d2"
              strokeWidth="11"
            />
            <path d="M106 60v-16m60 30V47" stroke="#b0a7bf" strokeWidth="8" />
            <rect x="96" y="29" width="20" height="27" rx="5" fill="#eeeaf2" />
            <rect x="100" y="20" width="12" height="13" rx="3" fill="#9f97ad" />
            <rect x="156" y="36" width="20" height="28" rx="5" fill="#eeeaf2" />
            <rect x="160" y="26" width="12" height="14" rx="3" fill="#9f97ad" />
          </g>
        )
      ) : (
        <g>
          <path
            d="M174 79h15q33 0 25 36-4 22-38 20"
            fill="none"
            stroke="#a49c85"
            strokeWidth="13"
          />
          <path d="M88 66h91v89q0 23-45 23t-46-23z" fill="#d9d1b9" />
          <ellipse cx="134" cy="66" rx="45" ry="12" fill="#f0e9d9" />
          <ellipse cx="134" cy="66" rx="35" ry="7" fill="#8e735f" />
          <text
            x="133"
            y="119"
            textAnchor="middle"
            fontSize="12"
            fill="#65583f"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            CAMPUS
          </text>
          <text
            x="133"
            y="136"
            textAnchor="middle"
            fontSize="10"
            fill="#65583f"
            fontFamily="sans-serif"
          >
            little moments.
          </text>
        </g>
      )}
    </svg>
  );
}
